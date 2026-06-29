import type { FC } from 'react'
import type { AppId, AppProps } from './types'
import { MonitorIcon, FolderIcon } from './icons'
import { DisplayProperties } from '../apps/DisplayProperties/DisplayProperties'
import { Explorer } from '../apps/Explorer/Explorer'

interface IconProps {
  size?: number
  className?: string
}

export interface AppEntry {
  Icon: FC<IconProps>
  Component: FC<AppProps>
}

// Registry mapping each app to its window content + icon. Window sizing/titles
// live in appMeta.ts (no React) so the store stays free of component imports.
export const APPS: Record<AppId, AppEntry> = {
  display: { Icon: MonitorIcon, Component: DisplayProperties },
  explorer: { Icon: FolderIcon, Component: Explorer },
}
