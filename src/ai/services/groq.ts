import Groq from "groq-sdk";
import type { DocumentAnalysis } from "../types/action";
import { estimateTokens } from "../processing/chunking";
import { globalTokenLimiter } from "./tokenBudget";

/**
 * Domain-specific safe processing error.
 * Guaranteed to contain only safe, user-friendly error messages with zero provider leakage.
 */
export class AppProcessingError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, userMessage: string, statusCode = 500) {
    super(userMessage);
    this.name = "AppProcessingError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppProcessingError(
      "AI_SERVICE_UNAVAILABLE",
      "The document analysis service is currently not configured. Please contact the administrator.",
      503
    );
  }
  return new Groq({ apiKey });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Classifies a provider rate limit error into either DAILY (TPD) or ROLLING (TPM/RPM).
 * Extracts retry-after wait duration where available.
 */
export function classifyRateLimitError(error: unknown): {
  isDaily: boolean;
  retryAfterSeconds: number | null;
} {
  const rawMsg = error instanceof Error ? error.message : String(error);
  const lower = rawMsg.toLowerCase();

  // 1. Inspect response headers if attached to error object
  let retryAfterSeconds: number | null = null;
  const headers = (error as { headers?: { get?: (k: string) => string | null } })?.headers;
  if (headers && typeof headers.get === "function") {
    const val = headers.get("retry-after");
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) retryAfterSeconds = parsed;
    }
  }

  // 2. Parse retry wait time from message if header was missing
  if (retryAfterSeconds === null) {
    const compoundMatch = rawMsg.match(/try again in (?:(\d+)h)?(?:(\d+)m)?([\d\.]+)s/i);
    if (compoundMatch) {
      const hours = parseInt(compoundMatch[1] || "0", 10);
      const minutes = parseInt(compoundMatch[2] || "0", 10);
      const seconds = parseFloat(compoundMatch[3] || "0");
      retryAfterSeconds = Math.ceil(hours * 3600 + minutes * 60 + seconds);
    } else {
      const simpleMatch = rawMsg.match(/try again in ([\d\.]+)s/i);
      if (simpleMatch) {
        retryAfterSeconds = Math.ceil(parseFloat(simpleMatch[1]));
      }
    }
  }

  // 3. Determine if this is a Daily Token (TPD) quota limit
  // Indicators: explicit "tokens per day", "(tpd)", "tpd:", "daily", or retry window > 60 seconds
  const isDaily =
    lower.includes("tokens per day") ||
    lower.includes("(tpd)") ||
    lower.includes("tpd:") ||
    lower.includes("daily") ||
    (retryAfterSeconds !== null && retryAfterSeconds > 60);

  return { isDaily, retryAfterSeconds };
}

/**
 * Maps raw provider errors to safe, user-facing domain errors.
 * Logs full diagnostic internally, but ensures sensitive or confusing tokens/TPM/API details never reach the client.
 */
function normalizeProviderError(error: unknown): AppProcessingError {
  if (error instanceof AppProcessingError) {
    return error;
  }

  const rawStr = error instanceof Error ? error.message : String(error);
  const lower = rawStr.toLowerCase();

  // 1. Rate limits: Distinguish Daily (TPD) vs Rolling (TPM / RPM)
  if (
    lower.includes("rate limit") ||
    lower.includes("tpm") ||
    lower.includes("tpd") ||
    lower.includes("rpm") ||
    lower.includes("429")
  ) {
    const { isDaily } = classifyRateLimitError(error);
    if (isDaily) {
      return new AppProcessingError(
        "RATE_LIMIT_DAILY",
        "Daily AI processing limit reached. Please try again later.",
        429
      );
    }

    return new AppProcessingError(
      "RATE_LIMIT_TPM",
      "The analysis engine is experiencing high demand. Please wait a moment and try again.",
      429
    );
  }

  // 2. Request / Document Too Large (413)
  if (
    lower.includes("413") ||
    lower.includes("too large") ||
    lower.includes("context length") ||
    lower.includes("maximum context")
  ) {
    return new AppProcessingError(
      "DOCUMENT_TOO_LARGE",
      "This document section is too large to process in one pass. Please upload a shorter document or specific sections.",
      413
    );
  }

  // 3. Service outage / 503 / 502 / network
  if (
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    lower.includes("timeout")
  ) {
    return new AppProcessingError(
      "AI_SERVICE_UNAVAILABLE",
      "The document analysis service is temporarily unavailable. Please try again shortly.",
      503
    );
  }

  // Fallback generic safe error
  return new AppProcessingError(
    "PROCESSING_ERROR",
    "We couldn't analyze the document content. Please verify the file and try again.",
    500
  );
}

/**
 * Analyzes a text chunk with strict JSON schema output, output verbosity constraints,
 * configurable max_completion_tokens, rolling TPM rate-limiting, and controlled 1x retry.
 */
export async function analyzeDocumentChunk(
  text: string,
  chunkMeta?: { index: number; total: number }
): Promise<DocumentAnalysis> {
  const groq = getGroqClient();
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const maxCompletionTokens = parseInt(
    process.env.GROQ_MAX_COMPLETION_TOKENS || "3000",
    10
  );

  const estimatedInputTokens = estimateTokens(text);
  // Realistic completion reservation (~1200 tokens covers ~500 reasoning + dense action output)
  const totalEstimatedCost = estimatedInputTokens + 1200;

  const sectionLabel =
    chunkMeta && chunkMeta.total > 1
      ? `Analyzing Section ${chunkMeta.index + 1} of ${chunkMeta.total}.`
      : "Analyzing Document.";

  const systemPrompt = `You are Doc2Action's everyday document intelligence engine.
${sectionLabel}

Your mission: Extract only GENUINE HUMAN OBLIGATIONS, EXPLICIT DEADLINES, SCHEDULED EVENTS, and CRITICAL RULES from the document.

CRITICAL EXTRACTION PHILOSOPHY:
1. WHO IS THE ACTOR & WHAT IS AN ACTION:
   The actor is the HUMAN READER / SUBMITTER of this document (e.g. the student, author, employee, or project team).
   An action is a concrete, real-world obligation or deliverable THEY must perform:
   - Submit report, thesis, or required deliverables
   - Obtain supervisor, guide, examiner, or management approvals and signatures
   - Clear mandatory fees or financial dues
   - Present system demonstration, attend viva voce, or defend project
   - Register on official portals or complete mandatory clearance forms
   Target a focused set (typically 3–8 high-value actions per document). If a document is a technical specification or project report with only 2–4 real human obligations, return ONLY those 2–4. Quality beats quantity.

2. WHAT IS NOT AN ACTION (STRICTLY EXCLUDE):
   - Software application features, module functions, and end-user interactions with the system being described (e.g. "Customer registration/login", "Vehicle information management", "Book service appointment", "Mechanic updates job cards", "Admin analytics"). These are SOFTWARE SYSTEM CAPABILITIES or USER STORIES, NOT TASKS for the document submitter!
   - System requirements, architectural descriptions, database schemas, and tech stacks (HTML, Java, MySQL). Relocate technical prerequisites to important_notes.
   - Descriptive project summaries, background literature, or expected benefits.
   - Do NOT turn functional software specifications into user tasks.

3. CONSOLIDATE RELATED SUB-STEPS:
   If a document mentions several small steps for a single deliverable (e.g. format report, add signatures, get approval, submit report), group them into ONE comprehensive primary action (e.g. "Finalize and submit project report with guide approvals") rather than creating separate fragmented actions.

4. PRIORITIZATION RULES:
   - "high": Explicit deadline, mandatory submission, financial payment, required approval/signature, or explicitly urgent directive.
   - "medium": Mandatory requirement but without an immediate cutoff deadline.
   - "low": Optional recommendation or non-critical suggestion.

5. IMPORTANT NOTES:
   Use important_notes for vital information that is NOT an action (e.g. submission formatting rules, degree prerequisites, eligibility criteria, grading schemes, contact details).

Strict Output Constraints:
- Keep action descriptions concise (maximum 20 words).
- Keep source_snippet concise (maximum 25 words). Quote only the key clause.
- If no explicit deadline exists for an action, set deadline to null.
- If an event has no confirmed date, set date to null. Do NOT invent dates.
- Return ONLY clean JSON adhering to the specified schema.`;

  const jsonSchema = {
    type: "object" as const,
    properties: {
      actions: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            title: { type: "string" as const },
            description: { type: "string" as const },
            deadline: { type: ["string", "null"] as const },
            priority: {
              type: "string" as const,
              enum: ["high", "medium", "low"],
            },
            category: {
              type: "string" as const,
              enum: [
                "academic",
                "administrative",
                "finance",
                "event",
                "general",
              ],
            },
            source_snippet: { type: ["string", "null"] as const },
          },
          required: [
            "title",
            "description",
            "deadline",
            "priority",
            "category",
            "source_snippet",
          ],
          additionalProperties: false,
        },
      },
      deadlines: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            title: { type: "string" as const },
            due_date: { type: "string" as const },
            is_strict: { type: "boolean" as const },
          },
          required: ["title", "due_date", "is_strict"],
          additionalProperties: false,
        },
      },
      events: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            title: { type: "string" as const },
            date: { type: ["string", "null"] as const }, // Nullable per requirement 3
            location: { type: ["string", "null"] as const },
          },
          required: ["title", "date", "location"],
          additionalProperties: false,
        },
      },
      important_notes: {
        type: "array" as const,
        items: {
          type: "string" as const,
        },
      },
    },
    required: ["actions", "deadlines", "events", "important_notes"],
    additionalProperties: false,
  };

  const executeRequest = async (): Promise<DocumentAnalysis> => {
    // 1. Wait for rolling TPM rate limiter budget before sending
    await globalTokenLimiter.waitForBudget(totalEstimatedCost);

    const requestParams: any = {
      model,
      temperature: 0.1,
      max_completion_tokens: maxCompletionTokens,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "document_analysis",
          strict: true,
          schema: jsonSchema,
        },
      },
    };

    const reasoningEffort = process.env.GROQ_REASONING_EFFORT;
    if (reasoningEffort) {
      requestParams.reasoning_effort = reasoningEffort;
    }

    let response;
    try {
      response = await groq.chat.completions.create(requestParams);
    } catch (apiErr) {
      // Release in-flight reservation so retry or subsequent requests are not blocked by phantom tokens
      globalTokenLimiter.releaseReservation(totalEstimatedCost);
      throw apiErr;
    }

    // Record actual token usage if provided, else fallback to estimated
    const actualTokens = response.usage?.total_tokens ?? totalEstimatedCost;
    globalTokenLimiter.recordUsage(actualTokens, totalEstimatedCost);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AppProcessingError(
        "PROCESSING_ERROR",
        "The analysis model returned an empty response. Please try again.",
        502
      );
    }

    return JSON.parse(content) as DocumentAnalysis;
  };

  try {
    return await executeRequest();
  } catch (err: unknown) {
    // 1. Check if Daily Token (TPD) quota is exhausted
    const { isDaily, retryAfterSeconds } = classifyRateLimitError(err);
    if (isDaily) {
      console.error(
        `[GroqRateLimit] Daily token quota exhausted. No retry attempted. (Retry-after: ${
          retryAfterSeconds ?? "unknown"
        }s)`
      );
      throw normalizeProviderError(err);
    }

    // Capture temporary SERVER-SIDE diagnostic logging (Never sent to client)
    const rawError = err as {
      status?: number;
      message?: string;
      error?: { message?: string; failed_generation?: string; code?: string };
    };

    console.error(`[Server Diagnostic] Structured Output Validation Failure:`, {
      chunkIndex: chunkMeta?.index ?? 0,
      totalChunks: chunkMeta?.total ?? 1,
      estimatedInputTokens,
      model,
      validationError:
        rawError.error?.message ??
        (err instanceof Error ? err.message : String(err)),
      failedGeneration: rawError.error?.failed_generation ?? "N/A",
    });

    const isPermanent =
      err instanceof AppProcessingError &&
      (err.code === "DOCUMENT_TOO_LARGE" ||
        err.code === "OCR_REQUIRED" ||
        err.code === "RATE_LIMIT_DAILY");

    // Only retry transient errors where wait time is reasonably small (<= 20 seconds)
    const canRetry =
      !isPermanent &&
      (retryAfterSeconds === null || retryAfterSeconds <= 20);

    if (canRetry) {
      const backoffMs = retryAfterSeconds
        ? (retryAfterSeconds + 1) * 1000
        : 1500;

      console.warn(
        `[Groq Engine] Attempting 1x controlled retry for chunk ${
          (chunkMeta?.index ?? 0) + 1
        } after ${Math.ceil(backoffMs / 1000)}s backoff...`
      );
      await sleep(backoffMs);

      try {
        return await executeRequest();
      } catch (retryErr: unknown) {
        console.error(
          `[Server Diagnostic] Structured Output Retry Also Failed:`,
          retryErr instanceof Error ? retryErr.message : retryErr
        );
        throw normalizeProviderError(retryErr);
      }
    }

    throw normalizeProviderError(err);
  }
}

/**
 * Backward-compatible single document analysis.
 */
export async function analyzeDocument(
  text: string
): Promise<DocumentAnalysis> {
  return analyzeDocumentChunk(text);
}