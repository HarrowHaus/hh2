import manifest from '../../../data/quake3-manifest.json'
import { R2Frame } from '../_shared/R2Frame'
import type { AppProps } from '../../os/types'

// Quake III (docs/08 Tier C) — the wasm engine + OpenArena FREE data are self-
// hosted on Cloudflare R2 (too big to commit; loaded on first launch, then
// cached). NO retail Quake paks — OpenArena only. Until the owner runs the ingest
// (needs R2 creds), r2PublicBase is empty and this shows a not-configured state.
const BASE = (manifest as { r2PublicBase?: string }).r2PublicBase || ''

export function Quake3(_props: AppProps) {
  return (
    <R2Frame
      base={BASE}
      hostPath="quake3/index.html"
      title="Quake III (OpenArena)"
      notConfigured={
        <div>
          <p><b>Quake III</b> isn’t configured yet.</p>
          <p>The engine + <b>OpenArena</b> free data live on Cloudflare R2 (too big for git).</p>
          <p>Owner: upload them and populate <code>data/quake3-manifest.json</code> with:</p>
          <p><code>node scripts/ingest-r2-assets.mjs --src ./_assets/quake3 --prefix quake3 --bucket hh2-assets --public-base &lt;url&gt; --manifest data/quake3-manifest.json</code></p>
        </div>
      }
    />
  )
}
