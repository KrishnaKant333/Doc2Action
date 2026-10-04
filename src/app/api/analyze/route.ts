import { extractTextFromFile, cleanExtractedText } from "@/ai/processing/extractText";
import {
  estimateTokens,
  splitTextIntoChunks,
  mergeDocumentAnalyses,
  MAX_DOCUMENT_TOKENS,
} from "@/ai/processing/chunking";
import { analyzeDocumentChunk, AppProcessingError } from "@/ai/services/groq";
import type { DocumentAnalysis } from "@/ai/types/action";
import { prisma } from "@/lib/prisma";
import {
  resolveWorkspace,
  attachWorkspaceCookie,
} from "@/lib/services/workspaceService";
import type {
  ActionItem,
  Deadline,
  Event,
  AnalysisResult,
  DocumentMetadata,
} from "@/lib/types/action";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DOCS_PER_WORKSPACE = 20;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const rawFiles = formData.getAll("files");
    const singleFile = formData.get("file");

    const filesToProcess: File[] = [];

    if (rawFiles.length > 0) {
      for (const f of rawFiles) {
        if (f instanceof File && f.size > 0) {
          filesToProcess.push(f);
        }
      }
    } else if (singleFile instanceof File && singleFile.size > 0) {
      filesToProcess.push(singleFile);
    }

    if (filesToProcess.length === 0) {
      return Response.json(
        {
          success: false,
          error: "No valid documents provided. Please upload a PDF, DOCX, or TXT file.",
          code: "NO_FILE",
        },
        { status: 400 }
      );
    }

    // Resolve or generate anonymous workspace
    const { workspaceId } = await resolveWorkspace(request);

    const documentsMeta: DocumentMetadata[] = [];
    const allActions: ActionItem[] = [];
    const allDeadlines: Deadline[] = [];
    const allEvents: Event[] = [];
    const allNotes: string[] = [];

    // Process each document sequentially
    for (let docIdx = 0; docIdx < filesToProcess.length; docIdx++) {
      const file = filesToProcess[docIdx];

      // 1. File size check
      if (file.size > MAX_FILE_SIZE) {
        return Response.json(
          {
            success: false,
            error: `File "${file.name}" exceeds the maximum allowed size of 10 MB.`,
            code: "FILE_TOO_LARGE",
          },
          { status: 400 }
        );
      }

      // 2. Extract and clean text
      const buffer = Buffer.from(await file.arrayBuffer());
      let rawText = "";

      try {
        rawText = await extractTextFromFile(buffer, file.type, file.name);
      } catch (extractErr) {
        console.error(`Text extraction failed for ${file.name}:`, extractErr);
        return Response.json(
          {
            success: false,
            error: `We could not read "${file.name}". Please ensure it is a valid, uncorrupted PDF, DOCX, or TXT file.`,
            code: "UNREADABLE_FILE",
          },
          { status: 400 }
        );
      }

      const cleanedText = cleanExtractedText(rawText);

      // 3. Minimum text length check (Scanned document detection)
      if (!cleanedText || cleanedText.length < 30) {
        return Response.json(
          {
            success: false,
            error: `"${file.name}" appears to be scanned or contains too little readable text.`,
            code: "OCR_REQUIRED",
          },
          { status: 400 }
        );
      }

      // 4. Token budgeting & maximum document limit check
      const totalTokens = estimateTokens(cleanedText);

      if (totalTokens > MAX_DOCUMENT_TOKENS) {
        return Response.json(
          {
            success: false,
            error: `This document is too large to process in one pass (approximately ${totalTokens.toLocaleString()} tokens, limit is ${MAX_DOCUMENT_TOKENS.toLocaleString()}). Please upload a shorter document or specific sections.`,
            code: "DOCUMENT_TOO_LARGE",
          },
          { status: 413 }
        );
      }

      // 5. Chunking & Sequential Execution
      const chunks = splitTextIntoChunks(cleanedText);
      const chunkAnalyses: DocumentAnalysis[] = [];

      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        const chunk = chunks[cIdx];

        const analysis = await analyzeDocumentChunk(chunk.text, {
          index: cIdx,
          total: chunks.length,
        });

        chunkAnalyses.push(analysis);

        // Conservative buffer delay between sequential chunks under 8K TPM
        if (cIdx < chunks.length - 1) {
          await sleep(1000);
        }
      }

      // 6. Merge chunk results in TypeScript (Deterministic deduplication)
      const mergedAnalysis = mergeDocumentAnalyses(chunkAnalyses);

      const docId = `doc-${Date.now()}-${docIdx + 1}`;
      const docMetadata: DocumentMetadata = {
        id: docId,
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type || "application/pdf",
        uploadedAt: new Date().toISOString(),
      };
      documentsMeta.push(docMetadata);

      // Map actions
      mergedAnalysis.actions.forEach((act, actIdx) => {
        allActions.push({
          id: `act-${docIdx + 1}-${actIdx + 1}-${Date.now()}`,
          title: act.title,
          description: act.description,
          deadline: act.deadline,
          priority: act.priority,
          category: act.category,
          status: "pending",
          sourceSnippet: act.source_snippet ?? undefined,
          sourceDocument: file.name,
        });
      });

      // Map deadlines
      mergedAnalysis.deadlines.forEach((dl, dlIdx) => {
        allDeadlines.push({
          id: `dl-${docIdx + 1}-${dlIdx + 1}-${Date.now()}`,
          title: dl.title,
          dueDate: dl.due_date,
          isStrict: dl.is_strict,
        });
      });

      // Map events
      mergedAnalysis.events.forEach((ev, evIdx) => {
        allEvents.push({
          id: `ev-${docIdx + 1}-${evIdx + 1}-${Date.now()}`,
          title: ev.title,
          date: ev.date,
          location: ev.location ?? undefined,
        });
      });

      // Map notes
      mergedAnalysis.important_notes.forEach((note) => {
        allNotes.push(note);
      });
    }

    const primaryDoc =
      documentsMeta.length === 1
        ? documentsMeta[0]
        : {
            id: `batch-${Date.now()}`,
            name: `${documentsMeta.length} Documents`,
            sizeBytes: documentsMeta.reduce((sum, d) => sum + d.sizeBytes, 0),
            mimeType: "multipart/batch",
            uploadedAt: new Date().toISOString(),
          };

    const finalResult: AnalysisResult = {
      document: primaryDoc,
      documents: documentsMeta,
      metrics: {
        totalActions: allActions.length,
        totalDeadlines: allDeadlines.length,
        totalEvents: allEvents.length,
        highPriorityCount: allActions.filter((a) => a.priority === "high").length,
      },
      actions: allActions,
      deadlines: allDeadlines,
      events: allEvents,
      importantNotes: Array.from(new Set(allNotes)),
      processingDurationMs: Date.now() - startTime,
    };

    // Persistence handling (Outcome 1 vs Outcome 2)
    let persisted = false;
    let persistenceWarning: string | undefined = undefined;

    if (process.env.DATABASE_URL) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.workspace.upsert({
            where: { id: workspaceId },
            create: { id: workspaceId },
            update: {},
          });

          for (let i = 0; i < documentsMeta.length; i++) {
            const meta = documentsMeta[i];
            const fileDocActions = allActions.filter(
              (a) => a.sourceDocument === meta.name
            );

            const createdDoc = await tx.document.create({
              data: {
                workspaceId,
                name: meta.name,
                sizeBytes: meta.sizeBytes,
                mimeType: meta.mimeType,
                processingStatus: "complete",
              },
            });

            meta.id = createdDoc.id;

            if (fileDocActions.length > 0) {
              await tx.actionItem.createMany({
                data: fileDocActions.map((act) => ({
                  workspaceId,
                  documentId: createdDoc.id,
                  title: act.title,
                  description: act.description,
                  deadline: act.deadline,
                  priority: act.priority,
                  category: act.category,
                  status: act.status,
                  sourceSnippet: act.sourceSnippet,
                })),
              });
            }

            if (allDeadlines.length > 0 && i === 0) {
              await tx.deadline.createMany({
                data: allDeadlines.map((dl) => ({
                  workspaceId,
                  documentId: createdDoc.id,
                  title: dl.title,
                  dueDate: dl.dueDate,
                  isStrict: Boolean(dl.isStrict),
                })),
              });
            }

            if (allEvents.length > 0 && i === 0) {
              await tx.event.createMany({
                data: allEvents.map((ev) => ({
                  workspaceId,
                  documentId: createdDoc.id,
                  title: ev.title,
                  date: ev.date,
                  location: ev.location,
                })),
              });
            }

            if (allNotes.length > 0 && i === 0) {
              await tx.importantNote.createMany({
                data: allNotes.map((note) => ({
                  workspaceId,
                  documentId: createdDoc.id,
                  content: note,
                })),
              });
            }
          }

          // Enforce 20-document max retention policy
          const totalDocs = await tx.document.count({
            where: { workspaceId },
          });

          if (totalDocs > MAX_DOCS_PER_WORKSPACE) {
            const excess = totalDocs - MAX_DOCS_PER_WORKSPACE;
            const oldestDocs = await tx.document.findMany({
              where: { workspaceId },
              orderBy: { createdAt: "asc" },
              take: excess,
              select: { id: true },
            });

            await tx.document.deleteMany({
              where: { id: { in: oldestDocs.map((d) => d.id) } },
            });
          }
        });

        persisted = true;
      } catch (dbError) {
        console.error("Database persistence warning (Outcome 2):", dbError);
        persisted = false;
        persistenceWarning =
          "Actions extracted successfully, but could not be saved to your workspace history.";
      }
    } else {
      persistenceWarning =
        "DATABASE_URL not configured. Running in stateless memory mode.";
    }

    const responsePayload = {
      success: true,
      persisted,
      warning: persistenceWarning,
      workspaceId,
      data: finalResult,
    };

    const response = Response.json(responsePayload, { status: 200 });
    return attachWorkspaceCookie(response, workspaceId);
  } catch (error) {
    // Log complete internal error server-side
    console.error("Analysis pipeline failure (Outcome 3):", error);

    // Map to safe client contract
    if (error instanceof AppProcessingError) {
      return Response.json(
        {
          success: false,
          persisted: false,
          code: error.code,
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    return Response.json(
      {
        success: false,
        persisted: false,
        code: "PROCESSING_ERROR",
        error: "We couldn't analyze the document. Please verify the file and try again.",
      },
      { status: 500 }
    );
  }
}
