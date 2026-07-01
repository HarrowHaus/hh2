# 10 · GRANULAR PARITY PASS (daedalOS depth)

The architecture is already at parity (`docs/09` passes all 12). This closes the **granularity gap**: each surface is thinner than daedalOS. Every item below is fully specced — **Build / Where / Ref / Accept** — including the host-I/O items, which are marked **[DECISION]** for the owner but specced build-ready. Tags: **[DONE]** already in code · **[THIN]** exists, shallower · **[GAP]** missing · **[DECISION]** build only on owner's yes.

**Build priority:** (1) Explorer address bar + Details/Thumbnails views + Sort-by, (2) context-menu matrix, (3) `.whtml` blog system, (4) Display Properties Desktop/wallpaper tab, (5) Start-menu XP exactness, (6) the tail (Run/URL, animations, peek), (7) [DECISION] host-I/O.

Commit each item to `main`; deploy; keep `docs/09` updated as items land.

---

## 1 · FILE EXPLORER  (`src/apps/Explorer/Explorer.tsx`)

### 1.1 Editable address bar  **[THIN]**
- **Build:** replace the display-only `addressbox` `<div>{path}</div>` with (a) **clickable breadcrumb segments** (each path part navigates to that ancestor) and (b) an **editable text input** (click into it → type a path → Enter navigates; invalid path → shake/no-op). Toggle to edit mode on click of the path area.
- **Ref:** daedalOS address bar (back/fwd/recent/up/address/search).
- **Accept:** typing `/Local Disk (C:)/...` + Enter navigates there; clicking a breadcrumb segment navigates to that ancestor; invalid path is rejected without crashing.

### 1.2 Search box  **[GAP]**
- **Build:** wire the toolbar Search input to filter the current folder listing by case-insensitive name substring; empty = full listing. Optional recursive toggle (descend subfolders) later.
- **Ref:** the Search box in the screenshot.
- **Accept:** typing in Search live-filters the visible items of the current folder; clearing restores them.

### 1.3 Views: Icons / Details / Thumbnails / List  **[THIN]**
- **Build:** a `view` state (`'icons' | 'details' | 'thumbs' | 'list'`) selectable from the View menu, persisted (global is fine; per-folder optional).
  - **Details:** a table with columns **Name · Size · Type · Date Modified**. Size from `content.length`/`url` (folders blank), Type from `kind`/extension label, Date from `node.ts`. **Click a column header to sort** (toggle asc/desc), with the active column indicated.
  - **Thumbnails:** larger tiles; image nodes render the image (see 1.7), others show the kind icon.
  - **List:** compact name-only rows.
- **Ref:** daedalOS Thumbnail & Details views.
- **Accept:** all four views render; Details columns sort on header click; selection/open/drag work in every view.

### 1.4 Sort by Name / Size / Type / Date (+ persist)  **[GAP]**
- **Build:** extend `listDir` (`src/os/fs/path.ts`) to accept a `sort: { key: 'name'|'size'|'type'|'date'; dir: 'asc'|'desc' }`; keep folders-first. Persist the chosen sort (Explorer + Desktop) in a small store slice. Sizes from content/url; type from kind/ext; date from `ts`.
- **Ref:** daedalOS "Allow sorting by name, size, type or date; persists sort order."
- **Accept:** changing sort reorders immediately and survives reload.

### 1.5 File info tooltips  **[GAP]**
- **Build:** on hover over an item, show a tooltip with **Type, Size, Date modified** (and dimensions for images when known).
- **Accept:** hovering an item shows the info tooltip after a short delay; keyboard focus shows it too (a11y).

### 1.6 Loading progress dialog  **[GAP]**
- **Build:** a reusable modal progress dialog (determinate where possible) shown for long ops: archive/extract, convert, download, map-directory scan. Title + progress bar + Cancel where cancellable.
- **Accept:** a >300ms op shows the dialog; it closes on completion/cancel.

### 1.7 Dynamic, cached thumbnails  **[THIN]**
- **Build:** for `image` nodes, render a downscaled thumbnail (draw to an offscreen canvas → cache a data-URL keyed by `path + ts`, in memory + optionally IndexedDB). Stub hooks for **video** (first-frame) and **emulator save-state** snapshots — same cache interface, fill later.
- **Ref:** daedalOS "Dynamic and auto cached icons for music, images, video & emulator states."
- **Accept:** image files show their actual thumbnail in Thumbnails/Icons views, generated once and cached (no re-decode on every render).

---

## 2 · CONTEXT-MENU MATRIX  (`src/apps/Explorer` icon menu + `src/components/Desktop/Desktop.tsx` + a shared menu builder)

Current item menu: Open, Cut, Copy, Rename, Delete, Properties. Add the rest. Build a **shared `fileMenu(nodes, selection, ctx)` builder** so Explorer and Desktop produce the same menu.

### 2.1 Open with ▶  **[GAP]**
- **Build:** submenu listing apps that can open the node's kind (derive from a reverse of `routing.ts` + an `accepts` list per app in `appMeta.ts`), plus **Choose another app…** → a picker dialog listing all `APPS`, selecting one opens the node in it (and can set a per-extension default).
- **Accept:** right-click a `.txt` → Open with → Notepad/Code/Choose another app; picking Code opens it in Monaco.

### 2.2 Create shortcut  **[GAP]**
- **Build:** create a new FSNode in the same dir named `<name> - Shortcut` with `app` set to the target's launcher (or a `target` path for folder/file shortcuts) and a shortcut-overlay icon. Opening it routes to the target.
- **Accept:** Create shortcut on Doom/app makes a working shortcut node that launches the target; shortcut shows the overlay arrow.

### 2.3 Add to archive… / Extract here  **[GAP]**
- **Build:** **Add to archive** zips the selection into `<name>.zip` written as an FSNode (use `fflate` for write; you already ship 7z-wasm/extractzip/libunrar under `public/emulatorjs/data/compression` — reuse or add `fflate`). **Extract here** on a `.zip`/`.7z`/`.rar`/`.tar`/`.gz` reads entries and writes them as FSNodes in the current dir (use the bundled extractors). Show the 1.6 progress dialog.
- **Ref:** daedalOS ZIP write + ZIP/ISO read + 7Z/GZ/RAR/TAR extract.
- **Accept:** zipping files produces a `.zip` node; extracting it recreates the files.

### 2.4 Open file/folder location · Open in new window · Open Terminal here  **[GAP]**
- **Build:** **Open location** opens Explorer at `parentOf(path)` and selects the item. **Open in new window** opens a second Explorer window at the folder. **Open Terminal here** opens the Terminal app with `cwd` = the folder (Terminal must accept a `cwd` arg).
- **Accept:** each does exactly that; Terminal opens already `cd`'d into the folder.

### 2.5 Set as wallpaper · Set as mouse pointer  **[GAP]**
- **Build:** on an `image` node, **Set as wallpaper** calls the OS `setWallpaper(url, position)` (see §4). **Set as mouse pointer** sets `--cur-arrow` from the image (advanced; may stub to a message if the image isn't cursor-suitable).
- **Accept:** Set as wallpaper immediately changes the desktop background and persists.

### 2.6 Convert audio/video/photo ▶  **[GAP, later]**
- **Build:** submenu to convert via FFmpeg.wasm (audio/video) / WASM-ImageMagick (images) to common targets; writes the output as a new FSNode. Heavy — wire the menu + progress now, allow the conversion engines to land in the FFmpeg/ImageMagick adoption pass.
- **Accept:** menu present; converting a small image to PNG produces a new node (once engines are wired).

### 2.7 Share  **[THIN/optional]**
- **Build:** a "copy in-OS link" (`/?url=<path>` or `/?app=...`) to clipboard. (daedalOS shares real URLs; ours stays in-world.)
- **Accept:** Share copies a working `/?…` link.

---

## 3 · `.whtml` BLOG SYSTEM  **[DONE]**  (`src/os/fs/types.ts`, `routing.ts`, `src/apps/Blog`)

**Landed:** FSKind `whtml` + `.whtml` routing → the new **Blog** viewer (sandboxed `srcDoc` iframe, scripts disabled), an **Edit** button that opens the raw HTML in Monaco (writes back to the FS, viewer re-renders live), Monaco `whtml→html` highlighting, hero-image-driven Explorer thumbnails (`src/os/fs/whtml.ts`), and a seeded `My Documents/Blog Posts/` folder with **four Bug-authored placeholder posts** (self-contained inline-SVG heroes; zero upstream prose). FS seed → v24. Credited daedalOS (MIT) in CREDITS.md.

daedalOS blog posts are **writable-HTML** files: first-class FS docs with thumbnail previews, opened in a viewer, **editable in Monaco/Vim**.
- **Build:**
  1. Add FSKind `whtml` (rich HTML doc). Route `.whtml`/`.html` (content docs) → a **Blog/HTML viewer** app that renders the stored HTML in a sandboxed container; **Open with → Monaco/Vim** edits the raw HTML (already routable via 3.x once `code` accepts `.whtml`).
  2. **Thumbnail preview:** render the post's hero image (first `<img>`/a `data-thumb` attr) as the file's icon in Explorer (hook into §1.7 cache).
  3. Seed a **`Blog Posts/`** folder (under `My Documents` or Desktop) with your real posts as `.whtml` — this is the diegetic about/writing surface (no meta-narrative; they read as real posts).
- **Ref:** the screenshot — `Blog Posts` folder, `.whtml` files w/ image thumbs, Open-with Monaco/Vim.
- **Accept:** a `.whtml` file shows a thumbnail, opens rendered in the viewer, and opens raw-editable in Monaco; edits persist to the FS.

---

## 4 · DISPLAY PROPERTIES — DESKTOP / WALLPAPER TAB  (`src/apps/DisplayProperties/DisplayProperties.tsx`, OS store)

Appearance (visual styles) ✅ and Screen Saver ✅ exist. The **Desktop tab** wallpaper picker is missing.
- **Build:**
  1. OS store: `wallpaper: { src: string; mode: 'live:waves'|'live:hexells'|'live:matrix'|'ai:websd'|'image'; position: 'center'|'tile'|'stretch'|'fit'|'fill' }`, persisted; `setWallpaper(...)`. Desktop background reads it.
  2. **Position → CSS:** center=`background-position:center` no-repeat; tile=`repeat`; stretch=`100% 100%`; fit=`contain`; fill=`cover`.
  3. **Desktop tab UI:** a wallpaper **list** (bundled images + the live/animated options + the **AI Generated Wallpaper** option — see below) + a **Position** dropdown + a small **preview monitor** + **Browse…** to pick an image node from the FS. Selecting applies live + persists.
  4. **Animated wallpapers:** Waves / Hexells / Matrix-rain as `live:*` modes rendered on an OffscreenCanvas/worker background layer (respect reduced-motion → freeze to a static frame).
  5. **AI Generated Wallpaper (`ai:websd`) — [ADOPTED, reverses earlier skip].** Re-enabled per docs/12 §1.1. A **WebSD (Stable Diffusion, WebGPU)** in-browser generator: a prompt field + Generate button produces a wallpaper client-side at **$0** (no paid API, no server inference, ever). **WebGPU-gate + explicit opt-in** for the one-time model download; if WebGPU is absent, hide the option (silent degrade). The generated image is set via the same `setWallpaper(url, position)` path as any other wallpaper and persists.
- **Ref:** daedalOS Background (image/video, Fill/Fit/Stretch/Tile/Center) + animated Waves/Hexells/Matrix + AI-generated wallpaper (WebSD).
- **Accept:** picking a wallpaper + position changes the desktop and persists; each position mode renders correctly; an animated mode runs (and freezes under reduced-motion); with WebGPU present, the AI option generates and applies a wallpaper fully client-side; without WebGPU it is hidden. Ties to §2.5 Set-as-wallpaper and the desktop-menu Background ▶ (§5).

---

## 5 · DESKTOP CONTEXT MENU + ICONS  (`src/components/Desktop/Desktop.tsx`)

Current: Arrange [disabled], Refresh, Paste, New Folder, New Text Document, Properties. Bring to daedalOS:
- **[GAP] Sort by ▶** (Name / Size / Item type / Date modified) — *functional*, drives desktop icon order (uses §1.4 sort), persisted; **Auto Arrange** + **Align to Grid** toggles.
- **[GAP] Background ▶** — quick wallpaper switcher (recent/bundled) calling `setWallpaper` (§4).
- **[GAP] Window close effect ▶** — picker (`none` / `fade` / `genie`-style) stored in OS state, applied on window close (reduced-motion → none).
- **[GAP] New ▶** — submenu: Folder / Text Document / (Shortcut). Replaces the two flat New items.
- **[GAP] Open Terminal here** — Terminal with `cwd = DESKTOP_PATH`.
- **[DECISION] Add file(s)** + **Map directory** — see §7.
- **[OPTIONAL] View page source / Inspect** — see §7.4.
- **Accept:** desktop menu matches the screenshot's items; Sort by reorders desktop icons and persists; Background changes wallpaper; close-effect visibly changes the close animation.

### 5.1 Grid-snap on drop  **[GAP — docs/12-adjacent work item §7]**
- **Build:** snap desktop icons to an **invisible XP grid** on drop. Define a grid cell (~76×92px matching the icon box + label) anchored top-left; on drag-end, convert the icon's `desktopPos` to the **nearest grid cell** (round `x/cellW`, `y/cellH`, clamp to the desktop rect, avoid stacking two icons in one cell — probe outward for the next free cell). Persist the snapped positions.
- **Auto Arrange** (toggle): when on, icons flow into grid order automatically (column-major, top-left origin) and free-drag is disabled (drops re-flow). **Align to Grid** (toggle): free-drag allowed but every drop snaps to the nearest cell. Both live in the desktop context menu (§5) and persist in the OS store.
- **Ref:** daedalOS desktop icon grid + Auto Arrange / Align to Grid.
- **Accept:** dropping an icon snaps it to the grid; Align to Grid on = every drop snaps, off = free placement; Auto Arrange on = icons flow into order and stay arranged; all persist across reload.

### 5.2 Icon rendering to daedalOS quality  **[THIN]**
- **Build:** crisp icon rendering (correct pixel sizing, no blur), a clear **label** (1–2 lines, ellipsis, XP text-shadow for contrast on any wallpaper), and a **shortcut-arrow overlay** badge on shortcut nodes (bottom-left, matching XP's arrow). Selection + focus states match XP (dotted focus rect, translucent highlight).
- **Accept:** icons are crisp and labeled; shortcut nodes show the arrow overlay; selection matches XP.

### 5.3 Curated custom icons + default desktop loadout  **[GAP — docs/12-adjacent work item §7]**
- **Build:** add a few **custom icons** (Blog folder, music/labels, and a couple bespoke ones) and a **logical default desktop loadout** — arranged as if Bug set up the PC, not a random pile: **My Computer, My Documents, Recycle Bin, the browser, foobar, a game or two, the Blog folder, an about/readme.** Positions follow the grid (§5.1); the arrangement is deliberate and diegetic (no meta-narrative — it just reads as a real person's desktop).
- **Ref:** daedalOS default desktop; a real lived-in XP machine.
- **Accept:** a fresh boot shows the curated loadout on the grid, with the custom Blog/music icons rendered; nothing announces itself.

---

## 6 · START MENU — XP EXACTNESS  (`src/components/StartMenu/StartMenu.tsx`)

Already two-panel + All Programs flyout (grouped) + My Docs/Pics/Music + Control Panel + Run + Log Off/Turn Off. Tighten to XP:
- **[THIN] Left column pinned / MRU split:** top = **pinned** list (configurable; seed with your browser + a couple apps) → divider → **most-recently-used** auto list (track last-launched app IDs in the OS store, cap ~6). Divider above **All Programs**.
- **[GAP] Right column XP items:** **My Recent Documents ▶** (track recently-opened FS files in store), **My Network Places**, **Printers and Faxes**, **Help and Support**, **Search**, plus existing Run. (Non-functional ones open an in-world message or a stub window — diegetic, not dead.)
- **[THIN] Chrome:** green **All Programs** arrow + slide-out animation; the blue user-header gradient + the lighter MRU panel vs. darker places panel (skinned to `bug.msstyles`, not literal Luna).
- **Accept:** launching apps populates the MRU list; opening files populates My Recent Documents; the two-column XP structure + dividers match XP layout (in the active visual style).

---

## 7 · HOST-I/O ITEMS — fully specced **[DECISION]**

These touch the visitor's real machine. Specced build-ready; **build only on owner's yes** (you've been wary of disk mutation). Default recommendation noted per item.

### 7.1 Download (FS → host)  **[DECISION — low risk, recommend YES]**
- **Build:** context-menu **Download** builds a `Blob` from the node (`content` for text, fetched `url` for asset-backed, zipped subtree for folders), creates an object URL, triggers an `<a download>` click, revokes the URL. No persistence change. Show §1.6 dialog for large/zipped.
- **Risk:** none to your OS (read-only out). **Accept:** Download saves the file to the visitor's Downloads.

### 7.2 Add file(s) (host → FS)  **[DECISION — recommend YES, capped]**
- **Build:** **Add file(s)** opens a hidden `<input type="file" multiple>`; on select, read each file (`FileReader`), write an FSNode in the target dir (text inline; binary as an object-URL `url` or base64, kind inferred by extension). **Caps:** per-file size limit (e.g. 25 MB), allowed-kind filter, and these adds live in the **session FS only unless the visitor's persistence is on** (they only mutate *their own* IndexedDB copy, never your deploy). 
- **Risk:** visitor edits their own local copy only — your shipped OS is unaffected. **Accept:** adding a host image makes it appear/open in the OS; refresh behavior matches your persistence model.

### 7.3 Map directory (File System Access API)  **[DECISION — recommend OPTIONAL/desktop-only]**
- **Build:** **Map directory** calls `showDirectoryPicker()`; mount the granted handle as a **read-only** FS subtree under e.g. `/Local Disk (C:)/Mapped/<name>` (lazy-list children on expand). **Session-only** (handles aren't persisted across reloads without re-grant). Feature-detect: if the API is unsupported (Firefox/Safari/mobile), hide the item or show "not supported in this browser."
- **Risk:** read-only + explicit user grant; no write-back unless you choose to add it. **Accept:** mapping a folder shows its files browsable in Explorer; unsupported browsers degrade gracefully.

### 7.4 View page source / Inspect  **[DECISION — recommend SKIP or eruda-only]**
- **Build:** **Inspect** toggles the already-present **eruda** devtools (`src/os/eruda.ts`). **View page source** opens a read-only window showing the current app/page's HTML. Pure daedalOS-dev flavor.
- **Accept:** Inspect toggles eruda; View source shows markup. (Recommend hiding unless you want the dev-flavor.)

---

## 8 · TAIL  (windows / run / url)

- **[THIN] Window open animation** (`src/components/Window`) — scale/opacity in on open to match the existing close effect; reduced-motion instant. **Accept:** windows animate open+close consistently; instant under reduced-motion.
- **[GAP] Taskbar peek preview** (`src/components/Taskbar`) — hover a task → thumbnail (html-to-image snapshot or a live mini-render), click to focus. **Accept:** hovering a taskbar button shows a preview thumbnail.
- **[GAP] Run dialog real routing** (`src/apps/Run`) — input resolves: known **app alias** → open app; **FS path** → route via `routeOpen`; `http(s)`/in-world → Browser. **Accept:** typing `notepad` opens Notepad; a path opens its target.
- **[GAP] URL query loading** — on boot, parse `?app=<id>` (open that app) and `?url=<path>` (open that FS node). **Accept:** loading `/?app=foobar` boots straight onto the desktop with foobar open (no meta-narrative).

---

## Done-definition
An item is done when its **Accept** check passes locally (deploys are frozen until Cloudflare tokens are set up — see the deploy policy), it's committed to `main`, and `docs/09` is updated. Work in the priority order at top; surface the §7 [DECISION] items to the owner with this spec attached and build them per the owner's per-item yes/no.
