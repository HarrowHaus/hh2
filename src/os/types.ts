// OS-level types for the window manager. Ported from the winXP reducer model
// (apps + zIndex + minimized/maximized + focus) onto our typed store.

export type AppId =
  | 'display'
  | 'explorer'
  | 'notepad'
  | 'foobar'
  | 'bt'
  | 'installer'
  | 'photoshop'
  | 'flstudio'
  | 'terminal'
  | 'imageviewer'
  | 'trivia'
  | 'minesweeper'
  | 'msgbox'
  | 'recyclebin'
  | 'aim'
  | 'mirc'
  | 'ie'
  | 'calc'
  | 'charmap'
  | 'recorder'
  | 'hexedit'
  | 'solitaire'
  | 'breakout'
  | 'runner'
  | 'markdown'
  | 'pdf'
  | 'bsod'
  | 'winupdate'
  | 'freecell'
  | 'spider'
  | 'sigil'
  | 'ansi'
  | 'keygen'
  | 'chess'
  | 'code'
  | 'v86'
  | 'tic80'
  | 'ruffle'
  | 'emulatorjs'
  | 'opentype'
  | 'videoplayer'
  | 'paint'

/** Optional launch arguments (e.g. Explorer's starting path). */
export type AppArgs = Record<string, unknown>

/** Props every windowed app receives (lets dialogs close their own window). */
export interface AppProps {
  winId: number
  args?: AppArgs
}

export interface Geometry {
  x: number
  y: number
  width: number
  height: number
}

export type SnapZone = 'left' | 'right' | 'max' | null

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
  /** Half-screen tile, or null. Mutually exclusive-ish with maximized. */
  snapped: 'left' | 'right' | null
  /** Pre-snap/maximize geometry, restored when un-snapped. */
  prev: Geometry | null
  /** Launch args (e.g. Explorer path). */
  args?: AppArgs
}
