# 08 · APP ROADMAP (adoption catalog + license ledger)

## BUILD STATUS (live)
- **Tier 1 — DONE** (deployed): Calculator, Character Map, Sound Recorder, Hex Editor, Solitaire, FreeCell, Spider, Brick Breaker, Crypt Runner, Markdown viewer, PDF viewer (pdf.js), panzoom Image Viewer, CRT/VHS overlay, oneko, screen savers, BSOD + fake Windows Update.
- **Tier 2 — mostly DONE** (deployed): Sigil generator, ANSI/`.nfo` viewer, Warez keygen (original Web-Audio chiptune), Chess + isolated Stockfish, BassoonTracker iframe seam.
  - **Deferred (owner call):** **Webamp** — original `.wsz` skin built + valid (browser-decodable BMPs, std zip, correct `initialSkin` API) but webamp renders its built-in fallback in our React/Vite host regardless of skin; it's a webamp integration issue (skin not honored / sprites not painting), not the skin. Revisit later. **chiptune3** real `.mod` player (AudioWorklet/wasm bundling) and **butterchurn** (rides with Webamp) deferred too — the keygen already covers chiptune.
- **Tier 3 — IN PROGRESS.** Per owner rulings: BUILD/ADOPT = DOOM+Freedoom, EmulatorJS (isolated, no ROMs), js-dos, v86, OpenTyrian, Ruffle, TIC-80, Monaco; replace the proxied browser with a curated webring + read-only archive.org "Old Net" mode. SKIP = Quake3, Vim.js, TinyMCE, codecbox, BoxedWine, proxied browser, Space Cadet Pinball (not turnkey — needs MS data). ClassiCube still a content DECISION (pulls Minecraft assets at runtime).

The full app roster we're adopting, organized by the four build tiers. Every
third-party component is verified against its **own upstream repo** (not
daedalOS's glue) and carries its license + any name/content terms. Build in
tier order; **stop for owner review after each tier**; deploy when creds exist
(currently deferred). Keep `CREDITS.md` current as each app actually lands.

Status legend (this doc is the plan; nothing here is built yet):
- **ADOPT** — permissive, clean, no decision needed.
- **ADOPT*** — adopt **with conditions** (attribution/notice, re-skin, supply free content).
- **BUILD** — build original (mechanics/idea not copyrightable, or upstream unusable); no third-party license.
- **DECISION** — owner must rule before adoption (copyleft / trademark / content-legality).
- **DEFER** — needs Phase-6 realtime infra; architect now so it isn't boxed out, build later.

## GLOBAL ADOPTION RULES (apply to every entry)
1. Install from the app's **own upstream** package/repo — never copy daedalOS's integration code.
2. Record the app's license in `CREDITS.md` at adoption (name, upstream URL, SPDX, branding/name terms).
3. **Engines, not content.** No copyrighted ROMs/WADs/disk-images/skins/character-art. Use Freedoom, public-domain/homebrew/shareware/free-content only; emulators load user-provided or free content.
4. Every GPL / AGPL / LGPL / non-commercial / name-restriction / content-legality issue is a **DECISION for the owner** (see end), not a guess.
5. No meta-narrative (Rule 2). Dark XP skin on every adopted app (re-skin where upstream ships its own chrome). Keep the core open to the Phase-6 realtime spine.

## ARCHITECTURE-FIT NOTES
- **System libraries** (FS/window/zip/metadata) underpin many apps; listed once below, pulled per-app.
- **Copyleft isolation:** any GPL/AGPL/LGPL engine we keep is integrated as a **self-contained, separately-licensed module** (its own dir, its own LICENSE, an offer-of-source), loaded at runtime — so our OS code stays MIT. AGPL (network copyleft) is the one to avoid embedding.
- **Phase-6 realtime:** IRC / BBS / ELIZA-buddy / (optionally NetHack & MIDI jukebox) ride the deferred Durable-Objects spine. Don't architect anything that boxes out a shared realtime layer.
- **Our differentiators stay primary:** skin, strata, music catalog (foobar = pillar), theme engine. Adopted apps are texture/parity, not the thesis. foobar stays the music pillar; Webamp is a *bonus*.

---

## SYSTEM LIBRARIES (infrastructure — pulled per-app, not user-facing)

| Lib | Upstream | License | Notes | Verdict |
|---|---|---|---|---|
| BrowserFS | github.com/jvilk/BrowserFS | MIT *(well-established; confirm at adoption)* | Optional: real binary-file backend if we ever want it (currently our flat FS suffices) | ADOPT (optional) |
| react-rnd | github.com/bokuweb/react-rnd | MIT *(confirm)* | We already have our own WM; only if we want its resize/drag. Likely **skip** (own code) | BUILD (own WM exists) |
| Framer Motion | github.com/framer/motion | MIT *(confirm)* | Window open/close/min transitions (respect reduced-motion) | ADOPT |
| fflate | github.com/101arrowz/fflate | MIT *(confirm)* | Zip read/write (export, .wsz skins, save bundles) | ADOPT |
| 7z-wasm | github.com/use-strict/7z-wasm | **LGPL-2.1** + 7-Zip **unRAR restriction** *(confirm)* | LGPL flow-through; the unRAR licence forbids using it to reverse-engineer RAR. Only if we need 7z/RAR archives | DECISION (LGPL) |
| music-metadata-browser | github.com/Borewit/music-metadata-browser | MIT *(confirm)* | ID3/Vorbis tags — already conceptually used by the ingest pipeline | ADOPT |
| html-to-image | github.com/bubkoo/html-to-image | **MIT** ✓ | DOM→PNG (screenshot/share). No runtime deps | ADOPT |

---

## TIER 1 — cheap XP authenticity (low risk; mostly BUILD or clean MIT)

| App | Source | License | Terms | Verdict |
|---|---|---|---|---|
| Solitaire / FreeCell / Spider | **build original** | — | Card-game mechanics aren't copyrightable; use original card-face SVGs (no MS deck) | BUILD |
| Calculator | **build original** | — | Trivial XP applet | BUILD |
| Character Map | **build original** | — | Reads from system/web fonts | BUILD |
| Sound Recorder | **build original** | — | MediaRecorder API; the XP "green line" UI | BUILD |
| oneko / desktop pet | github.com/adryd325/oneko.js | **MIT** ✓ (sprite **public-domain** by declaration, K. Gotoh 1989) | Clean. **Preferred over web-esheep** (which is GPL-3 + Fuji-TV-owned art) | ADOPT |
| Extra screensavers (Pipes/Starfield/Mystify/Matrix) | 1j01/pipes **MIT** ✓; jcubic/cmatrix **MIT** ✓; Vanta **MIT** ✓ (use three.js effects, avoid p5.js LGPL); Hexells **Apache-2.0** ✓ | mixed permissive | "3D Pipes/Maze/FlowerBox" are MS screensaver *names* — nominative use only. **Do NOT use** kevin-shannon/3D-FlowerBox or ibid-11962/3D-Maze (unlicensed + MS bitmap assets) — build those originals | ADOPT* / BUILD |
| BSOD + fake Windows Update easter eggs | **build original** | — | Depth-riot flavor; original copy, no MS art | BUILD |
| Marked (markdown viewer) | github.com/markedjs/marked | **MIT** ✓ | Pair with DOMPurify (security) | ADOPT |
| pdf.js (résumé / PDF viewer) | github.com/mozilla/pdf.js | **Apache-2.0** ✓ | NOTICE/attribution. Enables a real `resume.pdf` | ADOPT |
| Photos viewer (HEIC/JXL/TIFF + pan-zoom) | UTIF.js **MIT** ✓ · panzoom **MIT** ✓ · JXL **@jsquash Apache-2.0** ✓ · libheif-js **LGPL-3.0** ✓ | mostly permissive; **libheif = LGPL-3 + HEVC patent** | Core viewer is clean (UTIF/panzoom/JXL). HEIC via libheif is **DECISION** (LGPL + HEVC patents) — optional add-on | ADOPT* (+DECISION for HEIC) |
| Hex editor | **build original** (or adopt a small MIT one) | — | Simple canvas/table over bytes | BUILD |
| t-rex-runner (dino game) | github.com/wayou/t-rex-runner | **BSD-3-Clause** ✓ | **Replace Google's dino sprite with original art**; keep BSD code | ADOPT* |
| DX-Ball / Breakout | **build original** | — | shuddha2021 repo has no LICENSE file; "DX-Ball"/"Arkanoid" are trademarks → build original "Breakout" w/ original art | BUILD |

**Tier-1 takeaway:** almost entirely BUILD-original or clean MIT/Apache. The only copyleft is *optional* (HEIC via libheif). Tier 1 can proceed with zero forced copyleft entanglement.

---

## TIER 2 — identity apps (the scene-kid layer)

| App | Source | License | Terms | Verdict |
|---|---|---|---|---|
| BassoonTracker (real tracker → the "FL Studio" app) | github.com/steffest/BassoonTracker | **MIT** ✓ | Drop/replace bundled ST-01/02 Amiga sample disks (ambiguous license) with free/original samples | ADOPT* |
| chiptune player (+ keygen/.nfo tie) | github.com/DrSnuggles/chiptune | **MIT** (wrapper) ✓; **libopenmpt = BSD-3-Clause** ✓ (minimp3 CC0 / stb_vorbis PD) | Attribution only. Wire to the keygen prop = real chiptune on "crack" | ADOPT |
| Sigil generator | **build original** (Spare/Carroll method) | — | Koda-Pig/sigil-generator-v2 has **no license = reference only, do not copy**. Build original w/ opentype.js (**MIT** ✓) | BUILD |
| ANSI / .nfo (CP437 + SAUCE) viewer | github.com/ansilove/ansilove.js | **BSD-2-Clause** ✓ (fonts under same license) | Clean | ADOPT |
| CRT / VHS post-process shader | **build original** | — | Display-Properties toggle, respect reduced-motion. Our WebGL/CSS — no upstream | BUILD |
| Webamp (BONUS Winamp; foobar stays pillar) | github.com/captbaritone/webamp | **MIT** (code) ✓ | **Winamp name + classic base skin + sample audio are Nullsoft/Llama-Group property, NOT MIT.** Ship with an **original skin**, don't imply affiliation | ADOPT* / DECISION |
| butterchurn (Webamp/foobar visualizer) | github.com/jberg/butterchurn | **MIT** ✓ (presets MIT-packaged; per-preset provenance informal) | MilkDrop-style viz; pairs with Webamp or foobar | ADOPT |
| Chess (board + engine) | chess.js **BSD-2** ✓ + stockfish.js **GPL-3.0** ✓ | board clean; **engine GPL-3** | board/logic clean. **Stockfish is GPL-3** → DECISION (isolate as separate module + source offer, or use a permissive engine, or board-only) | ADOPT* + DECISION |

---

## TIER 3 — heavy / emulation / legal-flagged (most DECISIONs live here)

| App | Source | License | Content/Name | Verdict |
|---|---|---|---|---|
| DOOM + Freedoom | cloudflare/doom-wasm or GMH-Code/Dwasm | **GPL-2.0** | **Ship Freedoom (BSD-3) IWAD only** — never doom.wad/shareware. Don't brand "DOOM" | DECISION (GPL) |
| EmulatorJS | github.com/EmulatorJS/EmulatorJS | **GPL-3.0** loader + **mixed cores** (many GPL-2; Snes9x lineage **non-commercial**) | No ROMs/BIOS bundled; user supplies free/homebrew. Per-core license review | DECISION (GPL + per-core) |
| js-dos | github.com/caiiyycuk/js-dos | **GPL-2.0** (wraps DOSBox GPL-2) | Ships no DOS games; user/free content | DECISION (GPL) |
| v86 | github.com/copy/v86 | **BSD-2-Clause** ✓ | Free OS images (Linux/FreeDOS/ReactOS); no Windows media | ADOPT* |
| BoxedWine | github.com/danoon2/Boxedwine | **GPL-2.0** (+ Wine LGPL-2.1) | User-supplied Windows apps; no MS assets | DECISION (GPL) |
| Ruffle (Flash) | github.com/ruffle-rs/ruffle | **Apache-2.0 OR MIT** ✓ | "Flash/Adobe" descriptive only | ADOPT |
| Quake III | github.com/lrusso/Quake3 | **GPL-2.0+** | **Needs retail pak0–8 (copyrighted)**; no bundled free data (OpenArena = the free substitute) | DECISION (GPL + content) |
| ClassiCube | github.com/UnknownShadow200/ClassiCube | **BSD-3-Clause** ✓ | Pulls Minecraft-Classic assets at runtime; Mojang/MS **trademark** — don't call it Minecraft | DECISION (content/TM) |
| Space Cadet Pinball | github.com/alula/SpaceCadetPinball | **MIT** (code) ✓ | **MS game assets NOT redistributable** — user must supply; can't bundle. "3D Pinball" is MS's | DECISION (content) |
| TIC-80 | github.com/nesbox/TIC-80 | **MIT** ✓ (source stayed MIT; only the PRO binary is paid) | Community carts only | ADOPT |
| OpenTyrian | github.com/opentyrian/opentyrian | **GPL-2.0** | Tyrian 2.1 data is **officially freeware** — safe to ship | DECISION (GPL; content OK) |
| Monaco editor | github.com/microsoft/monaco-editor | **MIT** ✓ | A "real" code/text editor | ADOPT |
| Vim.js | github.com/coolwanglu/vim.js | **GPL-2.0** (composite; archived 2018) | Copyleft + dead dependency | DECISION (GPL; recommend skip) |
| TinyMCE | github.com/tinymce/tinymce | **GPL-2.0-or-later** (relicensed 2022) or commercial | Trademarked; GPL or pay | DECISION (GPL; recommend skip → Monaco/own) |
| Real proxied Browser | (own + a proxy) | — | **Abuse/security surface** — must sandbox + rate-limit + same-origin proxy allowlist | DECISION (security) |
| FFmpeg.wasm | github.com/ffmpegwasm/ffmpeg.wasm | wrapper **MIT**; core **LGPL-2.1** (GPL if GPL codecs) | media transcode utility | DECISION (LGPL/GPL by build) |
| codecbox.js | github.com/duanyao/codecbox.js | effective **GPL** (links x264) | video decode | DECISION (GPL) |
| WASM-ImageMagick | github.com/KnicKnic/WASM-ImageMagick | wrapper **Apache-2.0**; engine **ImageMagick License** ✓ | permissive; include ImageMagick NOTICE | ADOPT* |
| Pyodide | github.com/pyodide/pyodide | **MPL-2.0** (+ CPython PSF + per-pkg) | Python in the terminal; per-package audit if shipping libs | ADOPT* |
| video.js (+ youtube) | github.com/videojs/video.js | **Apache-2.0** ✓; videojs-youtube **MIT** ✓ | "Video.js" Brightcove **trademark**; YT plugin binds **YouTube ToS** | ADOPT* |
| eruda (devtools) | github.com/liriliri/eruda | **MIT** ✓ | in-page console easter egg | ADOPT |
| isomorphic-git | github.com/isomorphic-git/isomorphic-git | **MIT** ✓ | git in the terminal | ADOPT |
| xterm.js | github.com/xtermjs/xterm.js (`@xterm/xterm`) | **MIT** ✓ | richer terminal backend (we have a CLI already) | ADOPT |

---

## TIER 4 — needs infra (Phase-6 realtime) — architect now, build later

| App | Source | License | Terms | Verdict |
|---|---|---|---|---|
| KiwiIRC / real IRC | github.com/kiwiirc/kiwiirc | **Apache-2.0** ✓ | Re-skin; don't imply affiliation. Rides Phase-6 spine | DEFER |
| BBS telnet dialer (HyperTerminal) | github.com/rickparrish/fTelnet | **AGPL-3.0** ⚠️ | **Network copyleft** — public deploy must offer source to users. Recommend an alt client or original ws-telnet bridge | DECISION (AGPL) + DEFER |
| ELIZA-as-AIM-buddy | **build original** (algorithm unencumbered) | — | `elizabot` npm port has **no license** — reimplement the 1966 ELIZA script approach. No LLM | BUILD + DEFER |
| MIDI soft-synth (old-web BGM) | spessasynth **Apache-2.0** ✓ / js-synthesizer **BSD-3 core + LGPL FluidSynth** / timidity **MIT + FreePats GPL** | mixed | **Soundfont = content decision:** use GeneralUser GS / FluidR3 / MuseScore_General (**all free**); avoid SC-55/Creative dumps & FreePats (GPL). spessasynth+GeneralUser GS = cleanest | ADOPT* (+content) / DEFER |
| NetHack (Terminal roguelike) | github.com/apowers313/NetHackJS | **NGPL** (NetHack GPL) | Copyleft: source-availability + no relicense for the NetHack portion | DECISION (NGPL) + DEFER |

---

## BUILD-ORIGINAL (no third-party license at all)
Solitaire/FreeCell/Spider · Calculator · Character Map · Sound Recorder · BSOD + fake Windows Update · CRT/VHS shader · Sigil generator · ELIZA · DX-Ball/Breakout · Defrag/ScanDisk visualizer · the two unlicensed screensavers (FlowerBox/Maze) if wanted · t-rex sprite art · original Webamp skin. These carry **no** copyleft/trademark/content risk — they're ours.

---

# DECISIONS NEEDED (owner sign-off)

Grouped by risk. My recommendation is in **bold**; you rule.

### A. Copyleft — does the OS bundle stay permissive, and which engines are worth the compliance?
Posture I recommend across the board: **keep any accepted copyleft engine as a self-contained, separately-licensed module (own dir + LICENSE + offer-of-source), loaded at runtime, so our OS code stays MIT.** Then per item:
- **AGPL-3.0 — fTelnet (BBS dialer):** network copyleft; a public deploy must offer source to all users. **Recommend: do NOT embed — build an original ws↔telnet bridge, or skip the BBS dialer.**
- **GPL-3.0 — EmulatorJS, stockfish.js, web-esheep:** **EmulatorJS** = keep, isolated, if you want retro emulation (strongest pull) — but accept GPL-3 + per-core review; **stockfish.js** = isolate as a module, or ship board-only chess (**recommend board + isolated engine**); **web-esheep** = **drop** (GPL-3 *and* infringing art) → use **oneko** instead.
- **GPL-2.0 — DOOM, js-dos, BoxedWine, Quake3, OpenTyrian, Vim.js, codecbox.js, TinyMCE:** **DOOM+Freedoom = recommend YES** (iconic, free content path, isolated). **js-dos / v86(BSD) / BoxedWine = pick how deep you want "run real old software"** — recommend **v86 (BSD, clean) + js-dos** , defer BoxedWine. **OpenTyrian = YES** (free data). **Quake3 = recommend SKIP** (needs copyrighted retail data). **Vim.js / TinyMCE = SKIP** (archived / relicensed) → use **Monaco (MIT)**. **codecbox.js = skip** unless video decode is essential.
- **LGPL — FFmpeg.wasm, libheif-js, js-synthesizer/FluidSynth, 7z-wasm:** weak copyleft, OK if you preserve notices + keep the wasm replaceable. **Recommend: adopt only when actually needed** (HEIC, transcode, archives) and document the LGPL notice.
- **NGPL — NetHack:** isolate + source offer if adopted. **Recommend: defer to Tier 4**, adopt as an isolated module.
- **MPL-2.0 — Pyodide:** file-level copyleft, low burden. **Recommend: ADOPT** when wanted, per-package audit for bundled Python libs.

### B. Trademark / name — never brand the tile/window with these (nominative use only)
DOOM, Quake III (id/ZeniMax/MS) · ClassiCube↔Minecraft (Mojang/MS) · "3D Pinball / Space Cadet" (MS) · "3D Pipes/Maze/FlowerBox" screensaver names (MS) · **Video.js** (Brightcove ®) · Winamp/Nullsoft (Webamp) · KiwiIRC · DX-Ball/Arkanoid (Taito) · "SoundFont®" (Creative). **Recommend: descriptive/period labels, our own skin, no logos, no implied affiliation.** (No blocker — just naming discipline.)

### C. Content / asset legality — must NOT bundle; supply free substitute
- **clippy.js — ⚠️ CRITICAL.** MIT covers code only; bundled sprites/sounds are **unlicensed MS Agent IP**, and **Bonzi is separate third-party IP** (defunct, malware-associated). **Recommend: ship the code with an ORIGINAL assistant character; do NOT ship any MS Agent character or Bonzi art.** (Our existing fake-installer "BonziBUDDY" *text* gag is fine — that's a name in a joke list, not shipped character art.)
- **DOOM → Freedoom (BSD-3) only.** **Space Cadet Pinball / Quake3** → assets not redistributable → **user-supplies or skip** (recommend skip Quake3; Pinball only if you're OK with "bring your own data"). **ClassiCube** pulls Minecraft assets at runtime → confirm acceptable or skip.
- **t-rex sprite, 3D-Maze .bmp textures, web-esheep sheep** → replace with **original art**.
- **Webamp** → ship an **original skin**, not the Nullsoft classic base skin/sample audio (or accept the well-trodden gray area). **Recommend original skin.**
- **MIDI soundfonts** → **GeneralUser GS / FluidR3 / MuseScore_General (free)**; avoid SC-55/Creative/FreePats(GPL).
- **BassoonTracker** ST-01/02 sample disks → replace with free/original samples.

### D. No-license / all-rights-reserved → build original (cannot reuse upstream code)
3D-FlowerBox (kevin-shannon), 3D-Maze (ibid-11962), DX-Ball (shuddha2021), elizabot port, sigil-generator-v2. **Recommend: build originals** (already the plan for sigil/ELIZA/screensavers/Breakout).

### E. Security
- **Real proxied Browser (Tier 3):** abuse surface (SSRF/open-proxy/malware). **Recommend: only behind a same-origin proxy with a domain allowlist + rate limits, sandboxed iframe, no arbitrary fetch — or skip in favor of a static "weird-web" webring.**

---

## What I'd build first (if you approve Tier 1 as-is)
All BUILD-original or clean MIT/Apache, **zero forced copyleft**: Solitaire/FreeCell/Spider, Calculator, Character Map, Sound Recorder, **oneko**, original screensavers (+ MIT Pipes/cmatrix/Vanta/Hexells), BSOD/Update easter eggs, **Marked + pdf.js + Photos viewer**, hex editor, t-rex (original sprite), Breakout. HEIC-via-libheif (LGPL) held as an optional add-on pending your call in (A).
