# 02 · OS PARITY FLOOR — FULL daedalOS FEATURE LIST

Parity target: **daedalOS** (DustinBrett/daedalOS, MIT). This is the *full* feature
surface, not a reduced floor. Every item below must be **real, not faked**, and is
measured side-by-side against daedalOS — any gap is a bug. Each subsystem notes the
**upstream** daedalOS uses so our implementation can adopt the same engine from its
own source (credited in `CREDITS.md`). Where we keep our own engine (already built and
at parity), it's marked **(ours, at parity)**.

> Governing rule (overrides earlier conservatism): we reconcile to the **entire**
> daedalOS feature set. The only permitted reductions are (a) a **named
> data/asset-license blocker** → adopt the engine + free/user-supplied data, never
> drop; (b) a **named policy line** → the AI Chat Agent and Stable Diffusion are
> substituted/skipped (owner anti-LLM). See `docs/08` for the per-item ledger.

---

## 1. File System
- **Engine:** BrowserFS (jvilk/BrowserFS, MIT) — in-memory + IndexedDB + OverlayFS backends. *(ours today: a flat Zustand FS with IndexedDB persistence — at parity for browse/persist; BrowserFS is the adopt target for real binary-file backing + ZIP/ISO mounts.)*
- **Archives:** ZIP **write** via fflate (101arrowz/fflate, MIT); ZIP/ISO **read** + 7Z/GZ/RAR/TAR via 7z-wasm (use-strict/7z-wasm, LGPL-2.1 + unRAR restriction).
- **Persistence:** IndexedDB (FS, window state, selected visual style) — survives reload.
- **Cached icons:** dynamic per-file icons (audio cover art via music-metadata-browser, Borewit, MIT), cached.

## 2. File Explorer
- Navigation: **back / forward / recent / up / address bar / search**.
- Views: **thumbnail** + **details**.
- Drag & drop: **internal** (move/copy within FS) **and external** (drop OS files in) with a **loading dialog**.
- Selection: **group-select** (marquee + Ctrl/Shift) + **drag-sort**.
- *(ours today: Explorer with open-with routing + persistence — extend to the full nav/view/dnd matrix.)*

## 3. Context-Menu matrix (full)
Every applicable entry, context-sensitive:
`cut / copy / create shortcut / delete / rename`, `add file(s) / map directory`,
`open / open-with / open file location / open in new window / open terminal here`,
`download / add to archive / extract here / set as wallpaper / set as pointer / convert / properties`,
`sort by / new folder / new text document`, **screen capture**.
- *(ours today: real desktop/icon/window/taskbar menus with arrow-key nav — extend to the full action set above.)*

## 4. Keyboard-Shortcut set (full)
`CTRL+C / V / X / A`, `Delete`, `F2` (rename), `F5` (refresh), `Backspace` (up),
`Arrows` (navigate icons), `Enter` (open), `SHIFT+CTRL+R` (hard refresh / clear),
`SHIFT+F10` (context menu / terminal), `SHIFT+F12` (DevTools/eruda),
fullscreen via **Win key**, **Win+R** (Run). Esc closes menus; Alt+Tab cycles.

## 5. Windows
- **Engine:** react-rnd (bokuweb/react-rnd, MIT) for resize/drag *(ours today: original Zustand WM with 8-handle resize, edge/half snapping, z-order, persisted per-window state — at parity; react-rnd is an optional swap, not a requirement).*
- min / max / restore / close; **persist states** across reload.
- **Open/close/minimize animation:** Framer-Motion (framer/motion, MIT), reduced-motion aware.

## 6. Start Menu
- **Expandable sidebar**; **Docs / Pics / Videos** shortcuts; **Power clears the session**.
- **Spotlight effect**, folders, search.
- Shortcuts: **SHIFT+ESC** / **Win key** toggle. *(ours today: XP two-panel Start + data-driven All Programs flyout in `src/os/programs.ts` — extend with sidebar/spotlight/power-clears.)*

## 7. Taskbar
- **Peek preview** of a window via html-to-image (bubkoo/html-to-image, MIT).
- **Focus indicator**; running-task buttons (active state, click to focus/minimize).
- **Search w/ recent**. System tray + live clock.

## 8. Clock
- **Web worker + OffscreenCanvas** render; **NTP** time; **sync**; **date tooltip**; **calendar popup**. *(ours today: live taskbar clock — extend to worker/NTP/calendar.)*

## 9. Background + Screensaver
- **Animated backgrounds:** ✅ **DONE** — live desktop wallpapers selectable in Display Properties ▸ Desktop (Waves, Aurora, Starfield, Matrix, Mystify, 3D Pipes), our own canvas renderers (shared with the screensavers), persisted + reduced-motion aware.
- **Slideshow:** ✅ **DONE** (first source) — a **Slideshow** wallpaper cycling photos from **Lorem Picsum** (no API key, cover-fit, gentle fade). NASA APOD / Art Institute / Met can be added as further sources; image/video wallpaper with Fill/Fit/Stretch/Tile/Center is the remaining piece.
- **Image/video wallpaper** with **Fill / Fit / Stretch / Tile / Center**.
- **Slideshow sources:** NASA APOD, Art Institute of Chicago, The Met, Lorem Picsum (all free/open APIs).
- **Custom screensavers:** **3D FlowerBox**, **3D Maze**, **Pipes** (1j01/pipes, MIT) — the MS names are nominative; FlowerBox/Maze are **built original** (the unlicensed repos with MS bitmaps are NOT used). *(ours today: original Starfield/Mystify/Matrix/3D-Pipes savers + CRT/VHS overlay.)*

## 10. Run dialog
- Alias **and** path resolution; accepts **`ipfs:`** and **`nostr:`** URIs. Win+R opens it.

## 11. URL query loading
- **`/?url=`** (load a file/app by URL) and **`/?app=`** (open a named app on boot).

---

## Theming engine (build it pack/manifest-driven)
Display Properties → Appearance is the real visual-style switcher. v0 ships 3 styles from `tokens/themes.css`: `bug.msstyles` (dark, default), Luna Blue, Classic. Switching is live + persisted.

**Architecture requirement:** the engine must be **pack/manifest-driven**, not hard-coded per theme. A "theme pack" = a manifest mapping chrome parts → image slices + sizing margins + colors + fonts (schema in `docs/06`). Chrome renders from the manifest using CSS custom properties + **`border-image` 9-slice**. Our 3 styles are just the first packs; this keeps the deferred real-`.msstyles` loader (`docs/06`, Phase 5) additive, not a rewrite.

## Base repo & stack
- Fork **`ShizukuIchi/winXP`** (authentic XP chrome) ; reconcile to **`DustinBrett/daedalOS`** for the FULL feature surface above. Phase-0 decision logged in `DECISIONS.md`.
- React + TypeScript · Zustand (OS/window state) · CSS modules + theme-token custom properties · IndexedDB/OPFS (FS) · deploy Cloudflare Pages / Vercel.
- Keep XP assets as **original recreations**, not lifted Microsoft bitmaps. Confirm base-repo license at Phase 0.
- **Adoption discipline:** every adopted engine is installed from **its own upstream** (never daedalOS's glue), credited in `CREDITS.md` with SPDX + name/content terms, and any copyleft engine is isolated as a self-contained, separately-licensed runtime module so our OS code stays MIT (see `docs/08`).
