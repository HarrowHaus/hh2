import type { AppId } from './types'

// Lightweight app metadata (no React) so the store can size/title windows
// without importing the component registry — keeps the store/app cycle clean.
export interface AppMeta {
  title: string
  width: number
  height: number
  /** Single-instance apps focus the existing window instead of opening another. */
  single?: boolean
  resizable?: boolean
}

export const APP_META: Record<AppId, AppMeta> = {
  display: { title: 'Display Properties', width: 414, height: 466, single: true, resizable: false },
  explorer: { title: 'Explorer', width: 580, height: 430, single: false, resizable: true },
}
