// Chrome built-in Prompt API (docs/12 §1.1) — on-device Gemini Nano exposed as
// window.LanguageModel (newer) or window.ai.languageModel (older origin-trial).
// $0, fully on-device. Feature-detected; when absent the AI Chat Agent falls
// back to WebLLM then ELIZA. All calls are defensive — the API surface is still
// changing across Chrome versions.

interface LMSession {
  prompt: (input: string) => Promise<string>
  destroy?: () => void
}
interface LMFactory {
  create: (opts?: unknown) => Promise<LMSession>
  availability?: () => Promise<string>
  capabilities?: () => Promise<{ available?: string }>
}

function factory(): LMFactory | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { LanguageModel?: LMFactory; ai?: { languageModel?: LMFactory } }
  return w.LanguageModel ?? w.ai?.languageModel ?? null
}

export function hasPromptAPI(): boolean {
  return !!factory()
}

// Is a model actually usable (present or downloadable) — not just the API shape.
export async function promptAPIReady(): Promise<boolean> {
  const lm = factory()
  if (!lm) return false
  try {
    if (lm.availability) {
      const a = await lm.availability()
      return a === 'available' || a === 'downloadable' || a === 'downloading'
    }
    if (lm.capabilities) {
      const c = await lm.capabilities()
      return !!c?.available && c.available !== 'no'
    }
    return true
  } catch {
    return false
  }
}

let session: LMSession | null = null
let sessionSystem: string | undefined

async function ensureSession(system?: string): Promise<LMSession> {
  const lm = factory()
  if (!lm) throw new Error('Prompt API unavailable')
  if (!session || system !== sessionSystem) {
    session?.destroy?.()
    session = await lm.create(system ? { initialPrompts: [{ role: 'system', content: system }] } : undefined)
    sessionSystem = system
  }
  return session
}

export async function promptAPIAsk(input: string, system?: string): Promise<string> {
  const s = await ensureSession(system)
  return (await s.prompt(input)).trim()
}
