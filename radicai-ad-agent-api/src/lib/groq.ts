import Groq from "groq-sdk";

export function getGroqClient(apiKey?: string) {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY not set");
  }
  return new Groq({ apiKey: key });
}

// Default to a supported GPT-OSS model; can be overridden via GROQ_MODEL
export const defaultModel = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export async function chatJson(client: Groq, messages: { role: "system" | "user" | "assistant"; content: string }[], model = defaultModel): Promise<string> {
  const res = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  const content = res.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from model");
  return content;
}

