const DEFAULT_BASE_URL = "https://api.voidai.app/v1/chat/completions";
const DEFAULT_MODEL = "gpt-5.2";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}

const getConfig = () => {
  const baseUrl = process.env.VOIDAI_BASE_URL ?? DEFAULT_BASE_URL;
  const model = process.env.VOIDAI_MODEL ?? DEFAULT_MODEL;
  const apiKey = process.env.VOIDAI_API_KEY;

  return { baseUrl, model, apiKey };
};

export const canUseLiveLlm = () => {
  const { apiKey } = getConfig();
  return Boolean(apiKey);
};

const withTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  ms: number,
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const parseJsonFromText = <T>(raw: string): T => {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = fenceMatch?.[1] ?? raw;
  return JSON.parse(payload) as T;
};

export const chatJson = async <T>(
  messages: ChatMessage[],
  maxTokens = 2200,
): Promise<T> => {
  const { apiKey, baseUrl, model } = getConfig();
  if (!apiKey) {
    throw new LlmError("VOIDAI_API_KEY is not configured.");
  }

  let lastError: unknown;
  const attempts = 3;

  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await withTimeout(
        baseUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.2,
            max_tokens: maxTokens,
          }),
        },
        22000,
      );

      if (!response.ok) {
        const text = await response.text();
        throw new LlmError(
          `LLM HTTP ${response.status}: ${text.slice(0, 400)}`,
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new LlmError("LLM response missing choices[0].message.content");
      }

      return parseJsonFromText<T>(content);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 350 * (i + 1)));
    }
  }

  throw new LlmError(
    lastError instanceof Error ? lastError.message : "Failed to call LLM",
  );
};
