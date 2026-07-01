import { useEffect, useState, type CSSProperties } from 'react'
import { SaverCanvas } from '../ScreenSaver/ScreenSaver'
import styles from './Desktop.module.css'

// Slideshow + image wallpapers (docs/02 §9). Named daedalOS slideshow sources —
// Lorem Picsum (photos, no key), NASA APOD (space), Art Institute of Chicago
// (art) — plus a single-image URL wallpaper with Fill/Fit/Stretch/Tile/Center.

export type SlideSource = 'photos' | 'space' | 'art'
export type WallFit = 'fill' | 'fit' | 'stretch' | 'tile' | 'center'

async function nextUrl(source: SlideSource, n: number): Promise<string> {
  try {
    if (source === 'photos') return `https://picsum.photos/1600/900?random=${n}`
    if (source === 'space') {
      const r = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=1')
      const [a] = (await r.json()) as { url: string; hdurl?: string; media_type: string }[]
      return a?.media_type === 'image' ? (a.hdurl || a.url) : ''
    }
    // art
    const page = 1 + (n % 60)
    const r = await fetch(`https://api.artic.edu/api/v1/artworks?fields=image_id&limit=1&page=${page}`)
    const j = (await r.json()) as { data?: { image_id?: string }[] }
    const id = j.data?.[0]?.image_id
    return id ? `https://www.artic.edu/iiif/2/${id}/full/1200,/0/default.jpg` : ''
  } catch {
    return ''
  }
}

export function Slideshow({ source }: { source: SlideSource }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let alive = true
    let n = 0
    const load = async () => { const u = await nextUrl(source, n++); if (alive && u) setUrl(u) }
    void load()
    const t = setInterval(() => void load(), 25_000)
    return () => { alive = false; clearInterval(t) }
  }, [source])
  if (!url) return <div className={styles.slideLoading} />
  return <img key={url} className={styles.slideImg} src={url} alt="" draggable={false} />
}

// Map a fit mode to background CSS for a single-image wallpaper.
export function fitToStyle(url: string, fit: WallFit): CSSProperties {
  const base: CSSProperties = { backgroundImage: `url("${url}")`, backgroundColor: '#000' }
  switch (fit) {
    case 'fit': return { ...base, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }
    case 'stretch': return { ...base, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }
    case 'tile': return { ...base, backgroundSize: 'auto', backgroundRepeat: 'repeat' }
    case 'center': return { ...base, backgroundSize: 'auto', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }
    case 'fill':
    default: return { ...base, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }
  }
}

export function ImageWallpaper({ url, fit }: { url: string; fit: WallFit }) {
  if (!url) return null
  return <div className={styles.imageWall} style={fitToStyle(url, fit)} />
}

// Single place that maps a wallpaper id → the right renderer (used by the desktop
// and the Display Properties preview).
export function WallpaperView({ id, image, fit }: { id: string; image: string; fit: WallFit }) {
  if (id === 'image') return <ImageWallpaper url={image} fit={fit} />
  if (id === 'slideshow') return <Slideshow source="photos" />
  if (id === 'slideshow-space') return <Slideshow source="space" />
  if (id === 'slideshow-art') return <Slideshow source="art" />
  return <SaverCanvas id={id} />
}
