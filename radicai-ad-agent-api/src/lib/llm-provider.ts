import Groq from "groq-sdk";
import OpenAI from "openai";

export type LLMProvider = "groq" | "openai";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export function getLLMProvider(provider: LLMProvider = "groq") {
  switch (provider) {
    case "groq": {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY not set. Set it in your .env file.");
      }
      return { client: new Groq({ apiKey }), provider: "groq" as const };
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY not set. Set it in your .env file.");
      }
      return { client: new OpenAI({ apiKey }), provider: "openai" as const };
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function chatJson(
  provider: LLMProvider,
  messages: Message[],
  model?: string
): Promise<string> {
  const { client, provider: p } = getLLMProvider(provider);

  // Get model based on provider
  const modelId =
    model ||
    (p === "groq"
      ? process.env.GROQ_MODEL || "openai/gpt-oss-120b"
      : process.env.OPENAI_MODEL || "gpt-4o-mini");

  if (p === "groq") {
    const res = await (client as Groq).chat.completions.create({
      model: modelId,
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    const content = res.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq");
    return content;
  } else {
    // OpenAI
    const res = await (client as OpenAI).chat.completions.create({
      model: modelId,
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    const content = res.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");
    return content;
  }
}
