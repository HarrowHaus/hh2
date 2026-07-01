import { elizaReply } from '../apps/Eliza/eliza'
import { hasWebGPU, webLLMChat, webLLMStarted, type LLMProgress, type LLMMessage } from './webllm'
import { hostedAvailable, hostedChat } from './hostedllm'

// Shared "bot voice" service (docs/12 §1) — one entry point drives every bot
// mouth (AIM buddies §2, MySpace profiles §3). Provider-agnostic + tiered; a bot
// never breaks. Per-call resolution of the persona's assigned model:
//
//   Tier C/D — assigned hosted model via the proxy (OpenRouter :free / Gemini
//              Flash / optional Haiku). $0 by default. DORMANT until the
//              Cloudflare proxy + secrets are set up (hostedAvailable() === false),
//              so today this tier is skipped entirely.
//   Tier B  — WebLLM on WebGPU (opt-in ~0.5GB download). Used when the bot's
//              model is 'webllm' or the caller opted in / a model is already loaded.
//   Tier A  — ELIZA: the always-works, offline, period-accurate floor.
//
// WEIRDNESS (§1.0a): each bot carries its own `model`, so different buddies speak
// with different engines once the hosted tier is on; `randomFree` bots roll a
// random :free model per session and drift over time. Model = persona config.

/** 'eliza' | 'webllm' | a hosted 'provider/model-id' (e.g. 'deepseek/deepseek-chat:free'). */
export type ModelId = string

export interface BotPersona {
  id: string
  name: string
  era?: string
  tone?: string
  /** One-line character seed folded into the system prompt. */
  blurb?: string
  /** Assigned tier for this bot. Defaults to 'eliza' (the safe floor). */
  model?: ModelId
  /** §1.0a: pick a random :free hosted model per session (voice drifts over time). */
  randomFree?: boolean
}

export interface ChatTurn {
  role: 'user' | 'bot'
  text: string
}

export interface ReplyOpts {
  /** Whether the hosted tier may be used for this call (proxy owner-gates anyway). */
  allowHosted?: boolean
  /** Opt into the on-device WebLLM tier for this call (AIM's "smarter bots"). */
  useWebLLM?: boolean
  onProgress?: (p: LLMProgress) => void
}

// A pool of OpenRouter free models for `randomFree` bots (dormant until hosted).
const FREE_POOL = [
  'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
]

// Per-session model choice for randomFree bots (stable within a session).
const sessionModel = new Map<string, string>()
function resolveModel(p: BotPersona): ModelId {
  if (p.randomFree) {
    let m = sessionModel.get(p.id)
    if (!m) { m = FREE_POOL[Math.floor(Math.random() * FREE_POOL.length)]; sessionModel.set(p.id, m) }
    return m
  }
  return p.model ?? 'eliza'
}

function systemPrompt(p: BotPersona): string {
  const bits = [`You are ${p.name}`]
  if (p.era) bits.push(`(${p.era})`)
  bits.push('chatting on an early-2000s instant messenger.')
  if (p.blurb) bits.push(p.blurb)
  if (p.tone) bits.push(`Tone: ${p.tone}.`)
  bits.push('Stay fully in character. Reply casually in 1–3 short sentences, like a real IM. No emoji spam, no markdown, no stage directions.')
  return bits.join(' ')
}

function buildMessages(p: BotPersona, history: ChatTurn[], userText: string): LLMMessage[] {
  return [
    { role: 'system', content: systemPrompt(p) },
    ...history.slice(-8).map((t) => ({
      role: (t.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: t.text,
    })),
    { role: 'user', content: userText },
  ]
}

/** Whether the on-device LLM tier can run right now (WebGPU present). */
export function webLLMPossible(): boolean {
  return hasWebGPU()
}

// Get a bot's reply. Resolves the persona's assigned model down the tiers and
// ALWAYS returns something (ELIZA floor). Never throws.
export async function getReply(
  persona: BotPersona,
  history: ChatTurn[],
  userText: string,
  opts?: ReplyOpts,
): Promise<string> {
  const model = resolveModel(persona)
  const hosted = model !== 'eliza' && model !== 'webllm'
  const messages = buildMessages(persona, history, userText)

  // Tier C/D — hosted model via the proxy (skipped while dormant).
  if ((opts?.allowHosted ?? true) && hosted && hostedAvailable()) {
    try {
      const t = (await hostedChat(model, messages, { maxTokens: 160 })).trim()
      if (t) return t
    } catch { /* fall through */ }
  }

  // Tier B — WebLLM (bot assigned to it, caller opted in, or a model is loaded).
  if ((model === 'webllm' || opts?.useWebLLM || webLLMStarted()) && hasWebGPU()) {
    try {
      const t = (await webLLMChat(messages, { maxTokens: 160, onProgress: opts?.onProgress })).trim()
      if (t) return t
    } catch { /* fall through */ }
  }

  // Tier A — ELIZA floor.
  return elizaReply(userText)
}
