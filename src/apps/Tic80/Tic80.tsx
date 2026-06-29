import type { AppProps } from '../../os/types'
import styles from './Tic80.module.css'

// TIC-80 fantasy console (docs/08 Tier 3, MIT). The vendored wasm runtime lives
// under public/tic80/ and runs an original cart ("moth", authored in
// scripts/make-tic80-cart.mjs) — no third-party game content. Hosted in an
// iframe (the BassoonTracker seam pattern) so each window owns its own JS
// context: closing it tears down the main loop + audio with no global cleanup.
const BASE = import.meta.env.BASE_URL

export function Tic80(_props: AppProps) {
  return (
    <div className={styles.tic80}>
      <iframe
        className={styles.frame}
        src={`${BASE}tic80/index.html`}
        title="moth"
        // Same-origin (our own assets) so the wasm can fetch the cart offline.
        allow="autoplay; gamepad"
      />
    </div>
  )
}
