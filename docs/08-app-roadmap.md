# 08 · APP ROADMAP — FULL daedalOS RECONCILIATION (adoption catalog + license ledger)

## GOVERNING RULE (overrides all earlier conservatism)
Adopt **EVERY** upstream Dustin Brett links in the daedalOS README, **from its own
source**, credited in `CREDITS.md`. Do **not** skip because we ship a
placeholder/diorama version — his is the real one, **REPLACE ours**. Do **not** skip
for vague "safety" — MIT diligence covers the engine code. Only **two** skip reasons,
and each must be **named per item**:

- **(a) data/asset-license blocker** → adopt the **ENGINE** + free / user-supplied
  data. Never drop the engine; ship a data loader instead.
- **(b) policy line** → the **AI Chat Agent** (Prompt API / WebLLM) and **Stable
  Diffusion / WebSD** are substituted/skipped (owner anti-LLM). Nothing else.

This supersedes the SKIP rulings recorded in earlier revisions of this doc (Quake3,
Vim.js, TinyMCE, codecbox, BoxedWine, js-dos, Space Cadet Pinball, proxied browser).
Those are now **ADOPT** (engine, with the data/policy notes below).

---

## STEP 1 — COVERAGE TABLE

Status legend: **have-real** = built & functional · **have-placeholder** = a
diorama/partial stands in · **missing** = not present.
Ruling legend: **KEEP** (already real) · **REPLACE** (swap placeholder for the real
upstream) · **EXTEND** (real but below the full feature set) · **ADOPT** (build the
gap from upstream) · **ADOPT+DATA** (engine now, free/user data) · **FLAG**
(owner decision before adopt) · **SUBSTITUTE/SKIP** (named policy).

### ADOPT — APPS

| Item (upstream) | Our status | Ruling | Reason / note |
|---|---|---|---|
| **BoxedWine** (danoon2/Boxedwine, GPL-2.0 + Wine LGPL-2.1) | missing | **ADOPT** | 16/32-bit Windows apps; user-supplied `.exe`/`.zip`, no MS assets. Isolated GPL module. |
| **Browser** (full: CORS load, bookmark bar+favicons, Wayback+The Old Net proxy, back/fwd/reload, address search, IPFS, chrome://dino t-rex-runner) | have-placeholder (IE mini-browser: webring + read-only archive.org) | **EXTEND** | Our IE has back/fwd/home + webring + archive.org read-only. Extend to the full proxy set (Wayback Machine + The Old Net = the approved read-only/no-open-proxy path), bookmark bar, IPFS, chrome://dino. **Merge our webring into it.** |
| **DevTools** (liriliri/eruda, MIT) | missing | **ADOPT** | Console/Elements/Network/etc.; bind **SHIFT+F12**. |
| **EmulatorJS** (EmulatorJS/EmulatorJS, GPL-3.0) | have-real | **KEEP** | Engine isolated; verified-clean homebrew carts + drop-your-own loader already shipped. |
| **IRC** (kiwiirc/kiwiirc, Apache-2.0) | have-placeholder (mIRC diorama) | **REPLACE** | KiwiIRC over WebSockets becomes our **real mIRC**. Rides Phase-6 realtime. |
| **js-dos** (caiiyycuk/js-dos, GPL-2.0) | have-placeholder (dep `js-dos@^8.4.0` installed, no app) | **ADOPT** | Reverses the earlier drop — Dustin ships **both** js-dos and v86; keep both. DOS emulator + **auto save-states**; content user-supplied/shareware. |
| **Marked** (markedjs/marked, MIT) | have-real | **KEEP** | Markdown viewer (with DOMPurify). |
| **Messenger** (Nostr + NIP-04, automatic keypair) | have-placeholder (AIM diorama) | **REPLACE** | **Real encrypted DM** — Nostr + NIP-04 + auto public/private keypair = our **AIM, for real**, on the Phase-6 realtime work. |
| **Monaco Editor** (microsoft/monaco-editor, MIT) | have-real | **EXTEND** | Full editor + CTRL+S already; add line/cursor/lang status + **Prettier** formatting. |
| **OpenType** font viewer (`.otf/.ttf/.woff`) | missing (opentype.js used by Sigil only) | **ADOPT** | Build a font viewer app on opentype.js (MIT). |
| **Paint** (jspaint, 1j01/jspaint) | missing | **ADOPT** | jsPaint, **respect its name terms**; ships **alongside** our miniPaint-as-Photoshop. |
| **PDF** (mozilla/pdf.js, Apache-2.0) | have-real | **KEEP** | Real `résumé.pdf` viewer (render/print/page/zoom). |
| **Photos** (libheif-js LGPL, jxl.js, QOI, UTIF.js, panzoom) | have-placeholder (ImageViewer = panzoom only) | **EXTEND** | Add HEIF (libheif-js, **LGPL → ship notice**), JPEG XL (jxl.js), QOI, TIFF (UTIF.js). panzoom already present. |
| **Ruffle** (ruffle-rs/ruffle, MIT/Apache-2.0) | have-real | **KEEP** | Flash engine shell + our original `.swf` / CC-cleared content. |
| **Terminal** (xterm.js full set) | have-placeholder (our own cmd.exe over VFS) | **REPLACE/EXTEND** | Adopt **xterm.js** (@xterm/xterm, MIT) + the full feature set: FS, autocomplete+history, pipes, help, **git** (isomorphic-git), **Python** (Pyodide), **WAPM** (e.g. `wapm cowsay`), weather (wttr.in), neofetch, **FFmpeg.wasm** + **WASM-ImageMagick** convert, **SHIFT+F10**. Keep our hidden-command leak surface. |
| **TinyMCE** (tinymce/tinymce, GPL-2.0-or-later) | missing | **ADOPT** | RTF/WYSIWYG editor w/ save. Isolated GPL module. |
| **Video Player** (video.js Apache-2.0 + codecbox.js + videojs-youtube MIT) | missing | **ADOPT** | video.js + codecbox.js formats + youtube plugin + keyboard shortcuts. |
| **Vim** (coolwanglu/vim.js, GPL-2.0) | missing | **ADOPT** | vim.js editor **alongside** Monaco; isolate + credit its license. |
| **Webamp** (captbaritone/webamp, MIT) | have-placeholder (deferred — skin not honored in our host) | **ADOPT** | Winamp + **Winamp Skin Museum** random skins + playlist/streaming + **butterchurn** Milkdrop, as the **BONUS** player (custom foobar2000 stays the pillar). Re-solve the skin-load integration issue. |
| **TIC-80** (nesbox/TIC-80, MIT) | have-real | **KEEP** | Original `moth` cart already shipped. |
| **v86** (copy/v86, BSD-2) | have-real | **KEEP+EXTEND** | Boots FreeDOS offline. Add **save-states + auto-resize** per his. |
| **Paint pillar: miniPaint-as-Photoshop** | have-placeholder (Photoshop = non-functional diorama) | **REPLACE** | Adopt **miniPaint** (viliusle/miniPaint, MIT) as the real Photoshop; jsPaint sits beside it. |

### ADOPT ENGINE + DATA-NOTE (named data blockers — engine adopted, data substituted)

| Item (upstream) | Our status | Ruling | Named blocker → resolution |
|---|---|---|---|
| **Quake III** (lrusso/Quake3, GPL-2.0+) | missing | **ADOPT+DATA** | Retail pak0–8 are copyrighted → ship **OpenArena** free data instead, or user-supplied. Engine adopted, isolated. |
| **Space Cadet Pinball** (alula/SpaceCadetPinball, MIT code) | missing | **ADOPT+DATA** | MS Pinball game data not redistributable → **user-supplied-data loader**. Engine is clean MIT. |
| **ClassiCube** (UnknownShadow200/ClassiCube, BSD-3) | missing | **SKIP** (owner ruled) | Pulls **Minecraft Classic** assets at runtime (Mojang/MS) → owner ruled **SKIP**. Not adopted. |
| **Cave Story** (NXEngine, GPL) — our addition | missing | **DEFER** (owner ruled) | Engine clean; Cave Story freeware data would be user-supplied/never-rehosted — owner ruled **defer til later** (revisit after the core tiers). |

### SUBSTITUTE / SKIP (named policy — owner anti-LLM)

| Item | Ruling | Named reason |
|---|---|---|
| **AI Chat Agent** (Prompt API / WebLLM) | **SUBSTITUTE** | Owner anti-LLM (policy line b) → a **non-AI search/run menu** (optional ELIZA, no LLM). |
| **Stable Diffusion / WebSD** (AI wallpapers) | **SKIP** | Owner anti-LLM (policy line b) → **keep all NON-AI wallpapers** (animated + slideshow + custom screensavers in `docs/02 §9`). |

### ADOPT — GAMES

| Item | Our status | Ruling | Note |
|---|---|---|---|
| **Chess** (chess.js BSD-2 + stockfish.js GPL-3) | have-real | **KEEP** | Board + isolated Stockfish already shipped. |
| **DX-Ball** (dx-ball.ru/code.html) | have-real (our original **Breakout**) | **KEEP (+ optional embed)** | Owner-supplied link is an **embed-widget generator** (iframe snippet to a third-party-hosted game), **not** vendorable source — no stated license, external host, not offline, and the game is Longbow/Michael P. Welch IP. Our original Breakout stays the **shipped** game; the dx-ball.ru embed can ride the "Old Net"/external-iframe seam as an optional in-world bonus, flagged as an external dependency. |
| **ZZT**, **A Dark Room** | missing | **ADOPT** | Verified-clean set, adopt now. |
| **DOOM / ROTT / Wolf3D / Duke3D / OpenTyrian** | missing (toolchain-blocked) | **ADOPT (CI-wasm batch)** | C→wasm; need an emscripten build step (GitHub Actions job builds + commits artifacts), then vendor + free data (Freedoom, Tyrian freeware, etc.). |

### KEEP (already built, no change required)
TIC-80, v86 (extend per above), Calculator, Character Map, Sound Recorder, Hex Editor,
Solitaire, FreeCell, Spider, Breakout, Minesweeper, Sigil generator, ANSI/`.nfo` viewer,
Keygen, Markdown viewer, PDF viewer, Image Viewer (panzoom), CRT/VHS overlay, oneko,
screensavers, BSOD + fake Windows Update, Display Properties, Run dialog, Explorer,
Notepad, foobar2000 (music pillar), Monaco, Browser/IE, Ruffle, EmulatorJS, Chess.

### OS subsystems (see `docs/02` for the full per-subsystem ledger)
File System (BrowserFS) · File Explorer (full nav/view/dnd) · Context-Menu matrix ·
Keyboard set · Windows (react-rnd/Framer-Motion) · Start Menu (sidebar/spotlight/power)
· Taskbar (peek/search) · Clock (worker/NTP/calendar) · Background+Screensaver
(animated/slideshow/custom) · Run dialog (`ipfs:`/`nostr:`) · URL query loading
(`/?url=`, `/?app=`). Status: **have-real floor, EXTEND to the full surface.**

---

## STEP-1 SUMMARY (what's actually missing to build)
- **REPLACE placeholders with real upstreams:** Messenger (Nostr/NIP-04 ← AIM), IRC
  (KiwiIRC ← mIRC), Paint pillar (miniPaint ← Photoshop diorama), Terminal (xterm.js
  ← our cmd.exe), Browser (full proxy/bookmarks/IPFS/dino ← IE mini-browser, merge
  webring).
- **ADOPT new apps:** BoxedWine, eruda DevTools, js-dos, OpenType viewer, jsPaint,
  TinyMCE, Video Player (video.js), Vim.js, Webamp (re-solve skin), and the
  ADOPT+DATA games (Quake3/OpenArena, Space Cadet Pinball). *(ClassiCube skipped;
  Cave Story deferred — both owner-ruled.)*
- **EXTEND real apps:** Monaco (+Prettier/status), Photos (HEIF/JXL/QOI/TIFF), v86
  (save-states/auto-resize), and the OS subsystems in `docs/02`.
- **GAMES batch:** ZZT, A Dark Room now; DOOM/ROTT/Wolf3D/Duke3D/OpenTyrian on the
  CI-wasm batch.
- **SUBSTITUTE/SKIP (named):** AI Chat Agent → non-AI run/search (optional ELIZA);
  Stable Diffusion → skip, keep non-AI wallpapers.

---

## GLOBAL ADOPTION RULES (apply to every entry)
1. Install from the app's **own upstream** package/repo — never copy daedalOS's glue.
2. Record the license in `CREDITS.md` at adoption (name, upstream URL, SPDX, branding/name terms).
3. **Engines, not content.** No copyrighted ROMs/WADs/disk-images/skins/character-art. Free / homebrew / shareware / user-supplied only.
4. **Copyleft isolation:** any GPL/AGPL/LGPL engine is a **self-contained, separately-licensed runtime module** (own dir + LICENSE + offer-of-source), loaded at runtime, so our OS code stays MIT. AGPL (network copyleft) is the one to avoid embedding — for the BBS dialer build an original ws↔telnet bridge rather than embed fTelnet.
5. No meta-narrative (Rule 2). Dark XP skin on every adopted app (re-skin where upstream ships its own chrome). Keep the core open to the Phase-6 realtime spine.
6. **Desktop pet:** keep **oneko** / an original sprite (NOT web-esheep — GPL-3 + Fuji-TV art).

---

## SYSTEM LIBRARIES (infrastructure — pulled per-app)

| Lib | Upstream | License | Use |
|---|---|---|---|
| BrowserFS | jvilk/BrowserFS | MIT | Binary FS backend + ZIP/ISO mounts |
| react-rnd | bokuweb/react-rnd | MIT | Window resize/drag (optional; our WM is at parity) |
| Framer Motion | framer/motion | MIT | Window open/close/min animation |
| fflate | 101arrowz/fflate | MIT | ZIP write |
| 7z-wasm | use-strict/7z-wasm | LGPL-2.1 + unRAR restriction | ZIP/ISO read + 7Z/GZ/RAR/TAR |
| music-metadata-browser | Borewit/music-metadata-browser | MIT | Cover-art / tag-driven cached icons |
| html-to-image | bubkoo/html-to-image | MIT | Taskbar peek preview / screen capture |
| opentype.js | opentypejs/opentype.js | MIT | OpenType viewer (+ Sigil) |
| isomorphic-git | isomorphic-git/isomorphic-git | MIT | `git` in Terminal |
| Pyodide | pyodide/pyodide | MPL-2.0 (+CPython PSF) | `python` in Terminal (per-pkg audit) |
| FFmpeg.wasm | ffmpegwasm/ffmpeg.wasm | wrapper MIT; core LGPL-2.1 | Terminal media convert |
| WASM-ImageMagick | KnicKnic/WASM-ImageMagick | wrapper Apache-2.0; engine ImageMagick License | Terminal image convert |

---

## ADOPTION TIERS (build order; STOP for owner review after each tier)

> Nothing in the tiers below is built yet — this is the post-approval plan. STEP 3
> ships only this doc + `docs/02` for review; tiers build after sign-off.

**Tier A — REPLACE placeholders with real upstreams (highest user-visible delta)**
miniPaint (Paint pillar) · xterm.js Terminal (FS/git/python/convert) · full Browser
(Wayback + The Old Net proxy, bookmark bar+favicons, IPFS, chrome://dino, merge
webring). *(Messenger/IRC are realtime — Tier D.)*

**Tier B — ADOPT new local apps (no realtime, no toolchain)**
eruda DevTools (SHIFT+F12) · jsPaint · OpenType viewer · Video Player (video.js +
codecbox + youtube) · TinyMCE · Vim.js · Webamp (+ Skin Museum + butterchurn) · js-dos
(+ auto save-states) · Photos formats (HEIF/JXL/QOI/TIFF) · Monaco +Prettier · v86
save-states/auto-resize · OS-subsystem extensions (`docs/02`).

**Tier C — ADOPT+DATA games + emulation (engine now, data loader)**
BoxedWine · Quake3 (OpenArena data) · Space Cadet Pinball (user data) · ZZT ·
A Dark Room. *(ClassiCube — **skipped**, owner ruled. Cave Story — **deferred**,
owner ruled, revisit after core tiers.)*

**Tier D — Phase-6 realtime spine (Durable-Objects / WebSockets)**
**Messenger** (Nostr + NIP-04, auto keypair) · **IRC** (KiwiIRC over WebSockets) ·
optional ELIZA buddy · BBS via original ws↔telnet bridge (not fTelnet/AGPL).

**Tier E — CI-wasm artifact batch (needs emscripten build step)**
DOOM+Freedoom · OpenTyrian (Tyrian freeware) · ROTT · Wolf3D · Duke3D. A GitHub
Actions job builds the wasm artifacts + commits them; then vendor artifact + free data.

---

## OWNER DECISIONS OUTSTANDING (only the genuinely-blocked)
Per the governing rule, copyleft alone is **no longer** a decision — accepted engines
are isolated (Rule 4). **All blocking decisions are resolved — nothing gates the build tiers.** Record (only #5 is ongoing discipline, not a blocker):

1. **ClassiCube** — ✅ **RESOLVED: SKIP** (owner ruled). Pulls Minecraft Classic assets at runtime; not adopted.
2. **Cave Story (NXEngine)** — ✅ **RESOLVED: DEFER** (owner ruled). Revisit after the core tiers.
3. **HEIC via libheif-js** — ✅ **RESOLVED: ADOPT behind a notice** (owner ruled). Ship HEIF decode as a Photos add-on; include the LGPL-3 + libde265/HEVC notice in `CREDITS.md` and ship the patent-free formats (JXL/QOI/TIFF) alongside.
4. **TinyMCE** — ✅ **RESOLVED: GPL, isolated** (owner ruled). Ship under GPL-2.0-or-later as a self-contained, separately-licensed runtime module (own dir + LICENSE + source offer), not the commercial license — so our OS code stays MIT.
5. **Trademark/name discipline** (no blocker, just naming): DOOM, Quake III, ClassiCube↔Minecraft, "3D Pinball/Space Cadet", "3D Pipes/Maze/FlowerBox", Video.js®, Winamp/Nullsoft, KiwiIRC, DX-Ball/Arkanoid — descriptive/period labels, our own skin, no logos, no implied affiliation.

Everything else: **ADOPT** per the table — no silent skips.
