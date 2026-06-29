import type { FC } from 'react'
import type { AppId, AppProps } from './types'
import { MonitorIcon, FolderIcon, NoteIcon, MusicIcon, GlobeIcon, SetupIcon, PhotoshopIcon, FLStudioIcon, TerminalIcon, ImageIcon, TriviaIcon, MineIcon, RecycleBinIcon, AimIcon, MircIcon, IeIcon, CalcIcon, CharMapIcon, RecorderIcon, HexIcon, SolitaireIcon, BreakoutIcon, RunnerIcon, MarkdownIcon, PdfIcon, BsodIcon, UpdateIcon } from './icons'
import { DisplayProperties } from '../apps/DisplayProperties/DisplayProperties'
import { Explorer } from '../apps/Explorer/Explorer'
import { Notepad } from '../apps/Notepad/Notepad'
import { Foobar } from '../apps/foobar/Foobar'
import { BitTorrent } from '../apps/BitTorrent/BitTorrent'
import { Installer } from '../apps/Installer/Installer'
import { Photoshop } from '../apps/Photoshop/Photoshop'
import { FLStudio } from '../apps/FLStudio/FLStudio'
import { Terminal } from '../apps/Terminal/Terminal'
import { ImageViewer } from '../apps/ImageViewer/ImageViewer'
import { Trivia } from '../apps/Trivia/Trivia'
import { Minesweeper } from '../apps/Minesweeper/Minesweeper'
import { MsgBox } from '../apps/MsgBox/MsgBox'
import { RecycleBin } from '../apps/RecycleBin/RecycleBin'
import { AIM } from '../apps/AIM/AIM'
import { Mirc } from '../apps/Mirc/Mirc'
import { IE } from '../apps/IE/IE'
import { Calculator } from '../apps/Calculator/Calculator'
import { CharMap } from '../apps/CharMap/CharMap'
import { SoundRecorder } from '../apps/SoundRecorder/SoundRecorder'
import { HexEditor } from '../apps/HexEditor/HexEditor'
import { Solitaire } from '../apps/Solitaire/Solitaire'
import { Breakout } from '../apps/Breakout/Breakout'
import { Runner } from '../apps/Runner/Runner'
import { Markdown } from '../apps/Markdown/Markdown'
import { Pdf } from '../apps/Pdf/Pdf'
import { Bsod } from '../apps/Bsod/Bsod'
import { WinUpdate } from '../apps/WinUpdate/WinUpdate'

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
  notepad: { Icon: NoteIcon, Component: Notepad },
  foobar: { Icon: MusicIcon, Component: Foobar },
  bt: { Icon: GlobeIcon, Component: BitTorrent },
  installer: { Icon: SetupIcon, Component: Installer },
  photoshop: { Icon: PhotoshopIcon, Component: Photoshop },
  flstudio: { Icon: FLStudioIcon, Component: FLStudio },
  terminal: { Icon: TerminalIcon, Component: Terminal },
  imageviewer: { Icon: ImageIcon, Component: ImageViewer },
  trivia: { Icon: TriviaIcon, Component: Trivia },
  minesweeper: { Icon: MineIcon, Component: Minesweeper },
  msgbox: { Icon: NoteIcon, Component: MsgBox },
  recyclebin: { Icon: RecycleBinIcon, Component: RecycleBin },
  aim: { Icon: AimIcon, Component: AIM },
  mirc: { Icon: MircIcon, Component: Mirc },
  ie: { Icon: IeIcon, Component: IE },
  calc: { Icon: CalcIcon, Component: Calculator },
  charmap: { Icon: CharMapIcon, Component: CharMap },
  recorder: { Icon: RecorderIcon, Component: SoundRecorder },
  hexedit: { Icon: HexIcon, Component: HexEditor },
  solitaire: { Icon: SolitaireIcon, Component: Solitaire },
  breakout: { Icon: BreakoutIcon, Component: Breakout },
  runner: { Icon: RunnerIcon, Component: Runner },
  markdown: { Icon: MarkdownIcon, Component: Markdown },
  pdf: { Icon: PdfIcon, Component: Pdf },
  bsod: { Icon: BsodIcon, Component: Bsod },
  winupdate: { Icon: UpdateIcon, Component: WinUpdate },
}
