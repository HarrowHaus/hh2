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

export function VolumeIcon({ size = 16, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={style} className={className} aria-hidden="true">
      <path d="M3 6 H5 L8 3 V13 L5 10 H3 Z" fill="#e6e6e6" stroke="#444" strokeWidth="0.5" />
      <path d="M10 5 Q12 8 10 11" fill="none" stroke="#8fd0ff" strokeWidth="1.2" />
      <path d="M11.5 3.5 Q14.5 8 11.5 12.5" fill="none" stroke="#8fd0ff" strokeWidth="1.2" />
    </svg>
  )
}
