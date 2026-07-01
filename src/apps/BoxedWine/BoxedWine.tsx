import manifest from '../../../data/boxedwine-manifest.json'
import { R2Frame } from '../_shared/R2Frame'
import type { AppProps } from '../../os/types'

// BoxedWine (docs/08 Tier C) — run 16/32-bit Windows apps. The wasm engine + the
// LGPL Wine environment (free software) are self-hosted on Cloudflare R2 (too big
// to commit; loaded on first launch, then cached). Ships as a READY SHELL: no
// proprietary Windows software is hosted — you run your own apps. Until the owner
// runs the ingest (needs R2 creds), this shows a not-configured state.
const BASE = (manifest as { r2PublicBase?: string }).r2PublicBase || ''

export function BoxedWine(_props: AppProps) {
  return (
    <R2Frame
      base={BASE}
      hostPath="boxedwine/index.html"
      title="BoxedWine"
      notConfigured={
        <div>
          <p><b>BoxedWine</b> isn’t configured yet.</p>
          <p>The engine + the <b>LGPL Wine</b> environment live on Cloudflare R2 (too big for git). No proprietary software is hosted — it’s a ready shell for your own Windows apps.</p>
          <p>Owner: upload them and populate <code>data/boxedwine-manifest.json</code> with:</p>
          <p><code>node scripts/ingest-r2-assets.mjs --src ./_assets/boxedwine --prefix boxedwine --bucket hh2-assets --public-base &lt;url&gt; --manifest data/boxedwine-manifest.json</code></p>
        </div>
      }
    />
  )
}
