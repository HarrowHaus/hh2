import { hasWebGPU } from './webllm'

// WebSD (docs/12 §1.1) — in-browser Stable Diffusion on WebGPU, $0, no server.
// Powers the AI Chat Agent's image action + the AI-Generated-Wallpaper option.
//
// This is optional flavor and WebGPU-only. To keep it OUT of our bundle entirely
// (heavy wasm/onnx), the pipeline is loaded from a CDN via a runtime dynamic
// import (`@vite-ignore`) only when the visitor explicitly opts in. Every path is
// guarded: unsupported browsers or any failure degrade silently — it never walls
// anything and never breaks the app.

export { hasWebGPU }

export type SDProgress = { text: string; progress: number }

// diffusers.js (@aislamov/diffusers.js, MIT) — an in-browser Stable Diffusion
// pipeline over onnxruntime-web + WebGPU. Loaded from CDN at opt-in time.
// esm.sh resolves the dependency graph (jsdelivr's +esm 404'd / mis-resolved).
const CDN = 'https://esm.sh/@aislamov/diffusers.js@0.9.3'
const MODEL = 'aislamov/stable-diffusion-2-1-base-onnx'

interface Pipeline {
  run: (opts: Record<string, unknown>) => Promise<unknown>
}

let pipePromise: Promise<Pipeline> | null = null

export function sdStarted(): boolean {
  return pipePromise !== null
}

async function loadPipeline(onProgress?: (p: SDProgress) => void): Promise<Pipeline> {
  if (!pipePromise) {
    pipePromise = (async () => {
      onProgress?.({ text: 'Loading Stable Diffusion…', progress: 0 })
      const mod = (await import(/* @vite-ignore */ CDN)) as {
        DiffusionPipeline: { fromPretrained: (id: string, opts?: unknown) => Promise<Pipeline> }
      }
      const pipe = await mod.DiffusionPipeline.fromPretrained(MODEL, {
        progressCallback: (r: { status?: string; progress?: number }) =>
          onProgress?.({ text: r.status ?? 'Loading…', progress: r.progress ?? 0 }),
      })
      return pipe
    })().catch((e) => {
      pipePromise = null
      throw e
    })
  }
  return pipePromise
}

// Best-effort conversion of a diffusers.js output tensor to a canvas data URL.
// Handles the common [h,w,c] uint8 and [c,h,w] float shapes; throws (→ graceful
// failure upstream) if the shape isn't recognized.
function tensorToDataURL(out: unknown): string {
  const t = (Array.isArray(out) ? out[0] : out) as { data?: ArrayLike<number>; dims?: number[]; shape?: number[] }
  const data = t?.data
  const dims = t?.dims ?? t?.shape
  if (!data || !dims) throw new Error('unexpected SD output')
  let h: number, w: number, chw: boolean
  if (dims.length === 4) {
    // [1,c,h,w] or [1,h,w,c]
    if (dims[1] <= 4) { chw = true; h = dims[2]; w = dims[3] }
    else { chw = false; h = dims[1]; w = dims[2] }
  } else if (dims.length === 3) {
    if (dims[0] <= 4) { chw = true; h = dims[1]; w = dims[2] }
    else { chw = false; h = dims[0]; w = dims[1] }
  } else {
    throw new Error('unexpected SD dims')
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const norm = (v: number) => (v <= 1.001 && v >= -1.001 ? Math.round((v * 0.5 + 0.5) * 255) : Math.round(v))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        const idx = chw ? c * h * w + y * w + x : (y * w + x) * 3 + c
        img.data[o + c] = Math.max(0, Math.min(255, norm(Number(data[idx]))))
      }
      img.data[o + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}

export interface GenerateOpts {
  steps?: number
  size?: number
  onProgress?: (p: SDProgress) => void
}

// Generate an image from a prompt → PNG data URL. Rejects if WebGPU is absent or
// anything in the pipeline fails (callers show a graceful message).
export async function generateImage(prompt: string, opts?: GenerateOpts): Promise<string> {
  if (!hasWebGPU()) throw new Error('WebGPU not available')
  const pipe = await loadPipeline(opts?.onProgress)
  const size = opts?.size ?? 512
  const out = await pipe.run({
    prompt,
    numInferenceSteps: opts?.steps ?? 20,
    guidanceScale: 7.5,
    width: size,
    height: size,
    progressCallback: (r: { status?: string; progress?: number }) =>
      opts?.onProgress?.({ text: r.status ?? 'Generating…', progress: r.progress ?? 0 }),
  })
  return tensorToDataURL(out)
}
