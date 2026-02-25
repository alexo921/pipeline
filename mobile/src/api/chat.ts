import { PIP_PROMPT_VERSION, PIP_SYSTEM_PROMPT } from '../prompts/pipSpec';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.pipelineworkforce.com/api').replace(/\/$/, '');

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatCompletionResult = {
  id: string;
  created: number;
  model: string;
  message: {
    role: 'assistant';
    content: string | null;
  } | null;
  finishReason: string | null;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;
};

export type ChatHistoryItem = {
  id: string;
  createdAt: string;
  userId: string;
  message: string;
  role?: 'assistant' | 'user';
  summary: string;
  sentiment: string;
  topic: string;
  urgency: string;
  routing: string;
  language: string;
  nextStep?: string | null;
};

export async function createChatCompletion(
  messages: ChatMessage[],
  systemPrompt: string = PIP_SYSTEM_PROMPT,
  promptVersion: string = PIP_PROMPT_VERSION,
  userId?: string
): Promise<ChatCompletionResult> {
  const endpoint = `${API_BASE_URL}/chat`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, systemPrompt, promptVersion, userId, temperature: 0.25 }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat request failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function fetchChatHistory(userId?: string, limit: number = 20): Promise<ChatHistoryItem[]> {
  if (!userId) {
    return [];
  }

  const url = new URL(`${API_BASE_URL}/chat/history`);
  url.searchParams.set('userId', userId);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat history request failed (${response.status}): ${errorText}`);
  }

  const parsed = await response.json();
  if (Array.isArray(parsed)) {
    return parsed as ChatHistoryItem[];
  }
  if (parsed && Array.isArray(parsed.data)) {
    return parsed.data as ChatHistoryItem[];
  }
  return [];
}
