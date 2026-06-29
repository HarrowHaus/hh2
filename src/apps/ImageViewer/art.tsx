import type { FC } from 'react'

// Original SVG image recreations (docs/04 — never lifted bitmaps). Each "image
// file" in the FS stores an art id in node.content; the viewer renders the
// matching component. Fictional content, period-flavored (docs/07).

interface ArtProps {
  className?: string
}

// what.cd-era Spek spectral screenshot — proof a rip is a real lossless file
// (energy reaches the top with no transcode shelf). Stratum B.
const SpekSpectral: FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 480 320" width="480" height="320" className={className} role="img" aria-label="Spek spectral analysis screenshot">
    <rect width="480" height="320" fill="#1b1b1f" />
    <text x="10" y="18" fontFamily="sans-serif" fontSize="11" fill="#d0d0d0">Spek — moldmouth - untitled 1.flac</text>
    {/* plot frame */}
    <rect x="40" y="30" width="404" height="240" fill="#0c0c10" stroke="#3a3a42" />
    {/* frequency axis labels (kHz) */}
    {[0, 5, 10, 15, 20].map((k, i) => (
      <text key={k} x="36" y={270 - i * 60 + 4} textAnchor="end" fontFamily="sans-serif" fontSize="9" fill="#9a9aa2">{k}</text>
    ))}
    <text x="14" y="155" fontFamily="sans-serif" fontSize="9" fill="#9a9aa2" transform="rotate(-90 14 155)">kHz</text>
    {/* spectrogram: columns of energy reaching near the top (lossless) */}
    {Array.from({ length: 200 }).map((_, i) => {
      const x = 40 + i * 2.02
      // pseudo-random but deterministic energy profile
      const seed = (i * 73 + 13) % 97
      const top = 36 + (seed % 18) // reaches high — no hard cutoff
      const intensity = 0.4 + (seed % 40) / 90
      return (
        <rect
          key={i}
          x={x}
          y={top}
          width="2.1"
          height={270 - top}
          fill={`rgba(${120 + seed}, ${60 + (seed % 80)}, ${200 - (seed % 90)}, ${intensity})`}
        />
      )
    })}
    {/* faint top energy band so it clearly reaches ~20kHz */}
    <rect x="40" y="36" width="404" height="20" fill="rgba(90,40,160,0.25)" />
    <text x="444" y="282" textAnchor="end" fontFamily="sans-serif" fontSize="9" fill="#6a6a72">FLAC · 16/44.1 · no transcode</text>
  </svg>
)

// Video-nasty poster for the (fictional) film already in MOVIES\. Stratum B.
const SpectralPoster: FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 360 480" width="360" height="480" className={className} role="img" aria-label="Spectral Corridor video nasty poster">
    <rect width="360" height="480" fill="#0a0506" />
    <rect x="0" y="0" width="360" height="480" fill="url(#vg)" />
    <defs>
      <radialGradient id="vg" cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#3a0d0d" /><stop offset="1" stopColor="#0a0506" />
      </radialGradient>
    </defs>
    {/* corridor perspective */}
    <g stroke="#2a1414" strokeWidth="1" fill="none">
      <path d="M40 80 L160 220 L160 380 L40 460 Z" fill="#140a0a" />
      <path d="M320 80 L200 220 L200 380 L320 460 Z" fill="#140a0a" />
      <path d="M160 220 L200 220 L200 380 L160 380 Z" fill="#060303" />
      <path d="M120 110 L120 150 M240 110 L240 150 M150 170 L150 200 M210 170 L210 200" stroke="#3a1c1c" />
    </g>
    {/* a pale figure at the vanishing point */}
    <ellipse cx="180" cy="250" rx="9" ry="26" fill="#cdbfb0" opacity="0.85" />
    <circle cx="180" cy="228" r="7" fill="#ddd0c2" opacity="0.9" />
    <text x="180" y="70" textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" fill="#b08" letterSpacing="3" opacity="0.8">BANNED IN 31 COUNTRIES</text>
    <text x="180" y="408" textAnchor="middle" fontFamily="Arial Black, Impact, sans-serif" fontSize="40" fontWeight="900" fill="#c0181c">SPECTRAL</text>
    <text x="180" y="446" textAnchor="middle" fontFamily="Arial Black, Impact, sans-serif" fontSize="40" fontWeight="900" fill="#c0181c">CORRIDOR</text>
    <text x="180" y="466" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill="#8a7a6a" fontStyle="italic">the hallway never ends · 1986</text>
  </svg>
)

// MS-Paint chaos-magick sigil on a white canvas. Cross-strata vein.
const ChaosSigil: FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 320 320" width="320" height="320" className={className} role="img" aria-label="Chaos magick sigil drawn in MS Paint">
    <rect width="320" height="320" fill="#ffffff" />
    <g stroke="#000" strokeWidth="3" fill="none" strokeLinecap="square">
      <circle cx="160" cy="160" r="110" />
      {/* combined-letterform glyph, hand-drawn jagged */}
      <path d="M90 210 L150 90 L170 180 L120 150 L210 120 L180 230" />
      <path d="M160 60 L160 110 M110 160 L80 160 M210 160 L240 160" />
      <path d="M130 250 Q160 270 200 250" />
      <circle cx="160" cy="90" r="6" fill="#000" />
    </g>
    {/* stray paint-bucket pixels / .bmp grit */}
    <rect x="44" y="280" width="4" height="4" fill="#000" />
    <rect x="276" y="40" width="3" height="3" fill="#000" />
    <rect x="60" y="58" width="2" height="2" fill="#000" />
  </svg>
)

// DIY xerox demo cover (exported .png companion to the .psd). Stratum A.
const MoldmouthCover: FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 300 380" width="300" height="380" className={className} role="img" aria-label="Moldmouth demo cover">
    <rect width="300" height="380" fill="#f4f1e9" />
    <g fill="#1a1a1a" opacity="0.5">
      {Array.from({ length: 80 }).map((_, i) => (
        <rect key={i} x={(i * 53) % 300} y={(i * 97) % 380} width={(i % 3) + 0.5} height={(i % 2) + 0.5} />
      ))}
    </g>
    <g fill="#111">
      <path d="M150 70 C100 70 78 110 84 150 C88 176 104 188 104 206 L196 206 C196 188 212 176 216 150 C222 110 200 70 150 70 Z" />
      <ellipse cx="124" cy="146" rx="16" ry="20" fill="#f4f1e9" />
      <ellipse cx="176" cy="146" rx="16" ry="20" fill="#f4f1e9" />
      <path d="M150 168 l-10 22 h20 Z" fill="#f4f1e9" />
    </g>
    <rect x="20" y="244" width="260" height="52" fill="#111" transform="rotate(-1.5 150 270)" />
    <text x="150" y="282" textAnchor="middle" fontFamily="Arial Black, Impact, sans-serif" fontSize="38" fontWeight="900" fill="#f4f1e9" transform="rotate(-1.5 150 270)">MOLDMOUTH</text>
    <text x="150" y="324" textAnchor="middle" fontFamily="Courier New, monospace" fontSize="13" letterSpacing="2" fill="#111">demo · 2005 · noise</text>
  </svg>
)

export const ART: Record<string, FC<ArtProps>> = {
  'spek-spectral': SpekSpectral,
  'spectral-poster': SpectralPoster,
  'chaos-sigil': ChaosSigil,
  'moldmouth-cover': MoldmouthCover,
}
