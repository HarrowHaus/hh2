import type { LLMMessage } from './webllm'

// Client for the hosted-LLM proxy (Tier C/D, docs/12 §1.0c). This ONLY POSTs to
// a same-origin Cloudflare Function (`/api/chat`); every provider key lives as a
// Cloudflare SECRET on that function and is NEVER shipped to the browser.
//
// DORMANT by default: `HOSTED_ENABLED` is false, so `hostedAvailable()` returns
// false and the bot-voice layer never calls the proxy — every hosted-tier bot
// transparently falls back to WebLLM/ELIZA. This is the "do not wire the proxy
// until the secrets are set up" state.
//
// TO ACTIVATE (after the proxy exists + Cloudflare secrets are set):
//   1. Deploy `functions/api/chat.js` (the provider-agnostic proxy — ready code
//      is in docs/12 §1.0c) and add the secrets (OPENROUTER_API_KEY, GEMINI_API_KEY,
//      ANTHROPIC_API_KEY, OWNER_FLAG, …).
//   2. Flip HOSTED_ENABLED to true here. Nothing else changes — the client is
//      already provider-agnostic; the proxy owner-gates paid/hosted tiers itself.
export const HOSTED_ENABLED = false

export function hostedAvailable(): boolean {
  return HOSTED_ENABLED
}

// Ask the proxy for a completion. The proxy routes by model id (OpenRouter /
// Gemini / Anthropic), applies rate limits + the daily cap + the owner gate, and
// returns `{ text }`. Throws on any non-200 so the caller falls back a tier.
export async function hostedChat(
  model: string,
  messages: LLMMessage[],
  opts?: { maxTokens?: number },
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: opts?.maxTokens ?? 160 }),
  })
  if (!res.ok) throw new Error(`hosted ${res.status}`)
  const j = (await res.json()) as { text?: string; choices?: { message?: { content?: string } }[] }
  return j.text ?? j.choices?.[0]?.message?.content ?? ''
}
