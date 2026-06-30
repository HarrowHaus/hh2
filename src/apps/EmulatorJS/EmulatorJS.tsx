import { useRef, useState, type ChangeEvent } from 'react'
import type { AppProps } from '../../os/types'
import styles from './EmulatorJS.module.css'

// Console emulator (docs/08 Tier 3) — the EmulatorJS engine (GPL-3.0) + libretro
// cores run in an isolated iframe (public/emulatorjs/, loaded at runtime, never
// bundled into our MIT code; GPL text ships alongside). Everything is vendored,
// so it runs fully offline. Preloaded carts are VERIFIED-redistributable open
// homebrew (see CREDITS.md); you can also load your own ROM. No commercial ROMs.
const BASE = import.meta.env.BASE_URL

interface Game {
  id: string
  name: string
  author: string
  system: string
  core: string
  rom: string
  license: string
}

// Each entry's license is verified against its upstream repo (logged in CREDITS).
const GAMES: Game[] = [
  { id: 'libbet', name: 'Libbet and the Magic Floor', author: 'Damian Yerrick', system: 'Game Boy', core: 'gb', rom: 'roms/libbet.gb', license: 'Zlib' },
  { id: 'ucity', name: 'µCity', author: 'Antonio Niño Díaz', system: 'Game Boy Color', core: 'gb', rom: 'roms/ucity.gbc', license: 'GPL-3.0' },
  { id: 'nova', name: 'Nova the Squirrel', author: 'NovaSquirrel', system: 'NES', core: 'nes', rom: 'roms/nova.nes', license: 'GPL-3.0' },
]

// Extension → core for the drop-your-own loader (only vendored cores).
const EXT_CORE: Record<string, string> = { gb: 'gb', gbc: 'gb', dmg: 'gb', nes: 'nes' }

interface Active {
  core: string
  rom: string
  name: string
}

export function EmulatorJS(_props: AppProps) {
  const [active, setActive] = useState<Active | null>(null)
  const [err, setErr] = useState('')
  const blobRef = useRef<string | null>(null)

  function launch(g: Game) {
    setErr('')
    setActive({ core: g.core, rom: g.rom, name: g.name })
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const core = EXT_CORE[ext]
    if (!core) {
      setErr(`unsupported format ".${ext}" — try a .gb, .gbc or .nes ROM.`)
      return
    }
    if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    blobRef.current = URL.createObjectURL(file)
    setErr('')
    setActive({ core, rom: blobRef.current, name: file.name })
  }

  function back() {
    setActive(null)
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current)
      blobRef.current = null
    }
  }

  if (active) {
    const src = `${BASE}emulatorjs/index.html?core=${encodeURIComponent(active.core)}&rom=${encodeURIComponent(active.rom)}&name=${encodeURIComponent(active.name)}`
    return (
      <div className={styles.ejs}>
        <div className={styles.playbar}>
          <button type="button" className={styles.backBtn} onClick={back}>‹ Games</button>
          <span className={styles.playing}>{active.name}</span>
        </div>
        <iframe
          key={src}
          className={styles.frame}
          src={src}
          title={active.name}
          allow="autoplay; fullscreen; gamepad"
        />
      </div>
    )
  }

  return (
    <div className={styles.ejs}>
      <div className={styles.launcher}>
        <div className={styles.head}>
          <span className={styles.title}>Games</span>
          <label className={styles.loadBtn}>
            Load ROM…
            <input type="file" accept=".gb,.gbc,.nes" hidden onChange={onFile} />
          </label>
        </div>
        {err && <div className={styles.err}>{err}</div>}
        <div className={styles.grid}>
          {GAMES.map((g) => (
            <button key={g.id} type="button" className={styles.card} onClick={() => launch(g)}>
              <div className={styles.cartTop}><span className={styles.sys}>{g.system}</span></div>
              <div className={styles.cardName}>{g.name}</div>
              <div className={styles.cardMeta}>{g.author}</div>
              <div className={styles.cardLic}>{g.license}</div>
            </button>
          ))}
        </div>
        <a
          className={styles.more}
          href="https://itch.io/games/tag-homebrew"
          target="_blank"
          rel="noreferrer noopener"
        >
          Get more games →
        </a>
      </div>
    </div>
  )
}
