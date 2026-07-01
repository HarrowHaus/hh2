# 11 · PERSONAL CONTENT — blog + foobar (personal-site reframe)

## Framing (governs this doc)
This is a **personal site** — a portrait of a whole person; **music is one room, not the foundation.**
The **labels are past-tense** (history the machine preserves, not a live storefront). Therefore the
label-facing Nostr ideas — **label-as-publisher, zap tip-jar, charts, NIP-23 blog publishing — are
SHELVED** (deferred/optional; they serve a business that isn't being run). What stays: a local
`.whtml` blog (priority) and foobar with an optional Wavlake *listening* library. Nostr messenger +
Wavlake zaps remain later/optional, not now.

---

## 1 · `.whtml` BLOG SYSTEM  (priority — a first-class content pillar)

daedalOS stores blog posts as **writable-HTML** files: real FS documents with thumbnail previews,
opened in a viewer, editable in Monaco/Vim. Build this to full parity — it's where a lot of the
personal content lives.

### Adopt the mechanism from daedalOS source (MIT)
- Pull daedalOS's `.whtml` handling from `DustinBrett/daedalOS` as the reference: the file kind, the
  HTML render/viewer, the Monaco "Open with" edit path, and the thumbnail-from-hero-image behavior.
  Reimplement/adapt into our stack; credit daedalOS (Dustin Brett, MIT) in CREDITS.md.
- You MAY use Dustin's `.whtml` files as **structural/style templates** (the HTML skeleton + CSS).

### ⚠ Content ownership — hard line
- **Do NOT ship Dustin's personal posts as our content** (his Travel / "Day in My Life" / etc. are his
  actual writing). Replace all prose with **Bug's own content or clearly-authored placeholders.**
- Seed the folder with Bug-authored placeholder posts (titles/topics from Bug's real landscape:
  memory, place, history, half-thoughts, music, obsessions) so the system is populated and testable;
  Bug fills real text later via the in-OS Monaco editor (which writes back to the FS).

### Spec (extends docs/10 §3)
- **FSKind `whtml`** + route `.whtml` → a Blog/HTML viewer (sandboxed render). "Open with → Monaco"
  edits raw HTML; edits persist to the FS.
- **Thumbnail preview** from the post's hero `<img>`/`data-thumb` (hooks docs/10 §1.7 cache).
- **Folder:** `My Documents/Blog Posts/` (or a Desktop folder), seeded with Bug placeholder `.whtml`.
- **Discovered, not presented:** no menu announces the blog; a visitor finds it by opening folders.
  No meta-narrative (Rule 2).
- **Accept:** a `.whtml` shows a thumbnail, opens rendered in the viewer, opens raw-editable in Monaco,
  and edits persist. Seeded posts are Bug/placeholder content — zero Dustin personal text shipped.

---

## 2 · foobar2000 — PARITY REBUILD + MULTIPLE LIBRARIES + MULTIPLE PLAYLISTS
`src/apps/foobar/Foobar.tsx` (+ `catalog.ts`). Current: menu bar, single Album-List tree over the
discography, a single implicit playlist (columns), art + now-playing, transport, status bar.

> **STATUS (Section 2 landed):** rebuilt to the Columns-UI model. `catalog.ts` now exposes a
> `LibrarySource` interface (`id`/`label`/`getTree()`/`resolveStreamUrl()`) with **Discography** as the
> first source; the Media Library panel has a **source switcher** (Wavlake slots in at §2.2 with no UI
> change). Playlists are now **multiple, named, tabbed and persisted** (`playlists.ts`, localStorage
> `hmd.foobar`): ＋ add / ✕ close / double-click rename; double-clicking a library band/album sends its
> tracks to the active playlist. Columns are Artist · Title · Album · Length (＋ track #); the status bar
> shows selection-aware track/time counts + a real codec/sample-rate readout. Skin unchanged. **§2.2
> Wavlake is the next section.**

### 2.0 The foobar2000 mental model Claude Code MUST build to (Columns-UI parity)
Real foobar2000 separates two distinct things — the current build conflates them:
- **Media Library = your whole collection**, browsable (the Album List / library tree). A *source* of tracks.
- **Playlists = multiple, named, tabbed, user-curated queues.** You add tracks *from* a library *into* a playlist.
Parity layout, top → bottom:
1. **Menu bar** — File · Edit · View · Playback · Library · Help (already present).
2. **Transport toolbar** — prev/play-pause/stop/next, seek bar (current/total), volume, the spectrum.
3. **Playlist tabs row** — one tab per playlist (＋ to add, ✕ to close, rename). *New — missing today.*
4. **Split body:**
   - **Left: Media Library panel** — a **source switcher** at the top, then the Album-List tree for the
     selected source (grouped label/artist → album → track, expand/collapse — already built for Discography).
   - **Right: active Playlist** — the multi-column list (Columns UI): configurable columns
     **Artist · Title · Album · Length** (min: Title/Album/Length as today; add Artist + track #).
     Double-click a library item → adds/plays in the active playlist.
5. **Album-art + now-playing panel** (already present).
6. **Status bar** — selection count, total time, and a codec/bitrate-style readout (foobar shows this).

### 2.1 Multiple LIBRARIES (sources) — the key ask
A **source switcher** in the Media Library panel toggles between libraries; **each renders identically**
(same tree, same columns, same transport) so Wavlake "shows up the way a media player displays music":
- **Discography** (local) — the existing R2/`discography.json` spine. Unchanged behavior.
- **Wavlake** (streaming) — a library populated from Wavlake (see 2.2). Browsable as a tree
  (artist → release → track), playable in the same transport, addable to playlists.
- Architect `catalog.ts` around a **`LibrarySource` interface** (`id`, `label`, `getTree()`,
  `resolveStreamUrl(track)`) so Discography and Wavlake are two implementations of one shape, and more
  sources could slot in later. The UI never special-cases a source.

### 2.2 The Wavlake library (optional listening room — reframed, no label/zap agenda)
> **STATUS (Section 3 landed):** `src/apps/foobar/wavlake.ts` implements a `WavlakeSource` against
> Wavlake's public HTTP API (`wavlake.com/api/v1`, no key/wallet). It seeds a browsable tree from
> Wavlake's trending rankings (artist → release → track under a "Trending on Wavlake" wrapper), rendered
> in the same tree/columns/transport as Discography; tracks stream via their `mediaUrl` (audio element
> set `crossOrigin="anonymous"` so the Web-Audio spectrum works where CORS allows). **No zap/chart/tip
> UI.** Any network/CORS failure → the source throws and foobar shows a graceful empty/"unavailable"
> state (the player keeps working). Reference: `derekross/zaptrax` (MIT, credited). Zaps (NIP-57) remain
> deferred (§3 below).

- **Build:** a `WavlakeSource` that fetches Wavlake catalog/track data (Wavlake NOM / kind-32123 events
  via `relay.wavlake.com`, or Wavlake's API) and exposes it through the `LibrarySource` interface;
  `resolveStreamUrl` returns the track's stream URL for the existing `<audio>` transport. **Reference
  implementation to borrow from:** `derekross/zaptrax` (Wavlake streaming + search + player, builds to
  static `dist/`, MIT — credit it).
- **Framing:** this is "music I'm into, streamable," a room — NOT a label/monetization surface. **No
  zap/charts/tip UI in this pass.** Keep a **no-network/graceful-empty** state (if Wavlake/relay is
  unreachable, the tab shows an empty library, foobar still works).
- **Deferred/optional:** NIP-57 zaps on a track are a *later, opt-in* add — never a wall, always a
  fully-working no-wallet path. Not built now.
- **Accept:** the Wavlake source populates the same tree/columns UI, streams through the same transport,
  and tracks can be queued into playlists exactly like Discography tracks; failure degrades to empty.

### 2.3 Multiple PLAYLISTS
- **Build:** playlist state becomes an array of named playlists with an active index; the tabs row
  (2.0 #3) switches/creates/renames/closes them; adding tracks (from any library) targets the active
  playlist; persist playlists (+ the active one) to storage.
- **Accept:** create two playlists, add Discography tracks to one and Wavlake tracks to the other,
  switch tabs — each retains its own list; survives reload.

### 2.4 Skin
- Everything stays on the `bug.msstyles` dark Columns-UI palette (already tightened in the asset pass):
  spacing, header bars, now-playing, gradient spectrum with peak caps, accent volume.

---

## 3 · Shelved / deferred (explicit, so it's not silently dropped)
- Label-as-Nostr-publisher, zap tip-jar, Nostr charts, NIP-23 blog publishing → **shelved** (serve a
  label business not being run).
- Wavlake track zaps (NIP-57) → **deferred, optional**, opt-in + no-wallet path when/if built.
- Nostr messenger upgrade (NIP-17/44, auto-keypair) → **Phase-6 realtime**, optional, about connection
  not platforming.

## Build order
1. `.whtml` blog system (§1) — priority; seed with Bug/placeholder content, credit daedalOS.
2. foobar parity rebuild (§2.0/2.3/2.1) — playlist tabs + multi-playlist + the LibrarySource refactor
   with Discography as the first source.
3. Wavlake source (§2.2) — the second library; borrow from ZapTrax; no zaps.
Commit each to main, deploy, report URL, stop for review between §1, §2, and §3.
