import { useEffect, useState } from 'react'
import styles from './Desktop.module.css'

// Slideshow wallpaper (docs/02 §9) — cycles photos from Lorem Picsum (no API key,
// CORS-friendly). One of the named daedalOS slideshow sources; NASA APOD / Art
// Institute / Met can be added as further sources later. Cover-fit, gentle fade.
const src = (n: number) => `https://picsum.photos/1600/900?random=${n}`

export function Slideshow() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => x + 1), 25_000)
    return () => clearInterval(t)
  }, [])
  return <img key={i} className={styles.slideImg} src={src(i)} alt="" draggable={false} />
}
