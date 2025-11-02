export type Brief = {
  campaign_id: string;
  goal: string;
  product: { name: string; category: string; key_features: string[]; price: string };
  budget: number;
  channels: string[];
  audience_hints?: string[];
  tone?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export async function createPlan(brief: Brief) {
  const url = `${API_BASE}/api/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brief)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Request failed: ${res.status}`);
  }
  return res.json();
}

