const BASE_URL = "https://levi-ai-1ug2.onrender.com";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("levi_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function register(data: {
  username: string;
  email: string;
  password: string;
}) {
  return request("/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: { email: string; password: string }) {
  return request<{ access_token: string; token_type: string }>("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMe() {
  return request<{ id: number; username: string; email: string }>("/me");
}

export async function verifyEmail(data: { email: string; otp: string }) {
  return request("/verify-email", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function resendOtp(data: { email: string }) {
  return request("/resend-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function forgotPassword(data: { email: string }) {
  return request<{ message: string }>("/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function resetPassword(data: {
  email: string;
  otp: string;
  new_password: string;
}) {
  return request<{ access_token: string; token_type: string }>(
    "/reset-password",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// ── Conversations ─────────────────────────────────────────────────────────────

export async function getConversations() {
  return request<
    { id: number; title: string; created_at: string; updated_at: string }[]
  >("/chat/conversations");
}

export async function deleteConversation(id: number) {
  return request(`/chat/conversations/${id}`, { method: "DELETE" });
}

export async function renameConversation(id: number, title: string) {
  return request(`/chat/conversations/${id}/rename`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function getMessages(conversationId: number) {
  return request<
    { id: number; role: string; content: string; created_at: string }[]
  >(`/chat/conversations/${conversationId}`);
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function sendMessage(data: {
  message: string;
  conversation_id?: number;
  model?: string; // "swift" (Groq/Llama) or "nova" (Gemini) — matches ChatRequest.model in chat.py
}) {
  return request<{
    conversation_id: number;
    conversation_title: string;
    message_id: number;
    response: string;
  }>("/chat/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function streamMessage(
  data: {
    message: string;
    conversation_id?: number;
    mode_prompt?: string;
    model?: string; // "swift" (Groq/Llama) or "nova" (Gemini)
    web_search?: boolean; // if true, backend searches the web and injects results as context
  },
  onChunk: (text: string) => void,
  onMeta: (meta: { conversation_id: number; title: string; model?: string }) => void,
  onDone: () => void
) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Stream failed");

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.type === "chunk") onChunk(json.text);
        if (json.type === "meta" || json.type === "title")
          onMeta({ conversation_id: json.conversation_id, title: json.title, model: json.model });
        if (json.type === "done") onDone();
      } catch {}
    }
  }
}
