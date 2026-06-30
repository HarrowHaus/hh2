import { lazy, type ComponentType, type FC, type LazyExoticComponent } from 'react'
import type { AppId, AppProps } from './types'
import { MonitorIcon, FolderIcon, NoteIcon, MusicIcon, GlobeIcon, SetupIcon, PhotoshopIcon, FLStudioIcon, TerminalIcon, ImageIcon, TriviaIcon, MineIcon, RecycleBinIcon, AimIcon, MircIcon, IeIcon, CalcIcon, CharMapIcon, RecorderIcon, HexIcon, SolitaireIcon, BreakoutIcon, RunnerIcon, MarkdownIcon, PdfIcon, BsodIcon, UpdateIcon, FreeCellIcon, SpiderIcon, SigilIcon, AnsiIcon, KeygenIcon, ChessIcon, CodeIcon, V86Icon, Tic80Icon, RuffleIcon, EmulatorIcon, OpenTypeIcon, VideoIcon } from './icons'

interface IconProps {
  size?: number
  className?: string
}

export interface AppEntry {
  Icon: FC<IconProps>
  Component: LazyExoticComponent<ComponentType<AppProps>>
}

// Each app's window content is code-split into its own chunk (lazy import) so the
// initial bundle stays small — only the apps a visitor actually opens are
// fetched. Icons stay eager (tiny SVGs rendered in the desktop/taskbar/Start
// lists, which can't suspend). Window wraps the lazy Component in <Suspense>.
const named = <K extends string>(
  loader: () => Promise<Record<K, ComponentType<AppProps>>>,
  key: K,
) => lazy(() => loader().then((m) => ({ default: m[key] })))

// Registry mapping each app to its window content + icon. Window sizing/titles
// live in appMeta.ts (no React) so the store stays free of component imports.
export const APPS: Record<AppId, AppEntry> = {
  display: { Icon: MonitorIcon, Component: named(() => import('../apps/DisplayProperties/DisplayProperties'), 'DisplayProperties') },
  explorer: { Icon: FolderIcon, Component: named(() => import('../apps/Explorer/Explorer'), 'Explorer') },
  notepad: { Icon: NoteIcon, Component: named(() => import('../apps/Notepad/Notepad'), 'Notepad') },
  foobar: { Icon: MusicIcon, Component: named(() => import('../apps/foobar/Foobar'), 'Foobar') },
  bt: { Icon: GlobeIcon, Component: named(() => import('../apps/BitTorrent/BitTorrent'), 'BitTorrent') },
  installer: { Icon: SetupIcon, Component: named(() => import('../apps/Installer/Installer'), 'Installer') },
  photoshop: { Icon: PhotoshopIcon, Component: named(() => import('../apps/Photoshop/Photoshop'), 'Photoshop') },
  flstudio: { Icon: FLStudioIcon, Component: named(() => import('../apps/FLStudio/FLStudio'), 'FLStudio') },
  terminal: { Icon: TerminalIcon, Component: named(() => import('../apps/Terminal/Terminal'), 'Terminal') },
  imageviewer: { Icon: ImageIcon, Component: named(() => import('../apps/ImageViewer/ImageViewer'), 'ImageViewer') },
  trivia: { Icon: TriviaIcon, Component: named(() => import('../apps/Trivia/Trivia'), 'Trivia') },
  minesweeper: { Icon: MineIcon, Component: named(() => import('../apps/Minesweeper/Minesweeper'), 'Minesweeper') },
  msgbox: { Icon: NoteIcon, Component: named(() => import('../apps/MsgBox/MsgBox'), 'MsgBox') },
  recyclebin: { Icon: RecycleBinIcon, Component: named(() => import('../apps/RecycleBin/RecycleBin'), 'RecycleBin') },
  aim: { Icon: AimIcon, Component: named(() => import('../apps/AIM/AIM'), 'AIM') },
  mirc: { Icon: MircIcon, Component: named(() => import('../apps/Mirc/Mirc'), 'Mirc') },
  ie: { Icon: IeIcon, Component: named(() => import('../apps/IE/IE'), 'IE') },
  calc: { Icon: CalcIcon, Component: named(() => import('../apps/Calculator/Calculator'), 'Calculator') },
  charmap: { Icon: CharMapIcon, Component: named(() => import('../apps/CharMap/CharMap'), 'CharMap') },
  recorder: { Icon: RecorderIcon, Component: named(() => import('../apps/SoundRecorder/SoundRecorder'), 'SoundRecorder') },
  hexedit: { Icon: HexIcon, Component: named(() => import('../apps/HexEditor/HexEditor'), 'HexEditor') },
  solitaire: { Icon: SolitaireIcon, Component: named(() => import('../apps/Solitaire/Solitaire'), 'Solitaire') },
  breakout: { Icon: BreakoutIcon, Component: named(() => import('../apps/Breakout/Breakout'), 'Breakout') },
  runner: { Icon: RunnerIcon, Component: named(() => import('../apps/Runner/Runner'), 'Runner') },
  markdown: { Icon: MarkdownIcon, Component: named(() => import('../apps/Markdown/Markdown'), 'Markdown') },
  pdf: { Icon: PdfIcon, Component: named(() => import('../apps/Pdf/Pdf'), 'Pdf') },
  bsod: { Icon: BsodIcon, Component: named(() => import('../apps/Bsod/Bsod'), 'Bsod') },
  winupdate: { Icon: UpdateIcon, Component: named(() => import('../apps/WinUpdate/WinUpdate'), 'WinUpdate') },
  freecell: { Icon: FreeCellIcon, Component: named(() => import('../apps/FreeCell/FreeCell'), 'FreeCell') },
  spider: { Icon: SpiderIcon, Component: named(() => import('../apps/Spider/Spider'), 'Spider') },
  sigil: { Icon: SigilIcon, Component: named(() => import('../apps/Sigil/Sigil'), 'Sigil') },
  ansi: { Icon: AnsiIcon, Component: named(() => import('../apps/AnsiViewer/AnsiViewer'), 'AnsiViewer') },
  keygen: { Icon: KeygenIcon, Component: named(() => import('../apps/Keygen/Keygen'), 'Keygen') },
  chess: { Icon: ChessIcon, Component: named(() => import('../apps/Chess/Chess'), 'Chess') },
  code: { Icon: CodeIcon, Component: named(() => import('../apps/Code/Code'), 'Code') },
  v86: { Icon: V86Icon, Component: named(() => import('../apps/V86/V86'), 'V86App') },
  tic80: { Icon: Tic80Icon, Component: named(() => import('../apps/Tic80/Tic80'), 'Tic80') },
  ruffle: { Icon: RuffleIcon, Component: named(() => import('../apps/Ruffle/Ruffle'), 'Ruffle') },
  emulatorjs: { Icon: EmulatorIcon, Component: named(() => import('../apps/EmulatorJS/EmulatorJS'), 'EmulatorJS') },
  opentype: { Icon: OpenTypeIcon, Component: named(() => import('../apps/OpenType/OpenType'), 'OpenType') },
  videoplayer: { Icon: VideoIcon, Component: named(() => import('../apps/VideoPlayer/VideoPlayer'), 'VideoPlayer') },
}
