import type { MLCEngine, ChatCompletionMessageParam, InitProgressReport } from '@mlc-ai/web-llm'

// WebLLM (docs/12 §1) — an in-browser LLM running on the visitor's GPU via
// WebGPU, $0 to us (no server, no API key). It is the opt-in "smarter" upgrade
// over the always-on ELIZA floor. Everything here is lazy: the ~1GB model is
// only fetched when the visitor explicitly asks for it, and nothing imports the
// web-llm bundle until first use (its own async chunk).

// Small instruct models — a one-time opt-in download. The f16 build is smaller
// but needs the WebGPU `shader-f16` feature; the f32 build works on any WebGPU
// device. We pick per-device at load time.
const MODEL_F16 = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
const MODEL_F32 = 'Llama-3.2-1B-Instruct-q4f32_1-MLC'

export type LLMProgress = { text: string; progress: number }
export type LLMMessage = ChatCompletionMessageParam

// WebGPU presence — the hard gate. Absent on older browsers / most mobile.
export function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator && !!(navigator as unknown as { gpu?: unknown }).gpu
}

// Pick a model the device can actually run: f16 build only if the adapter
// exposes `shader-f16` (a common cause of init failures otherwise), else f32.
async function pickModel(): Promise<string> {
  try {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<{ features: Set<string> } | null> } }).gpu
    const adapter = gpu ? await gpu.requestAdapter() : null
    if (adapter && adapter.features.has('shader-f16')) return MODEL_F16
  } catch { /* fall through */ }
  return MODEL_F32
}

let enginePromise: Promise<MLCEngine> | null = null

/** True once a load has been kicked off (so callers can show "loaded" state). */
export function webLLMStarted(): boolean {
  return enginePromise !== null
}

// Lazily create (once) the MLC engine, downloading the model on first call.
// Reused across every bot + the AI Chat Agent.
export function loadWebLLM(onProgress?: (p: LLMProgress) => void): Promise<MLCEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      if (!hasWebGPU()) throw new Error('WebGPU is not available in this browser.')
      const model = await pickModel()
      const webllm = await import('@mlc-ai/web-llm')
      return webllm.CreateMLCEngine(model, {
        initProgressCallback: (r: InitProgressReport) => onProgress?.({ text: r.text, progress: r.progress }),
      })
    })().catch((e) => {
      // Allow a later retry if the download/init failed.
      enginePromise = null
      throw e
    })
  }
  return enginePromise
}

export async function webLLMChat(
  messages: LLMMessage[],
  opts?: { temperature?: number; maxTokens?: number; onProgress?: (p: LLMProgress) => void },
): Promise<string> {
  const engine = await loadWebLLM(opts?.onProgress)
  const res = await engine.chat.completions.create({
    messages,
    temperature: opts?.temperature ?? 0.8,
    max_tokens: opts?.maxTokens ?? 320,
  })
  return res.choices[0]?.message?.content ?? ''
}
