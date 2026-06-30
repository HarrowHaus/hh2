// Original SVG icon recreations (never lifted Microsoft bitmaps — docs/04).
// Kept deliberately simple + theme-neutral; the full icon pack is a Phase 4 pass.
import type { CSSProperties } from 'react'

interface IconProps {
  size?: number
  style?: CSSProperties
  className?: string
}

export function MonitorIcon({ size = 32, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="4" width="26" height="19" rx="2" fill="#d8d8da" stroke="#7a7a7e" />
      <rect x="5" y="6" width="22" height="14" rx="1" fill="#2a6fd6" />
      <rect x="5" y="6" width="22" height="14" rx="1" fill="url(#mg)" />
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fb0f0" /><stop offset="1" stopColor="#1c4fa0" />
        </linearGradient>
      </defs>
      <rect x="12" y="23" width="8" height="3" fill="#bfbfc2" />
      <rect x="9" y="26" width="14" height="3" rx="1" fill="#9a9a9e" stroke="#6f6f72" />
    </svg>
  )
}

export function ComputerIcon({ size = 32, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="2" y="5" width="20" height="15" rx="2" fill="#dadadc" stroke="#7a7a7e" />
      <rect x="4" y="7" width="16" height="11" fill="#2a6fd6" />
      <rect x="9" y="20" width="6" height="3" fill="#bfbfc2" />
      <rect x="6" y="23" width="12" height="2" rx="1" fill="#9a9a9e" />
      <rect x="18" y="12" width="12" height="17" rx="1" fill="#e6e6e8" stroke="#7a7a7e" />
      <rect x="20" y="15" width="8" height="1.5" fill="#9a9a9e" />
      <rect x="20" y="18" width="8" height="1.5" fill="#9a9a9e" />
      <circle cx="24" cy="25" r="1.4" fill="#3aa33a" />
    </svg>
  )
}

// XP four-pane wavy flag for the Start button.
export function FlagIcon({ size = 18, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} className={className} aria-hidden="true">
      <path d="M2 6 Q12 2 22 6 L22 17 Q12 13 2 17 Z" fill="#fff" opacity="0.95" />
      <path d="M2 6 Q7 4.5 12 5.2 L12 11 Q7 10.3 2 11.5 Z" fill="#e23b2e" />
      <path d="M12 5.2 Q17 5.9 22 6 L22 11 Q17 10.9 12 11 Z" fill="#3aaa3a" />
      <path d="M2 11.5 Q7 10.3 12 11 L12 16.6 Q7 16 2 17 Z" fill="#2a7de1" />
      <path d="M12 11 Q17 10.9 22 11 L22 16 Q17 16 12 16.6 Z" fill="#f2c12e" />
    </svg>
  )
}

export function GlobeIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="#1c79d0" stroke="#0d3f74" />
      <path d="M4 16 H28 M16 4 V28 M7 9 Q16 14 25 9 M7 23 Q16 18 25 23" fill="none" stroke="#bfe0ff" strokeWidth="1" />
      <ellipse cx="16" cy="16" rx="6" ry="12" fill="none" stroke="#bfe0ff" strokeWidth="1" />
    </svg>
  )
}

export function FolderIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <path d="M3 8 H13 L16 11 H29 V25 H3 Z" fill="#f6c84c" stroke="#b98a1f" />
      <path d="M3 11 H29 V25 H3 Z" fill="#ffd866" stroke="#b98a1f" />
    </svg>
  )
}

export function NoteIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <path d="M7 3 H22 L26 7 V29 H7 Z" fill="#fdfdfd" stroke="#8a8a8a" />
      <path d="M22 3 V7 H26 Z" fill="#cfcfcf" stroke="#8a8a8a" />
      <path d="M11 12 H21 M11 16 H21 M11 20 H18" stroke="#3a6ea5" strokeWidth="1.3" />
    </svg>
  )
}

export function MusicIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="#2a2a30" stroke="#000" />
      <circle cx="16" cy="16" r="4" fill="#9a1414" />
      <circle cx="16" cy="16" r="1.2" fill="#000" />
      <path d="M16 6 A10 10 0 0 1 26 16" fill="none" stroke="#555" strokeWidth="0.8" />
    </svg>
  )
}

// Generic "setup.exe" installer icon — a CD propped on an open carton, the way
// every codec pack / shareware installer looked alike in the file list.
export function SetupIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <path d="M3 20 L16 25 L29 20 L29 26 L16 31 L3 26 Z" fill="#d9c79a" stroke="#8a7642" />
      <path d="M3 20 L16 15 L29 20 L16 25 Z" fill="#efe3bd" stroke="#8a7642" />
      <circle cx="16" cy="12" r="8.5" fill="#cfd6dd" stroke="#6f7780" />
      <circle cx="16" cy="12" r="8.5" fill="url(#cdg)" opacity="0.6" />
      <circle cx="16" cy="12" r="2.4" fill="#fff" stroke="#6f7780" />
      <circle cx="16" cy="12" r="0.8" fill="#9aa1a8" />
      <defs>
        <linearGradient id="cdg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fd0ff" /><stop offset="0.5" stopColor="#c9a8ff" /><stop offset="1" stopColor="#9affc4" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Adobe Photoshop CS2-era icon: a dark-blue feathered square with "Ps".
export function PhotoshopIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#001e3c" stroke="#0a3a66" />
      <rect x="5" y="5" width="22" height="22" rx="2" fill="none" stroke="#2d6ca3" strokeWidth="0.8" />
      <text x="16" y="22" textAnchor="middle" fontFamily="Georgia, serif" fontSize="15" fontWeight="700" fill="#5fb8f3">Ps</text>
    </svg>
  )
}

// FL Studio / FruityLoops icon: an orange rounded square with a stylized slice.
export function FLStudioIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="6" fill="#f57f17" stroke="#b8560a" />
      <path d="M11 9 h10 v3 h-7 v3 h6 v3 h-6 v6 h-3 Z" fill="#fff" />
      <circle cx="22" cy="21" r="2.4" fill="#fff" />
    </svg>
  )
}

// AIM icon: the yellow running man.
export function AimIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="4" y="3" width="24" height="26" rx="3" fill="#f4c020" stroke="#a8830a" />
      <g fill="#1a1a1a">
        <circle cx="15" cy="9" r="2.6" />
        <path d="M14 12 q3 0 4 3 l3 4 -2.4 1.6 -2.6 -3.4 -1 6 3 5 -2.4 1.4 -3.6 -5.6 -2 4.6 -2.6 -1 2.2 -5.6 -1.4 -4.2 q1.2 -2.4 4 -2.6 Z" />
      </g>
    </svg>
  )
}

// mIRC icon: the folder-with-lightning-bolt look (a # channel marker here).
export function MircIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="4" y="5" width="24" height="22" rx="3" fill="#2a3550" stroke="#11192e" />
      <text x="16" y="22" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="17" fontWeight="900" fill="#7fd0ff">#</text>
    </svg>
  )
}

// Internet Explorer icon: the blue lowercase "e" with a halo.
export function IeIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <ellipse cx="16" cy="16" rx="9" ry="5.5" fill="none" stroke="#ffd24a" strokeWidth="2.4" transform="rotate(-20 16 16)" />
      <text x="16" y="23" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" fontStyle="italic" fill="#1c6fd0">e</text>
    </svg>
  )
}

// Recycle Bin icon: the XP green-arrows bin (shown with a little paper inside).
export function RecycleBinIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <path d="M9 12 H23 L21 29 H11 Z" fill="#dfe3e6" stroke="#8a9298" />
      <path d="M9 12 H23 L22.4 14 H9.6 Z" fill="#c2c8cd" stroke="#8a9298" />
      <rect x="6" y="11" width="3" height="2" fill="#9aa2a8" />
      <g fill="none" stroke="#3aa33a" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12 6 a5 5 0 0 1 8 1" />
        <path d="M20 4 l0.6 3.2 l-3.1 -0.5" stroke="none" fill="#3aa33a" />
        <path d="M20 11 a5 5 0 0 1 -8 -1" />
        <path d="M12 13 l-0.6 -3.2 l3.1 0.5" stroke="none" fill="#3aa33a" />
      </g>
    </svg>
  )
}

// Minesweeper icon: the classic naval mine on a grey tile.
export function MineIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="2" fill="#c0c0c0" stroke="#7a7a7a" />
      <g stroke="#111" strokeWidth="2">
        <line x1="16" y1="6" x2="16" y2="26" /><line x1="6" y1="16" x2="26" y2="16" />
        <line x1="9" y1="9" x2="23" y2="23" /><line x1="23" y1="9" x2="9" y2="23" />
      </g>
      <circle cx="16" cy="16" r="6" fill="#111" />
      <circle cx="14" cy="14" r="1.6" fill="#fff" />
    </svg>
  )
}

// trivia.exe icon: a game-show buzzer with a question mark.
export function TriviaIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <ellipse cx="16" cy="27" rx="11" ry="3" fill="#2a2a2e" />
      <rect x="9" y="16" width="14" height="9" rx="2" fill="#3a3a40" stroke="#1c1c20" />
      <circle cx="16" cy="13" r="9" fill="#c0181c" stroke="#7a0e10" />
      <circle cx="16" cy="13" r="9" fill="url(#tg)" opacity="0.5" />
      <defs>
        <radialGradient id="tg" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <text x="16" y="17" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="900" fill="#fff">?</text>
    </svg>
  )
}

// Image-file icon: a small photo with sky + hill, like the XP picture-file glyph.
export function ImageIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="4" y="6" width="24" height="20" rx="1.5" fill="#fdfdfd" stroke="#8a8a8a" />
      <rect x="6" y="8" width="20" height="16" fill="#8fc7e8" />
      <circle cx="11" cy="13" r="2.4" fill="#ffe27a" />
      <path d="M6 24 L13 16 L18 21 L22 17 L26 24 Z" fill="#4a9a55" />
    </svg>
  )
}

// Command Prompt icon: black console window with a prompt caret.
export function TerminalIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="5" width="26" height="22" rx="1.5" fill="#0b0b0b" stroke="#5a5a5a" />
      <rect x="3" y="5" width="26" height="4" fill="#222" stroke="#5a5a5a" />
      <text x="7" y="22" fontFamily="Consolas, monospace" fontSize="11" fill="#d8d8d8">{'>_'}</text>
    </svg>
  )
}

export function CalcIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="6" y="3" width="20" height="26" rx="2" fill="#d8d8da" stroke="#6f6f72" />
      <rect x="9" y="6" width="14" height="5" rx="1" fill="#9fc7a0" stroke="#4f6f50" />
      <g fill="#4a4a4e">
        <rect x="9" y="14" width="3" height="3" /><rect x="14" y="14" width="3" height="3" /><rect x="19" y="14" width="3" height="3" />
        <rect x="9" y="19" width="3" height="3" /><rect x="14" y="19" width="3" height="3" /><rect x="19" y="19" width="3" height="3" />
        <rect x="9" y="24" width="3" height="3" /><rect x="14" y="24" width="3" height="3" />
      </g>
      <rect x="19" y="24" width="3" height="3" fill="#c0392b" />
    </svg>
  )
}

export function CharMapIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="4" y="4" width="24" height="24" rx="2" fill="#fdfdfd" stroke="#7a7a7e" />
      <path d="M4 12 H28 M4 20 H28 M12 4 V28 M20 4 V28" stroke="#c8c8cc" strokeWidth="1" />
      <text x="8" y="11" fontSize="7" fontFamily="Times New Roman, serif" fill="#333">A</text>
      <text x="16" y="19" fontSize="8" fontFamily="Times New Roman, serif" fontWeight="700" fill="#1c4fa0">ß</text>
      <text x="22" y="27" fontSize="7" fontFamily="Times New Roman, serif" fill="#333">Ω</text>
    </svg>
  )
}

export function RecorderIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="9" width="26" height="14" rx="3" fill="#3a3a3e" stroke="#1c1c1e" />
      <circle cx="10" cy="16" r="4" fill="#555" stroke="#222" /><circle cx="22" cy="16" r="4" fill="#555" stroke="#222" />
      <circle cx="10" cy="16" r="1.4" fill="#9affc4" /><circle cx="22" cy="16" r="1.4" fill="#9affc4" />
      <rect x="14" y="14" width="4" height="4" rx="1" fill="#c0392b" />
    </svg>
  )
}

export function HexIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="4" y="3" width="24" height="26" rx="2" fill="#101417" stroke="#2d6ca3" />
      <text x="7" y="13" fontSize="6" fontFamily="monospace" fill="#5fd0a0">4F 2A</text>
      <text x="7" y="20" fontSize="6" fontFamily="monospace" fill="#5fd0a0">B1 09</text>
      <text x="7" y="27" fontSize="6" fontFamily="monospace" fill="#5fd0a0">7E FF</text>
    </svg>
  )
}

export function SolitaireIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="4" y="7" width="15" height="20" rx="2" fill="#fff" stroke="#888" transform="rotate(-10 11 17)" />
      <rect x="11" y="6" width="15" height="20" rx="2" fill="#fff" stroke="#888" />
      <text x="13.5" y="14" fontSize="7" fontWeight="700" fill="#c0392b">A</text>
      <path d="M18 17 l3 5 h-6 Z" fill="#c0392b" transform="rotate(180 18 19.5)" />
    </svg>
  )
}

export function BreakoutIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="2" fill="#0b0e14" stroke="#444" />
      <rect x="5" y="6" width="6" height="3" fill="#e23b2e" /><rect x="12" y="6" width="6" height="3" fill="#f2c12e" /><rect x="19" y="6" width="6" height="3" fill="#3aaa3a" />
      <rect x="5" y="10" width="6" height="3" fill="#2a7de1" /><rect x="12" y="10" width="6" height="3" fill="#e23b2e" /><rect x="19" y="10" width="6" height="3" fill="#f2c12e" />
      <circle cx="16" cy="20" r="1.8" fill="#fff" />
      <rect x="11" y="25" width="10" height="2.5" rx="1" fill="#ccc" />
    </svg>
  )
}

export function RunnerIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="2" fill="#1a1430" stroke="#444" />
      <path d="M11 22 q0 -8 5 -8 q5 0 5 8 l-2 -2 -1.5 2 -1.5 -2 -1.5 2 -1.5 -2 Z" fill="#e8e8f0" />
      <circle cx="14.5" cy="18" r="1.1" fill="#1a1430" /><circle cx="17.5" cy="18" r="1.1" fill="#1a1430" />
      <rect x="5" y="24" width="22" height="2" fill="#3a2f5a" />
    </svg>
  )
}

export function MarkdownIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <path d="M7 3 H22 L26 7 V29 H7 Z" fill="#fdfdfd" stroke="#8a8a8a" />
      <path d="M22 3 V7 H26 Z" fill="#cfcfcf" stroke="#8a8a8a" />
      <text x="10" y="17" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#1c4fa0">M↓</text>
      <path d="M10 21 H22 M10 24 H19" stroke="#888" strokeWidth="1.2" />
    </svg>
  )
}

export function PdfIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <path d="M7 3 H22 L26 7 V29 H7 Z" fill="#fdfdfd" stroke="#8a8a8a" />
      <path d="M22 3 V7 H26 Z" fill="#cfcfcf" stroke="#8a8a8a" />
      <rect x="6" y="17" width="20" height="8" rx="1" fill="#c0392b" />
      <text x="16" y="23.5" textAnchor="middle" fontSize="6" fontWeight="700" fontFamily="Arial, sans-serif" fill="#fff">PDF</text>
    </svg>
  )
}

export function V86Icon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="5" width="26" height="18" rx="2" fill="#c8ccd0" stroke="#6f7378" />
      <rect x="5" y="7" width="22" height="14" rx="1" fill="#0a0a0a" />
      <text x="16" y="17" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#5aff6a">x86</text>
      <rect x="11" y="23" width="10" height="3" fill="#9aa0a6" />
      <rect x="8" y="26" width="16" height="2" rx="1" fill="#7a8086" />
    </svg>
  )
}

export function CodeIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="4" width="26" height="24" rx="3" fill="#1e1e1e" stroke="#0a0a0a" />
      <path d="M12 11 l-5 5 l5 5 M20 11 l5 5 l-5 5" fill="none" stroke="#4ea0e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 9 l-2 14" stroke="#9aa0a6" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function RuffleIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="4" y="4" width="24" height="24" rx="5" fill="#cc0000" />
      <rect x="4" y="4" width="24" height="24" rx="5" fill="url(#rfl)" opacity="0.25" />
      <defs><linearGradient id="rfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient></defs>
      <text x="16" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="12" fill="#fff">Sf</text>
    </svg>
  )
}

export function Tic80Icon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="4" y="4" width="24" height="24" rx="4" fill="#1a1c2c" stroke="#3b3f54" />
      <rect x="7" y="7" width="18" height="13" rx="1" fill="#000" />
      <circle cx="12" cy="13" r="2.4" fill="#ef7d57" />
      <circle cx="19" cy="15" r="1.6" fill="#ffcd75" />
      <path d="M15 12 l2 1.5 l-2 1.5 Z" fill="#f4f4f4" />
      <circle cx="9" cy="24.5" r="1.6" fill="#566c86" />
      <circle cx="13" cy="24.5" r="1.6" fill="#566c86" />
      <rect x="20" y="23" width="4" height="3" rx="1" fill="#ef7d57" />
    </svg>
  )
}

export function ChessIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="2" fill="#efe6d2" stroke="#7a6a4a" />
      <g fill="#3a2f22">
        <rect x="3" y="3" width="6.5" height="6.5" /><rect x="16" y="3" width="6.5" height="6.5" />
        <rect x="9.5" y="9.5" width="6.5" height="6.5" /><rect x="22.5" y="9.5" width="6.5" height="6.5" />
        <rect x="3" y="16" width="6.5" height="6.5" /><rect x="16" y="16" width="6.5" height="6.5" />
        <rect x="9.5" y="22.5" width="6.5" height="6.5" /><rect x="22.5" y="22.5" width="6.5" height="6.5" />
      </g>
      <text x="16" y="22" textAnchor="middle" fontSize="16" fill="#111">♞</text>
    </svg>
  )
}

export function SigilIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="3" fill="#0a0612" stroke="#2a1f55" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="#8b7bff" strokeWidth="1" opacity="0.8" />
      <path d="M10 21 L18 9 L22 20 L11 14 L21 13 Z" fill="none" stroke="#9affc4" strokeWidth="1.2" />
      <circle cx="18" cy="9" r="1.4" fill="#ffd23f" />
    </svg>
  )
}

export function AnsiIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="4" width="26" height="24" rx="2" fill="#000" stroke="#444" />
      <text x="6" y="13" fontFamily="monospace" fontSize="7" fill="#ff5555">▓▒░</text>
      <text x="6" y="20" fontFamily="monospace" fontSize="7" fill="#55ff55">╔═╗</text>
      <text x="6" y="27" fontFamily="monospace" fontSize="7" fill="#ffff55">█▄█</text>
    </svg>
  )
}

export function KeygenIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="3" fill="#161033" stroke="#2a1f55" />
      <circle cx="12" cy="14" r="5" fill="none" stroke="#9affc4" strokeWidth="2" />
      <path d="M16 16 L25 25 M22 22 l3 0 M20 20 l0 3" stroke="#ffd23f" strokeWidth="2" fill="none" />
      <circle cx="12" cy="14" r="1.6" fill="#161033" />
    </svg>
  )
}

export function FreeCellIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="4" width="26" height="24" rx="2" fill="#1f7a3a" stroke="#0d3f20" />
      <rect x="5" y="6" width="5" height="7" rx="1" fill="#fff" stroke="#888" />
      <rect x="11" y="6" width="5" height="7" rx="1" fill="#fff" stroke="#888" />
      <rect x="17" y="6" width="5" height="7" rx="1" fill="#fff" stroke="#888" />
      <rect x="23" y="6" width="4.5" height="7" rx="1" fill="#fff" stroke="#888" />
      <text x="6.6" y="12" fontSize="5" fontWeight="700" fill="#c0392b">A</text>
      <text x="19" y="12" fontSize="5" fontWeight="700" fill="#111">K</text>
    </svg>
  )
}

export function SpiderIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="4" width="26" height="24" rx="2" fill="#143a6b" stroke="#0a2245" />
      <rect x="6" y="8" width="7" height="10" rx="1" fill="#fff" stroke="#888" />
      <rect x="11" y="11" width="7" height="10" rx="1" fill="#fff" stroke="#888" />
      <rect x="16" y="14" width="7" height="10" rx="1" fill="#fff" stroke="#888" />
      <text x="17.5" y="22" fontSize="8" fontWeight="700" fill="#111">♠</text>
    </svg>
  )
}

export function BsodIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <rect x="3" y="5" width="26" height="20" rx="2" fill="#0000aa" stroke="#000" />
      <path d="M6 9 h10 M6 12 h14 M6 15 h8 M6 19 h16" stroke="#fff" strokeWidth="1.2" opacity="0.85" />
      <rect x="12" y="25" width="8" height="3" fill="#9a9a9e" />
    </svg>
  )
}

export function UpdateIcon({ size = 30, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="#1f3b73" stroke="#0d234a" />
      <path d="M16 8 A8 8 0 1 1 8 16" fill="none" stroke="#fff" strokeWidth="2.4" />
      <path d="M16 4 l3 4 h-6 Z" fill="#fff" />
    </svg>
  )
}

export function VolumeIcon({ size = 16, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={style} className={className} aria-hidden="true">
      <path d="M3 6 H5 L8 3 V13 L5 10 H3 Z" fill="#e6e6e6" stroke="#444" strokeWidth="0.5" />
      <path d="M10 5 Q12 8 10 11" fill="none" stroke="#8fd0ff" strokeWidth="1.2" />
      <path d="M11.5 3.5 Q14.5 8 11.5 12.5" fill="none" stroke="#8fd0ff" strokeWidth="1.2" />
    </svg>
  )
}
