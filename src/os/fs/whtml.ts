// Helpers for the writable-HTML (.whtml) blog file kind (docs/11 §1, daedalOS
// parity). A .whtml node stores a full HTML document in `content`; the Blog
// viewer renders it sandboxed and the hero image drives its Explorer thumbnail.

// Pull the post's hero image URL: an explicit `data-thumb` wins, else the first
// <img src>. Returns null when the post has no image (viewer/thumbnail fall back
// to the file icon). Kept regex-based so it works without a DOM parse in hot
// icon-render paths.
export function heroImage(html: string | undefined): string | null {
  if (!html) return null
  const thumb = html.match(/data-thumb\s*=\s*("([^"]*)"|'([^']*)')/i)
  if (thumb) return thumb[2] ?? thumb[3] ?? null
  const img = html.match(/<img\b[^>]*\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i)
  if (img) return img[2] ?? img[3] ?? null
  return null
}

// Best-effort post title: the <title>, else the first heading. Falls back to the
// file name (handled by the caller).
export function postTitle(html: string | undefined): string | null {
  if (!html) return null
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (t) return t[1].trim() || null
  const h = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h) return h[1].replace(/<[^>]+>/g, '').trim() || null
  return null
}
