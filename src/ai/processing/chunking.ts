import type {
  DocumentAnalysis,
  ExtractedAction,
  ExtractedDeadline,
  ExtractedEvent,
} from "../types/action";

/**
 * Hard limit for MVP document processing (approximately 35-45 pages).
 */
export const MAX_DOCUMENT_TOKENS = 12000;

/**
 * Conservative target chunk size (in tokens) to safely fit under Groq 8k TPM limit (~1.5-2k tokens).
 */
export const TARGET_CHUNK_TOKENS = 1800;

/**
 * Trailing character overlap carried into the beginning of subsequent chunks.
 */
export const CHUNK_OVERLAP_CHARS = 150;

/**
 * Conservative fast heuristic for English token estimation (~3.8 characters per token).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.8);
}

export interface ChunkInfo {
  index: number;
  totalChunks: number;
  text: string;
  estimatedTokens: number;
}

/**
 * Splits document text into paragraph-aware chunks of ~2,000-2,500 tokens with 150-char overlap.
 */
export function splitTextIntoChunks(
  fullText: string,
  targetTokens = TARGET_CHUNK_TOKENS,
  overlapChars = CHUNK_OVERLAP_CHARS
): ChunkInfo[] {
  const totalTokens = estimateTokens(fullText);

  // Single chunk fast path
  if (totalTokens <= targetTokens) {
    return [
      {
        index: 0,
        totalChunks: 1,
        text: fullText,
        estimatedTokens: totalTokens,
      },
    ];
  }

  // Split into semantic paragraphs
  const paragraphs = fullText.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunkParagraphs: string[] = [];
  let currentChunkTokens = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const paraTokens = estimateTokens(trimmed);

    // If single paragraph is oversized, split it by sentence boundaries
    if (paraTokens > targetTokens) {
      if (currentChunkParagraphs.length > 0) {
        chunks.push(currentChunkParagraphs.join("\n\n"));
        currentChunkParagraphs = [];
        currentChunkTokens = 0;
      }

      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      let sentenceBuf: string[] = [];
      let sentenceBufTokens = 0;

      for (const sent of sentences) {
        const sentTokens = estimateTokens(sent);
        if (sentenceBufTokens + sentTokens > targetTokens && sentenceBuf.length > 0) {
          chunks.push(sentenceBuf.join(" "));
          sentenceBuf = [sent];
          sentenceBufTokens = sentTokens;
        } else {
          sentenceBuf.push(sent);
          sentenceBufTokens += sentTokens;
        }
      }

      if (sentenceBuf.length > 0) {
        chunks.push(sentenceBuf.join(" "));
      }
      continue;
    }

    if (currentChunkTokens + paraTokens > targetTokens && currentChunkParagraphs.length > 0) {
      chunks.push(currentChunkParagraphs.join("\n\n"));
      currentChunkParagraphs = [trimmed];
      currentChunkTokens = paraTokens;
    } else {
      currentChunkParagraphs.push(trimmed);
      currentChunkTokens += paraTokens;
    }
  }

  if (currentChunkParagraphs.length > 0) {
    chunks.push(currentChunkParagraphs.join("\n\n"));
  }

  // Apply overlap between consecutive chunks
  const finalChunks: ChunkInfo[] = [];
  for (let i = 0; i < chunks.length; i++) {
    let chunkText = chunks[i];

    if (i > 0 && overlapChars > 0) {
      const prevChunk = chunks[i - 1];
      const overlapText = prevChunk.slice(-overlapChars).trim();
      if (overlapText) {
        chunkText = `[...${overlapText}]\n\n${chunkText}`;
      }
    }

    finalChunks.push({
      index: i,
      totalChunks: chunks.length,
      text: chunkText,
      estimatedTokens: estimateTokens(chunkText),
    });
  }

  return finalChunks;
}

/**
 * Normalizes a text string for deterministic deduplication comparison.
 */
function normalizeKey(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Merges multiple chunk analysis outputs into a single unified DocumentAnalysis using
 * deterministic in-memory deduplication (zero additional LLM cost).
 */
export function mergeDocumentAnalyses(
  analyses: DocumentAnalysis[]
): DocumentAnalysis {
  if (analyses.length === 0) {
    return {
      actions: [],
      deadlines: [],
      events: [],
      important_notes: [],
    };
  }

  // 1. Deduplicate actions by normalized title and deadline
  const actionMap = new Map<string, ExtractedAction>();
  for (const analysis of analyses) {
    for (const action of analysis.actions) {
      const key = `${normalizeKey(action.title)}|${normalizeKey(action.deadline)}`;
      const existing = actionMap.get(key);

      if (!existing) {
        actionMap.set(key, action);
      } else {
        // Retain the version with more detail or description
        if (
          (action.description && action.description.length > (existing.description?.length ?? 0)) ||
          (action.source_snippet && !existing.source_snippet)
        ) {
          actionMap.set(key, {
            ...existing,
            ...action,
            description: action.description || existing.description,
            source_snippet: action.source_snippet || existing.source_snippet,
          });
        }
      }
    }
  }

  // 2. Deduplicate deadlines by title + due_date
  const deadlineMap = new Map<string, ExtractedDeadline>();
  for (const analysis of analyses) {
    for (const dl of analysis.deadlines) {
      const key = `${normalizeKey(dl.title)}|${normalizeKey(dl.due_date)}`;
      const existing = deadlineMap.get(key);
      if (!existing) {
        deadlineMap.set(key, dl);
      } else if (dl.is_strict && !existing.is_strict) {
        deadlineMap.set(key, dl);
      }
    }
  }

  // 3. Deduplicate events by title + date
  const eventMap = new Map<string, ExtractedEvent>();
  for (const analysis of analyses) {
    for (const ev of analysis.events) {
      const key = `${normalizeKey(ev.title)}|${normalizeKey(ev.date)}`;
      const existing = eventMap.get(key);
      if (!existing) {
        eventMap.set(key, ev);
      } else if (ev.location && !existing.location) {
        eventMap.set(key, { ...existing, location: ev.location });
      }
    }
  }

  // 4. Deduplicate important notes (case-insensitive fuzzy set)
  const seenNotes = new Set<string>();
  const mergedNotes: string[] = [];
  for (const analysis of analyses) {
    for (const note of analysis.important_notes) {
      const norm = normalizeKey(note);
      if (norm && !seenNotes.has(norm)) {
        seenNotes.add(norm);
        mergedNotes.push(note.trim());
      }
    }
  }

  return {
    actions: Array.from(actionMap.values()),
    deadlines: Array.from(deadlineMap.values()),
    events: Array.from(eventMap.values()),
    important_notes: mergedNotes,
  };
}
