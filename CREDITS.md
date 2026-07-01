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
- _Deferred Tier-2 items:_ Webamp + butterchurn (webamp won't apply a skin in our host — integration issue, not the skin) and chiptune3 real-`.mod` player (AudioWorklet/wasm) — deferred per owner; the keygen covers chiptune.

### Tier 3
- **Monaco Editor (monaco-editor)** — https://github.com/microsoft/monaco-editor — **MIT**. The VS Code editor core powers the Code app (lazy-loaded own chunk; editor + JS/TS/JSON/CSS/HTML language workers bundled, no network). Microsoft name/logo not used.
- **v86** — https://github.com/copy/v86 — **BSD-2-Clause**. x86 PC emulator (WASM) powering the "Virtual Machine" app (lazy-loaded own chunk). Engine `v86.wasm`, **SeaBIOS** and **VGABIOS** (both LGPL-3.0, shipped unmodified as standalone firmware blobs under `public/v86/`) are vendored locally so it runs fully offline.
- **FreeDOS** — https://www.freedos.org — the boot floppy image (`public/v86/freedos722.img`) is the **freely redistributable** FreeDOS distribution (kernel GPL-2.0; bundled as an unmodified disk image, no proprietary content). v86 boots it to an `A:\>` prompt.
- **TIC-80** — https://github.com/nesbox/TIC-80 — **MIT**. Fantasy-console runtime (prebuilt wasm from the upstream `-html` release, vendored to `public/tic80/`, loaded in an iframe). The cart it runs (`moth.tic`) is an **original** game authored in-repo (`scripts/make-tic80-cart.mjs`) — no third-party game content. "TIC-80" name used nominatively only.
- **Ruffle** — https://github.com/ruffle-rs/ruffle — **MIT OR Apache-2.0** (both license texts vendored: `public/ruffle/LICENSE_MIT`, `LICENSE_APACHE`). The self-hosted wasm Flash emulator powering the "Flash Player" app (engine lazy-loaded from `public/ruffle/`). Shipped as a **ready shell**: no third-party `.swf` content is bundled — you open your own movie via the loader. "Flash" used nominatively (describes the SWF format it plays).
- **EmulatorJS** — https://github.com/EmulatorJS/EmulatorJS — **GPL-3.0** ⚠️ Copyleft. Powers the "Game Console" app. Shipped **isolated** (the Stockfish model): the engine + libretro cores live under `public/emulatorjs/` and load at runtime in a sandboxed iframe — never bundled into our MIT app code. The GPL text ships at `/emulatorjs/LICENSE` and the full project is public, satisfying source-availability. Vendored cores: **gambatte** (Game Boy) and **fceumm** (NES) — both libretro cores, **GPL-2.0-or-later**. Everything is vendored, so it runs fully offline (its one external version-check is redirected to the local copy). Drop-your-own-ROM loader retained; an in-world "Get more games →" links out to itch.io's homebrew tag. **No commercial ROMs, ever.**
  - Preloaded carts — all VERIFIED redistributable open-source homebrew (title — author — license — source):
    - **Libbet and the Magic Floor** — Damian Yerrick (pinobatch) — **Zlib** — https://github.com/pinobatch/libbet (release `libbet.gb`)
    - **µCity** — Antonio Niño Díaz (AntonioND) — **GPL-3.0** — https://github.com/AntonioND/ucity (release `ucity.gbc`)
    - **Nova the Squirrel** — NovaSquirrel — **GPL-3.0** — https://github.com/NovaSquirrel/NovaTheSquirrel (release `nova.nes`)

### Tier A (daedalOS reconciliation)
- **daedalOS `.whtml` blog mechanism (adapted)** — https://github.com/DustinBrett/daedalOS — **MIT** (Copyright (c) 2025 Dustin Brett). The **Blog** app + the `.whtml` writable-HTML file kind are **modeled on Dustin Brett's `.whtml` handling** (the file kind, the sandboxed HTML viewer, the "Open with → Monaco" raw-edit path, and the thumbnail-from-hero-image behavior), reimplemented on our React + Zustand + CSS-Modules stack. **Hard content line (docs/11 §1):** *none of Dustin's personal post prose is shipped* — every seeded post in `My Documents/Blog Posts/` is original placeholder content authored for this project, with self-contained inline-SVG hero art (no lifted assets). The owner replaces the prose later via the in-OS Monaco editor.
- **daedalOS Browser (ported code)** — https://github.com/DustinBrett/daedalOS — **MIT** (Copyright (c) 2025 Dustin Brett). The Internet Explorer app is **adapted from Dustin Brett's `components/apps/Browser`** (his `index.tsx`, `config.ts`, `useProxyMenu.ts`, `NavigationIcons.tsx`): the real browsing model — sandboxed CORS iframe loading, the proxy model (Wayback Machine + The Old Net by year), back/forward/reload/stop history, bookmark bar with real favicons, address-bar search, `ipfs://` via a gateway, and `chrome://dino`. Reimplemented on our React + Zustand + CSS-Modules stack (his code is Next.js/styled-components). **Changes from upstream:** his `allOrigins` open-proxy mode is dropped (owner ruling E — read-only / no open proxy); the chrome://dino runner is our original sprite (no Google art); and our Underground Noise Webring + in-world pages are folded in as bookmarks/start page. This is a code adaptation under MIT, beyond the behavioral-reference credit below.
- **Podcast app — native RSS parse (no third-party parser shipped).** The **Podcast** app (`src/apps/Podcast/`) parses feed XML with the browser-native **`DOMParser`** (zero dependencies). We initially wired `@podverse/podcast-feed-parser` (ISC) per docs/11 §3.1, but it pulls `xml2js` → `sax`, which reference Node's `stream`/`events`/`timers`; Vite externalizes those to stubs that throw at module-eval and crashed the app. The native path is the daedalOS-style choice and is fully browser-safe, so no parser dependency is redistributed. Podcast **feed content and audio belong to the respective creators** — the app only subscribes to public RSS and streams enclosure URLs, hosting nothing.
- **anyspace (superswan/anyspace)** — https://github.com/superswan/anyspace — **GPL-3.0** — **STUDY REFERENCE ONLY, NO CODE PORTED.** The local **MySpace** app (`src/apps/MySpace/`) was modeled on the *data model and 2005-era layout* an open MySpace clone implies (profiles + background/song/custom-CSS, Top 8, comments, bulletins, blogs). Because anyspace is GPL-3.0, **none of its code (PHP or otherwise) is copied or adapted** — our implementation is original TypeScript/React written from the general MySpace concept, so it is **not a derivative work** and the OS stays MIT (docs/12 §3 explicitly required "reimplement client-side, do not port its PHP"). Credited as the named parity reference.
- **ZapTrax (derekross/zaptrax)** — https://github.com/derekross/zaptrax — **MIT**. Reference for foobar2000's **Wavlake** library source (`src/apps/foobar/wavlake.ts`): the Wavlake catalog-browse + streaming model. Reimplemented as one of our `LibrarySource` implementations against **Wavlake's public HTTP API** (`https://wavlake.com/api/v1`, no key/wallet); no zaptrax code is copied. **Not adopted this pass:** its zaps / charts / tips (NIP-57, Lightning) — deferred (docs/11 §3). Wavlake track/stream data belongs to the respective artists; we stream via the public API and self-host nothing.
- **@mlc-ai/web-llm** — https://github.com/mlc-ai/web-llm — **Apache-2.0**. The in-browser LLM runtime (WebGPU) behind the **Tier-B bot voice** (`src/os/webllm.ts`, `src/os/botvoice.ts`) and the **AI Chat Agent** (`src/apps/AIChat/`). Runs a small instruct model **entirely on the visitor's GPU — $0 to us, no server, no API key** (docs/12 §1.1, which reverses the earlier anti-LLM ruling on cost grounds). Lazy-loaded and WebGPU-gated; the one-time model download is behind an explicit opt-in, and everything degrades to the original ELIZA engine when WebGPU is absent. Model weights (e.g. Llama-3.2-1B) are fetched from MLC's public CDN under their own licenses; we redistribute none.
- **diffusers.js (@aislamov/diffusers.js)** — https://github.com/dakenf/diffusers.js — **MIT**. In-browser Stable Diffusion (onnxruntime-web + WebGPU) behind **WebSD** (`src/os/websd.ts`) — the AI Chat Agent's image action + the AI-Generated-Wallpaper option. Runs **on the visitor's GPU, $0, no server** (docs/12 §1.1). **Not bundled:** it is loaded from a CDN at opt-in time via a runtime dynamic import, WebGPU-gated, and degrades silently where unsupported. Stable-Diffusion model weights are fetched from Hugging Face under their own license (CreativeML OpenRAIL-M); we redistribute none.
### Tier D (daedalOS reconciliation — realtime, public infrastructure)
- **ELIZA** — the **ELIZA** app is an **original implementation** of Weizenbaum's 1966 keyword/reflection method (the method is unencumbered; no upstream code, no LLM). Runs entirely in the browser — nothing is sent anywhere. **Reframed 2026-07** (docs/12 §1): originally the non-AI *substitute* for the AI Chat Agent; now the always-works **Tier-A floor** beneath the newly-adopted in-browser LLM layer (WebLLM / Chrome Prompt API / WebSD — all in-browser/$0), the baseline every bot degrades to. Those AI upstreams will be credited here as each is adopted in its build section.
- **KiwiIRC** — https://github.com/kiwiirc/kiwiirc — **Apache-2.0**. The **mIRC** app embeds KiwiIRC's hosted client, which bridges to a real IRC network (Libera.Chat) over its **public WebSocket gateway** — no backend of ours, no Cloudflare. External dependency (not offline); an "Open in new tab" fallback is provided if embedding is blocked. "mIRC" name used nominatively; the client is KiwiIRC, and we don't imply affiliation.
- **nostr-tools** — https://github.com/nbd-wtf/nostr-tools — **MIT**. Powers the real **AOL Instant Messenger** app: automatic keypair creation + **NIP-04** encrypted direct messages over **public Nostr relays** (relay.damus.io, nos.lol, relay.nostr.band, nostr.wine) — no backend of ours, no Cloudflare. Keys are generated and stored **only in the browser** (localStorage); your npub is your screen name. AOL/AIM names used nominatively (period dressing); the transport is Nostr.

### Tier C (daedalOS reconciliation — games)
- **Quake III + OpenArena** — engine: **ioquake3**-based wasm build (GPL-2.0); data: **OpenArena** (https://openarena.ws — free/open content, GPL-2.0 + free assets). Powers the **Quake III** app. The engine + **OpenArena FREE `.pk3` data only** (never retail Quake paks) are self-hosted on Cloudflare R2 (too big to commit) and fetched at first launch with `Cache-Control: public, max-age=31536000, immutable`, then browser-cached. Uploaded via `scripts/ingest-r2-assets.mjs` by the owner (R2 creds required). "Quake III" (id/ZeniMax/MS) used nominatively.
- **BoxedWine + Wine** — https://github.com/danoon2/Boxedwine — **GPL-2.0**; bundled **Wine** environment — https://www.winehq.org — **LGPL-2.1** (free software). Powers the **BoxedWine** app as a **ready shell** to run your own 16/32-bit Windows apps. The wasm engine + the LGPL Wine environment are self-hosted on R2 (fetched on first launch, immutable cache). **No proprietary Windows software is hosted** — only the free Wine environment; users supply their own apps. Isolated as a separately-licensed module.
- **ZZT** — Epic MegaGames (1991), **freely distributable at no charge** (Epic's shareware license — `public/zzt/LICENSE.txt`; not public-domain, no retail distribution, complete package only). The real ZZT runs in our vendored DOSBox (js-dos) via a `.jsdos` bundle that auto-boots `ZZT.EXE`. The **complete package** (worlds + docs + order forms + license) is vendored to `public/zzt/zzt.jsdos`; nothing is charged for; non-retail. Sourced from the Internet Archive (`archive.org/details/msdos_ZZT_1991`). "ZZT" used nominatively; © Epic MegaGames.
- **A Dark Room** — https://github.com/doublespeakgames/adarkroom — **MPL-2.0** (`public/adarkroom/LICENSE.md`). The real open-source game, vendored **offline** to `public/adarkroom/` and loaded in an iframe. All content is free/open. Trimmed to the English build (dropped the ~4MB of other-language packs — English is the built-in default) and the dev tooling; game code unmodified. Original game, credited.

---

- **Webamp** — https://github.com/captbaritone/webamp — **MIT** (code). The real Winamp 2 in the browser, behind the **Winamp** app — our BONUS player (custom foobar2000 stays the music pillar). Ships with Webamp's bundled classic base skin + full transport/playlist/EQ; drag audio onto it to play, hotkeys on; rendered into our window container. ⚠️ **The Winamp/Nullsoft names and the classic skin are Nullsoft/Llama-Group property, NOT MIT** — used nominatively, no implied affiliation. *Deferred (named):* Winamp Skin Museum random-skin loading + butterchurn Milkdrop — extra integration (cross-origin skin fetch / milkdrop window) not verified here; revisit.
- **TinyMCE** — https://github.com/tinymce/tinymce — **GPL-2.0-or-later** ⚠️ (shipped under GPL via `license_key: 'gpl'`, not the commercial license — per owner ruling). The RTF/WYSIWYG editor behind the **WordPad** app. **Self-hosted**: the core + silver theme + dom model + default icons + lists/link/table/code/searchreplace plugins + oxide skin + content CSS are all bundled into WordPad's lazy chunk (no TinyMCE Cloud, no API key, no network). Isolated as a separately-licensed module loaded at runtime; our OS code stays MIT. Saves edited HTML back to the VFS. "WordPad" used nominatively; TinyMCE/Tiny names not used as branding.
- **js-dos** — https://github.com/caiiyycuk/js-dos — **GPL-2.0** ⚠️ (wraps DOSBox, GPL-2.0; `public/jsdos/LICENSE`). The DOS emulator behind the **MS-DOS Prompt** app. Vendored offline to `public/jsdos/` and **isolated** in a sandboxed iframe (own dir + LICENSE, the copyleft-isolation model — never bundled into our MIT app code). Forced to the classic **DOSBox** backend (`backend: "dosbox"`, the 1.4M `wdosbox.wasm`); the 15M DOSBox-X variants + debug symbols/sourcemaps were dropped, and cloud/online features are off. **No DOS content is bundled** — the user loads their own `.jsdos`/`.zip` (shareware/freeware/owned); js-dos auto-persists the drive to IndexedDB. "MS-DOS" used nominatively.
- **jsPaint** — https://github.com/1j01/jspaint — **MIT** (Copyright (c) 2022 Isaiah Odhner; `public/jspaint/LICENSE.txt`). The real MS-Paint-style editor behind the **Paint** app, vendored offline to `public/jspaint/` (the same offline build daedalOS ships) and loaded in an iframe. Trimmed for size — removed the (already-disabled) `tracky-mouse` webcam-control lib, the standalone `pdf.js/web` viewer, and the `help/` docs; repointed `<base href>` to `./` for our path. App code otherwise unmodified. "Paint" is nominative; the engine is jsPaint, and its name terms are respected (not branded a jsPaint fork). Sits alongside miniPaint (the "Photoshop" app).
- **miniPaint** — https://github.com/viliusle/miniPaint — **MIT** (`public/minipaint/LICENSE.txt`). The real image editor behind the "Adobe Photoshop" app (layers, filters, selection/clone/brush, local open & save). The prebuilt `dist/bundle.js` is vendored **unmodified** to `public/minipaint/` and loaded in an iframe; we trimmed only marketing assets (preview.gif/jpg, PWA manifest icons) and the social/Open-Graph meta + external github.io URLs from `index.html` for an offline, no-callout copy. Optional online features (image search, web-font picker, third-party tool links) are on-demand and simply inert offline. "Adobe Photoshop" is nominative period dressing — the engine is miniPaint, and the diorama is the fallback when the vendor copy is absent. miniPaint name used nominatively.
- **@xterm/xterm** + **@xterm/addon-fit** — https://github.com/xtermjs/xterm.js — **MIT**. The terminal engine (the same one daedalOS uses) powering the Command Prompt app — real line editing, history, autocomplete, and pipes. The shell, commands, and VFS integration over it are our original code. xterm.js name used nominatively.
- **External read-only services (no code vendored):** the terminal's `weather` command queries **wttr.in** (https://github.com/chubin/wttr.in); the Browser loads the **Wayback Machine** (web.archive.org), **The Old Net** (theoldnet.com), and the **dweb.link** IPFS gateway in sandboxed read-only iframes. Single allowlisted hosts each — no open proxy.

### Tier B (daedalOS reconciliation)
- **Prettier** — https://github.com/prettier/prettier — **MIT**. Code formatter in the Code app (Shift+Alt+F / Format button). `prettier/standalone` + the babel/estree/typescript/postcss/html/markdown plugins are lazy-imported on first format. No network.
- **eruda** — https://github.com/liriliri/eruda — **MIT**. In-page DevTools (Console/Elements/Network/Resources), toggled with SHIFT+F12. Lazy-loaded (own chunk) on first use; its floating entry button is hidden so the keystroke is the only door.
- **opentype.js** — https://github.com/opentypejs/opentype.js — **MIT**. Parses fonts for the OpenType Font Viewer app (metadata, live sample, glyph grid). No font is bundled — the user opens their own `.otf`/`.ttf`/`.woff`. opentype.js name used nominatively.
- **video.js** — https://github.com/videojs/video.js — **Apache-2.0** — and **videojs-youtube** — https://github.com/videojs/videojs-youtube — **MIT**. The Video Player app: plays a local file you open or a direct/YouTube URL, with keyboard shortcuts. Native browser codecs cover mp4/webm/ogg + HLS; codecbox.js (GPL extra-codec path) is deferred to the wasm batch. "Video.js" (Brightcove) and "YouTube" used nominatively; the YouTube tech binds YouTube's ToS at play time. No video content bundled.
- **Photos formats** — the Picture Viewer decodes extra image formats you open (drag-drop/picker), each lazy-loaded:
  - **UTIF.js** — https://github.com/photopea/UTIF.js — **MIT**. TIFF (.tif/.tiff).
  - **@jsquash/jxl** — https://github.com/jamsinclair/jSquash — **Apache-2.0**. JPEG XL (.jxl) via its bundled wasm.
  - **libheif-js** — https://github.com/catdad-experiments/libheif-js (engine: libheif, http://www.libde265.org) — **LGPL-3.0** ⚠️. HEIF/HEIC (.heic/.heif). Used unmodified, lazy-loaded as a separate chunk (replaceable per LGPL); decode also touches HEVC, which carries its own patent licensing — included behind this notice per the owner ruling, alongside the patent-free formats.
  - **QOI** (.qoi) — decoded by an **original** implementation of the public QOI spec (qoiformat.org); no upstream code.
