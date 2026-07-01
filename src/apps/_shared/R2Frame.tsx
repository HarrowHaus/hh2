import type { ReactNode } from 'react'
import styles from './R2Frame.module.css'

// Shared shell for apps whose heavy assets live on Cloudflare R2 (docs/08 Tier C).
// If the manifest's r2PublicBase is set, iframe the R2-loading host page with the
// base as a query param; otherwise show a "not configured — run the ingest" state
// (the same pattern as foobar's empty music library).
export function R2Frame({
  base, hostPath, title, notConfigured,
}: {
  base: string
  hostPath: string
  title: string
  notConfigured: ReactNode
}) {
  if (!base) return <div className={styles.missing}>{notConfigured}</div>
  const src = `${import.meta.env.BASE_URL}${hostPath}?base=${encodeURIComponent(base.replace(/\/$/, ''))}`
  return <iframe className={styles.frame} src={src} title={title} allow="autoplay; gamepad; fullscreen" />
}
