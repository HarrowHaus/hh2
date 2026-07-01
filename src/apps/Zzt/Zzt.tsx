import type { AppProps } from '../../os/types'
import styles from './Zzt.module.css'

// ZZT (docs/08 Tier C) — Epic MegaGames' ZZT (1991), freely distributable at no
// charge, runs in our vendored DOSBox (js-dos) via a bundled .jsdos that
// auto-boots ZZT.EXE. The complete package (worlds + docs + license) is vendored
// to public/zzt/; nothing is charged for. Credited in CREDITS.md.
const BASE = import.meta.env.BASE_URL
const BUNDLE = `${BASE}zzt/zzt.jsdos`
const SRC = `${BASE}jsdos/index.html?bundle=${encodeURIComponent(BUNDLE)}`

export function Zzt(_props: AppProps) {
  return <iframe className={styles.frame} src={SRC} title="ZZT" allow="autoplay; gamepad; fullscreen" />
}
