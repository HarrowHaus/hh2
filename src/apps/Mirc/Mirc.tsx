import { useState } from 'react'
import type { AppProps } from '../../os/types'
import styles from './Mirc.module.css'

// mIRC — now REAL (docs/08 Tier D · IRC). Embeds KiwiIRC's hosted client
// (kiwiirc.com, Apache-2.0), which bridges to a real IRC network (Libera.Chat)
// over its public WebSocket gateway — no backend of ours, no Cloudflare. Pick a
// nick + channel in the client and you're on real IRC. External dependency (not
// offline); if KiwiIRC blocks iframe embedding the panel is blank — use "Open in
// new tab". "mIRC" name used nominatively; the client is KiwiIRC.
const KIWI_URL = 'https://kiwiirc.com/nextclient/irc.libera.chat/'

export function Mirc(_props: AppProps) {
  const [nonce, setNonce] = useState(0)
  return (
    <div className={styles.mirc}>
      <div className={styles.bar}>
        <span className={styles.net}>IRC · Libera.Chat <span className={styles.via}>via KiwiIRC</span></span>
        <button type="button" className={styles.tbtn} onClick={() => setNonce((n) => n + 1)} title="Reconnect">↻</button>
        <a className={styles.tbtn} href={KIWI_URL} target="_blank" rel="noreferrer">Open in new tab ↗</a>
      </div>
      <div className={styles.body}>
        <iframe
          key={nonce}
          className={styles.frame}
          src={KIWI_URL}
          title="mIRC (KiwiIRC)"
          allow="clipboard-write; fullscreen"
        />
        <div className={styles.fallback}>
          If this stays blank, KiwiIRC blocked embedding — use <b>Open in new tab ↗</b> above to get on IRC.
        </div>
      </div>
    </div>
  )
}
