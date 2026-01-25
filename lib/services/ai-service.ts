import OpenAI from "openai";

export interface Note {
  content: string;
  date: string;
  tags?: string[];
}

export async function generateSummary(
  notes: Note[],
  instruction?: string
): Promise<string> {
  const openai = new OpenAI();

  if (!process.env.OPENAI_API_KEY) {
    return `# AI Summary (Mock)\n\nProcessed ${notes.length} notes...`;
  }

  const notesText = notes
    .map((note) => {
      return `Date: ${note.date}\nTags: ${note.tags?.join(", ") ?? ""}\nContent: ${note.content}`;
    })
    .join("\n\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Summarize the provided notes concisely in English. Use Markdown formatting.",
      },
      {
        role: "user",
        content: `Here are the notes:\n\n${notesText}\n\nInstruction: ${instruction}`,
      },
    ],
  });

  return completion.choices[0].message.content || "";
}
