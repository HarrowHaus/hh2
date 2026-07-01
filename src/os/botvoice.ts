import { elizaReply } from '../apps/Eliza/eliza'
import { hasWebGPU, webLLMChat, type LLMProgress } from './webllm'

// Shared "bot voice" service (docs/12 §1). One entry point drives every bot
// mouth — AIM buddies (§2) and MySpace profiles (§3) both call getReply and
// neither special-cases the engine. Two tiers, $0 cost either way:
//   Tier A — ELIZA: always works, instant, offline, period-accurate.
//   Tier B — WebLLM: on-device LLM (opt-in, WebGPU), markedly smarter.
// WebLLM silently degrades to ELIZA when WebGPU is absent or the call fails.

export type BotMode = 'eliza' | 'webllm'

export interface BotPersona {
  id: string
  name: string
  /** One-line character seed (era, tone, subject) folded into the LLM system prompt. */
  blurb?: string
  era?: string
}

export interface ChatTurn {
  role: 'user' | 'bot'
  text: string
}

/** Whether a mode can actually run right now (WebLLM needs WebGPU). */
export function modeAvailable(mode: BotMode): boolean {
  return mode === 'eliza' ? true : hasWebGPU()
}

function systemPrompt(p: BotPersona): string {
  const bits = [`You are ${p.name}`]
  if (p.era) bits.push(`(${p.era})`)
  bits.push('chatting on an early-2000s instant messenger.')
  if (p.blurb) bits.push(p.blurb)
  bits.push('Stay fully in character. Reply casually in 1–3 short sentences, like a real IM. No emoji spam, no markdown, no stage directions.')
  return bits.join(' ')
}

// Get a bot's reply. mode 'webllm' uses the on-device LLM if WebGPU is present
// (falling back to ELIZA on any failure); 'eliza' always uses the pattern bot.
export async function getReply(
  persona: BotPersona,
  history: ChatTurn[],
  userText: string,
  mode: BotMode,
  onProgress?: (p: LLMProgress) => void,
): Promise<string> {
  if (mode === 'webllm' && hasWebGPU()) {
    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt(persona) },
        ...history.slice(-8).map((t) => ({
          role: (t.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: t.text,
        })),
        { role: 'user' as const, content: userText },
      ]
      const out = (await webLLMChat(messages, { temperature: 0.85, maxTokens: 160, onProgress })).trim()
      if (out) return out
    } catch {
      /* fall through to the ELIZA floor */
    }
  }
  return elizaReply(userText)
}
