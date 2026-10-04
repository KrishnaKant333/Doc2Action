import Groq from "groq-sdk";
import type { DocumentAnalysis } from "../types/action";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function analyzeDocument(
  text: string
): Promise<DocumentAnalysis> {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",

    messages: [
      {
        role: "system",
        content: `
You are Doc2Action's document analysis engine.

Analyze the provided document and extract ONLY actionable information.

Identify:
1. Actionable tasks the user needs to perform.
2. Deadlines associated with those tasks.
3. Events mentioned in the document.
4. Other important information the user should know.

Rules:
- Do not invent information.
- If a deadline is not present, use null.
- If an event date, time, or location is not present, use null.
- Keep tasks concise and actionable.
- Preserve important dates accurately.
- Return information only from the provided document.
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