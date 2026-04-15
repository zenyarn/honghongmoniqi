const ARK_API_URL =
  "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
const DEFAULT_MODEL = "doubao-seed-2-0-mini-260215";

type Role = "system" | "user" | "assistant";

interface Message {
  role: Role;
  content: string;
}

interface InvokeOptions {
  model?: string;
  temperature?: number;
}

interface ArkChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

export async function invokeLLM(
  messages: Message[],
  options?: InvokeOptions
): Promise<{ content: string }> {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    throw new Error("ARK_API_KEY is not set");
  }

  const body: Record<string, unknown> = {
    model: options?.model ?? DEFAULT_MODEL,
    messages,
    thinking: { type: "disabled" },
  };
  if (options?.temperature !== undefined) {
    body.temperature = options.temperature;
  }

  const res = await fetch(ARK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ARK API error ${res.status}: ${errText}`);
  }

  const data: ArkChatResponse = await res.json();

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("ARK API returned empty content");
  }

  return { content };
}
