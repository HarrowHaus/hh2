import type { FC } from 'react'
import type { AppId, AppProps } from './types'
import { MonitorIcon, ComputerIcon } from './icons'
import { DisplayProperties } from '../apps/DisplayProperties/DisplayProperties'
import { MyComputer } from '../apps/MyComputer/MyComputer'

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
  computer: { Icon: ComputerIcon, Component: MyComputer },
}
