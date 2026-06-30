// Real-image decoders for the Picture Viewer (docs/08 Tier B "Photos"). Each
// exotic format is decoded to a PNG data URL the panzoom stage can show. Every
// decoder is lazy-imported so its (often wasm) payload loads only when that
// format is actually opened, and each call is isolated — a failure in one format
// never affects the others.
//
//   TIFF  — UTIF.js (MIT)
//   QOI   — original decoder below (format spec is unencumbered)
//   JPEG XL — @jsquash/jxl (Apache-2.0)
//   HEIF/HEIC — libheif-js (LGPL-3.0 — see CREDITS notice)
// Native browser formats (png/jpg/gif/webp/bmp/avif/svg) skip decoding.

const NATIVE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'svg', 'ico'])

export function extOf(name: string): string {
  return name.toLowerCase().split(/[?#]/)[0].split('.').pop() ?? ''
}

export function isSupported(name: string): boolean {
  const e = extOf(name)
  return NATIVE.has(e) || ['tif', 'tiff', 'qoi', 'jxl', 'heic', 'heif'].includes(e)
}

/** Decode any supported image File → an object URL or data URL for <img src>. */
export async function decodeImage(file: File): Promise<string> {
  const ext = extOf(file.name)
  if (NATIVE.has(ext)) return URL.createObjectURL(file)
  const buf = await file.arrayBuffer()
  if (ext === 'tif' || ext === 'tiff') return decodeTiff(buf)
  if (ext === 'qoi') return decodeQoi(new Uint8Array(buf))
  if (ext === 'jxl') return decodeJxl(buf)
  if (ext === 'heic' || ext === 'heif') return decodeHeif(buf)
  // Unknown — let the browser try.
  return URL.createObjectURL(file)
}

function rgbaToDataUrl(data: Uint8ClampedArray, width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  // Copy into a fresh ArrayBuffer-backed array so ImageData accepts it.
  const img = ctx.createImageData(width, height)
  img.data.set(data)
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}

async function decodeTiff(buf: ArrayBuffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const UTIF: any = await import('utif')
  const ifds = UTIF.decode(buf)
  UTIF.decodeImage(buf, ifds[0])
  const rgba: Uint8Array = UTIF.toRGBA8(ifds[0])
  return rgbaToDataUrl(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength), ifds[0].width, ifds[0].height)
}

async function decodeJxl(buf: ArrayBuffer): Promise<string> {
  const decode = (await import('@jsquash/jxl/decode')).default
  const img = await decode(buf)
  return rgbaToDataUrl(img.data, img.width, img.height)
}

async function decodeHeif(buf: ArrayBuffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import('libheif-js')
  const libheif = mod.default ?? mod
  const decoder = new libheif.HeifDecoder()
  const images = decoder.decode(new Uint8Array(buf))
  if (!images || !images.length) throw new Error('no images in HEIF')
  const image = images[0]
  const width: number = image.get_width()
  const height: number = image.get_height()
  const imageData = new ImageData(width, height)
  await new Promise<void>((resolve, reject) => {
    image.display(imageData, (out: ImageData | null) => (out ? resolve() : reject(new Error('HEIF decode failed'))))
  })
  return rgbaToDataUrl(imageData.data, width, height)
}

// QOI — original implementation of the public format spec (qoiformat.org).
function decodeQoi(bytes: Uint8Array): string {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (dv.getUint32(0) !== 0x716f6966) throw new Error('not a QOI file') // 'qoif'
  const width = dv.getUint32(4)
  const height = dv.getUint32(8)
  const total = width * height
  const out = new Uint8ClampedArray(total * 4)
  const index = new Uint8Array(64 * 4)
  let r = 0, g = 0, b = 0, a = 255
  let p = 14, o = 0, run = 0
  for (let px = 0; px < total; px++) {
    if (run > 0) {
      run--
    } else {
      const b1 = bytes[p++]
      if (b1 === 0xfe) { r = bytes[p++]; g = bytes[p++]; b = bytes[p++] }
      else if (b1 === 0xff) { r = bytes[p++]; g = bytes[p++]; b = bytes[p++]; a = bytes[p++] }
      else {
        const tag = b1 & 0xc0
        if (tag === 0x00) { const i = (b1 & 0x3f) * 4; r = index[i]; g = index[i + 1]; b = index[i + 2]; a = index[i + 3] }
        else if (tag === 0x40) { r = (r + ((b1 >> 4 & 3) - 2)) & 255; g = (g + ((b1 >> 2 & 3) - 2)) & 255; b = (b + ((b1 & 3) - 2)) & 255 }
        else if (tag === 0x80) { const b2 = bytes[p++]; const vg = (b1 & 0x3f) - 32; r = (r + vg - 8 + ((b2 >> 4) & 15)) & 255; g = (g + vg) & 255; b = (b + vg - 8 + (b2 & 15)) & 255 }
        else { run = b1 & 0x3f } // RUN: this pixel + `run` more
      }
      const hi = ((r * 3 + g * 5 + b * 7 + a * 11) % 64) * 4
      index[hi] = r; index[hi + 1] = g; index[hi + 2] = b; index[hi + 3] = a
    }
    out[o++] = r; out[o++] = g; out[o++] = b; out[o++] = a
  }
  return rgbaToDataUrl(out, width, height)
}
