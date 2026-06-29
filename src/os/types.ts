// OS-level types for the window manager. Ported from the winXP reducer model
// (apps + zIndex + minimized/maximized + focus) onto our typed store.

export type AppId = 'display' | 'computer'

/** Props every windowed app receives (lets dialogs close their own window). */
export interface AppProps {
  winId: number
}

export interface WindowInstance {
  id: number
  appId: AppId
  title: string
  x: number
  y: number
  width: number
  height: number
  z: number
  minimized: boolean
  maximized: boolean
}
