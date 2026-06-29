import type { ThemePack, VisualStyle } from './types'

// The 3 built-in theme packs. These ARE the source of truth for the visual
// styles (the engine writes them to :root at runtime). tokens/themes.css only
// holds the dark values as a no-JS first-paint default + the variable contract.
// Future packs (incl. converted real .msstyles) are just more entries here.

const DARK: ThemePack = {
  id: 'dark',
  name: 'bug', // bug.msstyles — dark scene-kid skin (default)
  colors: {
    '--title': '#e6e6e6',
    '--winbody': '#17171b',
    '--wintext': '#dcdce0',
    '--winborder': '#000',
    '--titlegrad': 'linear-gradient(180deg,#34343a,#101013)',
    '--titleinact': 'linear-gradient(180deg,#26262b,#15151a)',
    '--taskbar': 'linear-gradient(180deg,#2a2a30,#0e0e11 12%,#0e0e11 88%,#000)',
    '--startbtn': 'linear-gradient(180deg,#8c1414,#4a0808)',
    '--starttext': '#fff',
    '--menubg': '#17171b',
    '--menuside': '#0d0d10',
    '--menutext': '#dcdce0',
    '--menuhead': 'linear-gradient(180deg,#2a2a31,#161619)',
    '--menuheadtext': '#fff',
    '--menuselect': '#9a1414',
    '--menuseltext': '#fff',
    '--accent': '#9a1414',
    '--wall':
      'radial-gradient(120% 90% at 50% 18%,#1b1b22 0%,#101015 38%,#08080b 72%,#040406 100%),' +
      'radial-gradient(80% 60% at 78% 108%,rgba(122,18,18,.20),transparent 60%)',
    '--ctlface': 'linear-gradient(180deg,#43434c,#1c1c22)',
    '--ctlclose': 'linear-gradient(180deg,#bf352e,#5e0f0b)',
    '--ctlglyph': '#ededed',
    '--ctlborder': '#000',
    '--traytext': '#e6e6e6',
    '--field': '#101014',
  },
  metrics: { '--radius': '7px' },
}

const LUNA: ThemePack = {
  id: 'luna',
  name: 'Windows XP', // factory / family layer
  colors: {
    '--title': '#fff',
    '--winbody': '#fff',
    '--wintext': '#111',
    '--winborder': '#0831d9',
    '--titlegrad':
      'linear-gradient(180deg,#0058ee,#3f8cf3 9%,#0855dd 18%,#0855dd 78%,#003fc4 92%,#0831d9)',
    '--titleinact': 'linear-gradient(180deg,#7aa5f0,#5b87e0 60%,#3f6fd6)',
    '--taskbar': 'linear-gradient(180deg,#3168d5,#2257d8 8%,#1c4fd4 90%,#0f3bbb)',
    '--startbtn': 'linear-gradient(180deg,#73b56a,#4e9a45 50%,#3c873c)',
    '--starttext': '#fff',
    '--menubg': '#fff',
    '--menuside': '#d3e5fa',
    '--menutext': '#111',
    '--menuhead': 'linear-gradient(180deg,#1868ce,#1164cf 33%,#2476dc 60%,#4791eb 100%)',
    '--menuheadtext': '#fff',
    '--menuselect': '#2f71cd',
    '--menuseltext': '#fff',
    '--accent': '#2f6fd6',
    '--wall': 'linear-gradient(180deg,#3a73c4,#5b94d6 40%,#7aac4e 62%,#5a8f3a)',
    '--ctlface':
      'radial-gradient(circle at 90% 90%,#0054e9 0%,#2263d5 55%,#4479e4 70%,#a3bbec 90%,#fff 100%)',
    '--ctlclose':
      'radial-gradient(circle at 90% 90%,#cc4600 0%,#dc6527 55%,#cd7546 70%,#ffccb2 90%,#fff 100%)',
    '--ctlglyph': '#fff',
    '--ctlborder': '#fff',
    '--traytext': '#fff',
    '--field': '#fff',
  },
  metrics: { '--radius': '8px' },
}

const CLASSIC: ThemePack = {
  id: 'classic',
  name: 'Windows Classic',
  colors: {
    '--title': '#fff',
    '--winbody': '#d4d0c8',
    '--wintext': '#000',
    '--winborder': '#000',
    '--titlegrad': '#000080',
    '--titleinact': '#808080',
    '--taskbar': '#d4d0c8',
    '--startbtn': '#d4d0c8',
    '--starttext': '#000',
    '--menubg': '#d4d0c8',
    '--menuside': '#d4d0c8',
    '--menutext': '#000',
    '--menuhead': '#000080',
    '--menuheadtext': '#fff',
    '--menuselect': '#000080',
    '--menuseltext': '#fff',
    '--accent': '#000080',
    '--wall': '#008080',
    '--ctlface': '#d4d0c8',
    '--ctlclose': '#d4d0c8',
    '--ctlglyph': '#000',
    '--ctlborder': '#808080',
    '--traytext': '#000',
    '--field': '#fff',
  },
  metrics: { '--radius': '0px' },
}

export const PACKS: Record<VisualStyle, ThemePack> = {
  dark: DARK,
  luna: LUNA,
  classic: CLASSIC,
}

/** For the Display Properties "Windows and buttons" list. */
export const PACK_LIST: { id: VisualStyle; label: string }[] = [
  { id: 'dark', label: DARK.name },
  { id: 'luna', label: LUNA.name },
  { id: 'classic', label: CLASSIC.name },
]

export const DEFAULT_VISUAL_STYLE: VisualStyle = 'dark'
