# CREDITS & THIRD-PARTY NOTICES

THE HAND-ME-DOWN is an **original reimplementation**. As of this writing **no
third-party source code is vendored** into this repository — its only runtime
dependencies are React, React-DOM, and Zustand (see `package.json`), and every
asset is an original SVG recreation (no lifted Microsoft bitmaps; see
`docs/04-assets-and-tooling.md`).

The two repositories below are credited as **references**, not as redistributed
code. The XP chrome geometry (title-bar/control/taskbar/Start-menu metrics) and
the window-manager reducer *pattern* were studied from ShizukuIchi/winXP and
re-expressed in original code on a different stack (Vite + React + TypeScript +
Zustand + CSS Modules); daedalOS is a **behavioral / parity reference** that
informed feature behavior by observation, with no code copied. This file
fulfills the attribution commitment recorded in `DECISIONS.md` (Phase-0). Because
we reimplemented rather than redistributed, this is **credit, not a
redistribution obligation** — we extend it anyway, as a courtesy and as promised.

As upstream apps/libraries are adopted in later tiers (see
`docs/08-app-roadmap.md`), **each will be added below with its name, upstream
URL, license, and any branding/name terms** — installed from its own upstream
package, never by copying another project's integration code.

---

## References

### ShizukuIchi/winXP — XP chrome & window-manager reducer reference
- Upstream: https://github.com/ShizukuIchi/winXP
- License: MIT
- Referenced for: authentic XP chrome metrics (3px window frame, ~26px gradient
  title bar, 22px caption buttons, 30px taskbar, two-panel Start menu) and the
  window-manager reducer shape (add/remove/focus/minimize/maximize/z-order),
  re-expressed in original TypeScript + Zustand + CSS Modules. Self-credited
  inline in the relevant chrome files.

```
MIT License

Copyright (c) 2019 Shizuku Yang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### DustinBrett/daedalOS — behavioral / parity reference
- Upstream: https://github.com/DustinBrett/daedalOS
- License: MIT
- Referenced for: the OS-parity floor (file-system depth, window-manager
  behavior such as top-edge maximize / side-edge half-tile snapping) used as the
  side-by-side acceptance bar. No code copied.

```
MIT License

Copyright (c) 2025 Dustin Brett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Adopted third-party apps & libraries

Added per-app as tiers land (`docs/08-app-roadmap.md`). GPL/AGPL/non-commercial/
name-restricted components are flagged as owner decisions before adoption.

### Tier 1
- **marked** — https://github.com/markedjs/marked — **MIT**. Markdown → HTML for the Markdown viewer.
- **DOMPurify** — https://github.com/cure53/DOMPurify — **Apache-2.0 OR MPL-2.0** (dual; we use it under Apache-2.0). Sanitizes the Markdown viewer's HTML output.
- **pdf.js (pdfjs-dist)** — https://github.com/mozilla/pdf.js — **Apache-2.0**. Renders the PDF viewer; pinned to 4.x for broad browser compatibility. Mozilla name/logo are not used.
- **panzoom** — https://github.com/anvaka/panzoom — **MIT**. Drag-pan + wheel/pinch-zoom in the Image Viewer (Windows Picture and Fax Viewer).

All three are permissive (no copyleft). The Calculator, Character Map, Sound
Recorder, Hex Editor, Solitaire, Brick Breaker, Crypt Runner, the CRT/VHS
overlay, the screen savers (Starfield/Mystify/Matrix/3D Pipes), and the BSOD /
fake-Windows-Update easter eggs are **original code** (no third-party upstream);
card faces, sprites, and screensaver art are original (no Microsoft/Google/Taito
assets).

- **oneko (desktop pet)** — concept inspired by https://github.com/adryd325/oneko.js (**MIT**) and the public-domain Neko sprite; our cat is an **original SVG** (no upstream code or sprite shipped).

### Tier 2
- **Sigil generator, ANSI/.nfo viewer, and the warez keygen are original code** (no third-party upstream). The keygen's chiptune is an **original Web Audio square-wave synth** (not chiptune3/libopenmpt). The ANSI viewer is an **original CP437/SGR renderer** (not ansilove.js). Scene group/product names and serials are invented; nothing is cracked. The Sigil generator is an original implementation of the public-domain Spare/Carroll method (no upstream code).
- **chess.js** — https://github.com/jhlywa/chess.js — **BSD-2-Clause**. Chess rules/move-generation for the Chess app.
- **Stockfish** — https://github.com/nmrugg/stockfish.js (engine: https://stockfishchess.org) — **GPL-3.0**. ⚠️ Copyleft. Shipped **isolated** as a separate single-threaded-lite Web Worker under `public/stockfish/` (loaded at runtime, never bundled into our MIT app code); the GPL text ships at `/stockfish/COPYING.txt` and the entire project source is public, satisfying GPL source-availability. The built-in minimax is the fallback when the engine can't load.
- **BassoonTracker** — https://github.com/steffest/BassoonTracker — **MIT**. The "FL Studio" app loads it from `public/bassoon/` via an iframe seam **if the dist is vendored there** (not on npm; not yet bundled — replace its sample disks with free/original audio before shipping).
- _Deferred Tier-2 items pending owner decisions:_ Webamp (skin — going gray-area classic per owner), chiptune3 real-`.mod` player (AudioWorklet/wasm bundling — in progress). See the review notes.
