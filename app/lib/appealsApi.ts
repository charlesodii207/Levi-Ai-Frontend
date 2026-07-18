const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://levi-ai-1ug2.onrender.com";

export async function submitAppeal(email: string, message: string) {
  const res = await fetch(`${API_BASE}/appeals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, message }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    throw new Error(data?.detail || "Something went wrong. Please try again.");
  }

  return data;
}
