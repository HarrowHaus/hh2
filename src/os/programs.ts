import type { AppArgs, AppId } from './types'

// Single source of truth for the Start ▸ All Programs flyout, grouped to mirror
// the Program Files/ category folders. EVERY shipped app registers here so it is
// launchable from Start (project rule: "done" = launchable from Start). Icons are
// pulled from the APPS registry by appId, so an entry is just {appId, label}.
export interface ProgramItem {
  appId: AppId
  label: string
  args?: AppArgs
}
export interface ProgramGroup {
  name: string
  items: ProgramItem[]
}

export const PROGRAMS: ProgramGroup[] = [
  {
    name: 'Accessories',
    items: [
      { appId: 'notepad', label: 'Notepad' },
      { appId: 'wordpad', label: 'WordPad' },
      { appId: 'calc', label: 'Calculator' },
      { appId: 'charmap', label: 'Character Map' },
      { appId: 'recorder', label: 'Sound Recorder' },
      { appId: 'hexedit', label: 'Hex Editor' },
      { appId: 'code', label: 'Code' },
      { appId: 'terminal', label: 'Command Prompt' },
      { appId: 'opentype', label: 'Font Viewer' },
    ],
  },
  {
    name: 'Games',
    items: [
      { appId: 'solitaire', label: 'Solitaire' },
      { appId: 'freecell', label: 'FreeCell' },
      { appId: 'spider', label: 'Spider Solitaire' },
      { appId: 'minesweeper', label: 'Minesweeper' },
      { appId: 'chess', label: 'Chess' },
      { appId: 'breakout', label: 'Brick Breaker' },
      { appId: 'runner', label: 'Crypt Runner' },
      { appId: 'tic80', label: 'moth' },
      { appId: 'darkroom', label: 'A Dark Room' },
      { appId: 'quake3', label: 'Quake III' },
      { appId: 'zzt', label: 'ZZT' },
    ],
  },
  {
    name: 'Emulators',
    items: [
      { appId: 'emulatorjs', label: 'Game Console' },
      { appId: 'v86', label: 'Virtual Machine' },
      { appId: 'dos', label: 'MS-DOS Prompt' },
      { appId: 'boxedwine', label: 'BoxedWine' },
    ],
  },
  {
    name: 'Internet',
    items: [
      { appId: 'ie', label: 'Internet Explorer' },
      { appId: 'aim', label: 'AOL Instant Messenger' },
      { appId: 'mirc', label: 'mIRC' },
      { appId: 'eliza', label: 'ELIZA' },
      { appId: 'aichat', label: 'AI Assistant' },
      { appId: 'bt', label: 'µTorrent' },
    ],
  },
  {
    name: 'Sound & Video',
    items: [
      { appId: 'foobar', label: 'foobar2000' },
      { appId: 'podcast', label: 'iPodder' },
      { appId: 'webamp', label: 'Winamp' },
      { appId: 'flstudio', label: 'FL Studio' },
      { appId: 'videoplayer', label: 'Video Player' },
      { appId: 'ruffle', label: 'Flash Player' },
    ],
  },
  {
    name: 'Graphics',
    items: [
      { appId: 'paint', label: 'Paint' },
      { appId: 'photoshop', label: 'Adobe Photoshop' },
    ],
  },
  {
    name: 'System Tools',
    items: [
      { appId: 'display', label: 'Display Properties' },
      { appId: 'trivia', label: 'trivia.exe' },
    ],
  },
]
