import Groq from "groq-sdk";
import type {
  DocumentAnalysis,
  ActionItem,
  Deadline,
  EventItem,
} from "../types/action";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MAX_CHARS_PER_CHUNK = 7000;

const emptyAnalysis = (): DocumentAnalysis => ({
  actionable_tasks: [],
  deadlines: [],
  events: [],
  important_info: [],
});

function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += MAX_CHARS_PER_CHUNK) {
    chunks.push(text.slice(i, i + MAX_CHARS_PER_CHUNK));
  }

  return chunks;
}

async function analyzeChunk(
  text: string
): Promise<DocumentAnalysis> {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",

    messages: [
      {
        role: "system",
        content: `
You are Doc2Action's document analysis engine.

Analyze the provided document section and extract ONLY actionable information.

Identify:
1. Actionable tasks the user needs to perform.
2. Deadlines associated with those tasks.
3. Events mentioned in the document.
4. Other important information the user should know.

Rules:
- Do not invent information.
- Extract information ONLY from the provided text.
- If a deadline is not present, use null.
- If an event date, time, or location is not present, use null.
- Keep tasks concise and actionable.
- Preserve important dates accurately.
- Do not assume information from missing sections.
- Return valid JSON matching the required schema.
`,
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
        schema: {
          type: "object",
          properties: {
            actionable_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task: {
                    type: "string",
                  },
                  deadline: {
                    type: ["string", "null"],
                  },
                },
                required: ["task", "deadline"],
                additionalProperties: false,
              },
            },

            deadlines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                },
                required: ["date", "description"],
                additionalProperties: false,
              },
            },

            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  date: {
                    type: ["string", "null"],
                  },
                  time: {
                    type: ["string", "null"],
                  },
                  location: {
                    type: ["string", "null"],
                  },
                },
                required: [
                  "name",
                  "date",
                  "time",
                  "location",
                ],
                additionalProperties: false,
              },
            },

            important_info: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },

          required: [
            "actionable_tasks",
            "deadlines",
            "events",
            "important_info",
          ],

          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response");
  }

  return JSON.parse(content);
}

function mergeAnalyses(
  analyses: DocumentAnalysis[]
): DocumentAnalysis {
  const merged: DocumentAnalysis = emptyAnalysis();

  for (const analysis of analyses) {
    merged.actionable_tasks.push(...analysis.actionable_tasks);
    merged.deadlines.push(...analysis.deadlines);
    merged.events.push(...analysis.events);
    merged.important_info.push(...analysis.important_info);
  }

  // Remove duplicate tasks
  merged.actionable_tasks = Array.from(
    new Map(
      merged.actionable_tasks.map((item) => [
        `${item.task}|${item.deadline}`,
        item,
      ])
    ).values()
  );

  // Remove duplicate deadlines
  merged.deadlines = Array.from(
    new Map(
      merged.deadlines.map((item) => [
        `${item.date}|${item.description}`,
        item,
      ])
    ).values()
  );

  // Remove duplicate events
  merged.events = Array.from(
    new Map(
      merged.events.map((item) => [
        `${item.name}|${item.date}|${item.time}|${item.location}`,
        item,
      ])
    ).values()
  );

  // Remove duplicate important information
  merged.important_info = Array.from(
    new Set(merged.important_info)
  );

  return merged;
}

export async function analyzeDocument(
  text: string
): Promise<DocumentAnalysis> {
  const chunks = splitTextIntoChunks(text);

  console.log(
    `Groq: processing ${chunks.length} chunk(s)`
  );

  const analyses: DocumentAnalysis[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(
      `Groq: processing chunk ${i + 1}/${chunks.length}`
    );

    const analysis = await analyzeChunk(chunks[i]);
    analyses.push(analysis);
  }

  return mergeAnalyses(analyses);
}