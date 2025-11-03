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
export const fallbackModel = process.env.GROQ_FALLBACK_MODEL || "llama-3.3-70b-versatile";

export interface ChatResponse {
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  modelUsed?: string;
}

export async function chatJson(client: Groq, messages: { role: "system" | "user" | "assistant"; content: string }[], model = defaultModel): Promise<ChatResponse> {
  try {
    const res = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    const content = res.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from model");
    
    // Extract token usage from response
    const usage = res.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    return {
      content,
      tokens: {
        prompt: usage.prompt_tokens || 0,
        completion: usage.completion_tokens || 0,
        total: usage.total_tokens || 0,
      },
      modelUsed: model,
    };
  } catch (error: any) {
    // If primary model fails and we have a fallback, try it
    if (fallbackModel && fallbackModel !== model) {
      console.warn(`[Groq] Primary model (${model}) failed: ${error.message}`);
      console.log(`[Groq] Attempting fallback model: ${fallbackModel}`);
      
      const res = await client.chat.completions.create({
        model: fallbackModel,
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      const content = res.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response from fallback model");
      
      const usage = res.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      
      return {
        content,
        tokens: {
          prompt: usage.prompt_tokens || 0,
          completion: usage.completion_tokens || 0,
          total: usage.total_tokens || 0,
        },
        modelUsed: fallbackModel,
      };
    }
    
    // No fallback or fallback is same as primary - rethrow
    throw error;
  }
}

