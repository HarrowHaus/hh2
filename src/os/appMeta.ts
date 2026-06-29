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
  notepad: { title: 'Untitled - Notepad', width: 480, height: 360, single: false, resizable: true },
  foobar: { title: 'foobar2000', width: 660, height: 460, single: true, resizable: true },
  bt: { title: 'µTorrent', width: 640, height: 410, single: true, resizable: true },
  installer: { title: 'Setup', width: 460, height: 358, single: false, resizable: false },
  photoshop: { title: 'Adobe Photoshop', width: 720, height: 520, single: true, resizable: true },
  flstudio: { title: 'FL Studio', width: 700, height: 460, single: true, resizable: true },
  terminal: { title: 'Command Prompt', width: 560, height: 360, single: false, resizable: true },
  imageviewer: { title: 'Windows Picture and Fax Viewer', width: 560, height: 480, single: false, resizable: true },
  trivia: { title: 'trivia.exe', width: 480, height: 420, single: true, resizable: false },
  minesweeper: { title: 'Minesweeper', width: 184, height: 268, single: true, resizable: false },
  msgbox: { title: 'Message', width: 360, height: 168, single: false, resizable: false },
  recyclebin: { title: 'Recycle Bin', width: 540, height: 400, single: true, resizable: true },
  aim: { title: 'AOL Instant Messenger', width: 236, height: 446, single: true, resizable: true },
  mirc: { title: 'mIRC', width: 660, height: 420, single: true, resizable: true },
  ie: { title: 'Internet Explorer', width: 740, height: 540, single: false, resizable: true },
  calc: { title: 'Calculator', width: 252, height: 322, single: true, resizable: false },
  charmap: { title: 'Character Map', width: 560, height: 430, single: true, resizable: true },
  recorder: { title: 'Sound - Sound Recorder', width: 320, height: 188, single: true, resizable: false },
  hexedit: { title: 'Hex Editor', width: 600, height: 420, single: false, resizable: true },
  solitaire: { title: 'Solitaire', width: 660, height: 500, single: true, resizable: true },
  breakout: { title: 'Brick Breaker', width: 504, height: 432, single: true, resizable: false },
  runner: { title: 'Crypt Runner', width: 632, height: 250, single: true, resizable: false },
  markdown: { title: 'Markdown', width: 560, height: 460, single: false, resizable: true },
  pdf: { title: 'Adobe Reader', width: 600, height: 560, single: false, resizable: true },
  // Easter-egg full-screen overlays (portal over everything; window stays tiny).
  bsod: { title: 'Windows', width: 200, height: 130, single: true, resizable: false },
  winupdate: { title: 'Windows Update', width: 200, height: 130, single: true, resizable: false },
  freecell: { title: 'FreeCell', width: 660, height: 500, single: true, resizable: true },
  spider: { title: 'Spider Solitaire', width: 720, height: 520, single: true, resizable: true },
  sigil: { title: 'Sigilizer', width: 384, height: 478, single: true, resizable: false },
  ansi: { title: 'ACiDview', width: 600, height: 460, single: false, resizable: true },
  keygen: { title: 'KeyMaker', width: 432, height: 372, single: false, resizable: false },
  chess: { title: 'Chess', width: 560, height: 600, single: true, resizable: true },
  code: { title: 'Code', width: 740, height: 520, single: false, resizable: true },
  v86: { title: 'Virtual Machine', width: 700, height: 480, single: true, resizable: true },
  tic80: { title: 'moth', width: 528, height: 348, single: true, resizable: true },
}
