# 11 · PERSONAL CONTENT — blog + foobar + podcasts (personal-site reframe)

## Framing (governs this doc)
This is a **personal site** — a portrait of a whole person; **music is one room, not the foundation.**
The **labels are past-tense** (history the machine preserves, not a live storefront). Therefore the
label-facing Nostr ideas — **label-as-publisher, zap tip-jar, charts, NIP-23 blog publishing — are
SHELVED** (deferred/optional; they serve a business that isn't being run). What stays: a local
`.whtml` blog (priority), foobar with an optional Wavlake *listening* library, and a podcast client
(what Bug actually listens to). Nostr messenger + Wavlake zaps remain later/optional, not now.

---

## 1 · `.whtml` BLOG SYSTEM  (priority — a first-class content pillar)  **[DONE — Section 1]**

daedalOS stores blog posts as **writable-HTML** files: real FS documents with thumbnail previews,
opened in a viewer, editable in Monaco/Vim. Build this to full parity — it's where a lot of the
personal content lives.

> **STATUS:** FSKind `whtml` + `.whtml` routing → the **Blog** viewer (sandboxed `srcDoc` iframe) with
> an **Edit → Monaco** raw-HTML path that persists to the FS; hero-image Explorer thumbnails; seeded
> `My Documents/Blog Posts/` with four Bug-authored placeholder posts (self-contained inline-SVG heroes,
> zero upstream prose). Credited daedalOS (MIT).

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

## 2 · foobar2000 — PARITY REBUILD + MULTIPLE LIBRARIES + MULTIPLE PLAYLISTS  **[DONE — Sections 2–3]**
`src/apps/foobar/Foobar.tsx` (+ `catalog.ts`). Current: menu bar, single Album-List tree over the
discography, a single implicit playlist (columns), art + now-playing, transport, status bar.

> **STATUS:** rebuilt to the Columns-UI model. `catalog.ts` exposes a `LibrarySource` interface
> (`id`/`label`/`getTree()`/`resolveStreamUrl()`, plus `searchable`/`modes`/`loadArtist` for networked
> sources) with **Discography** as the first source and a **source switcher**. Playlists are
> **multiple, named, tabbed, persisted** (`playlists.ts`). Status bar shows selection-aware counts +
> codec/sample-rate readout. Mobile: below ~620px the 3-pane layout collapses to a Library/Playlist/
> Now-Playing switcher.

### 2.0–2.4 (spec unchanged — see git history for the detailed layout/columns/skin requirements)

### 2.2 The Wavlake library (optional listening room — reframed, no label/zap agenda)
> **STATUS:** `src/apps/foobar/wavlake.ts` — `WavlakeSource` over Wavlake's public HTTP API
> (`wavlake.com/api/v1`, no key/wallet), rendered in the same tree/columns/transport. A real,
> navigable library: **search box**, **browse-mode chips** (Trending + 12 genres), and **lazy
> per-artist catalog drill-in**. Streams via `mediaUrl` (`crossOrigin="anonymous"`). **No zap/chart/
> tip UI.** Graceful empty on any network/CORS failure. Reference: `derekross/zaptrax` (MIT, credited).
> *Known limitation (owner-acknowledged): non-Trending modes may return limited results depending on
> Wavlake API support — fine for now, expandable later.*

---

## 3 · PODCAST APP  (sibling to foobar — RSS, zero cost, zero licensing)  **[DONE — Section 4]**
A podcast client curated to **only Bug's feeds**. Podcasts are open RSS: nothing to license, nothing to
host — fetch feed XML, list episodes, stream the episode enclosure URL. Another honest room in the
portrait (what Bug actually listens to), alongside foobar (music) and the blog (writing).

> **STATUS:** `src/apps/Podcast/` — a lean RSS podcatcher skinned as **iPodder** on `bug.msstyles`,
> reusing a foobar-style transport + now-playing. All **57 feeds** subscribed on open from
> `data/podcasts.opml`. Parsing via the browser-native **DOMParser** (zero deps — `@podverse/podcast-feed-parser`
> was dropped after it dragged `xml2js`/`sax` Node deps that crashed the app chunk; §3.1 allows the
> parser choice). CORS: direct fetch first, then a **Cloudflare Pages Function** (`functions/api/feed.js` — a
> read-only edge proxy that deploys with the normal Pages build, no wrangler/tokens), then public
> relays + the Browser's Old-Net `theoldnet.com/get` seam as backups. Per-show **episode list** (title/date/duration/notes/art), **play via the
> transport**, **resume position** + **mark played/unplayed** (persisted, `hmd.podcast`), a per-show
> **refresh** (new-episode check), and best-effort **download**. *Feeds are fetched lazily per selected
> show (not all 57 eagerly) for performance; unreachable/CORS-blocked feeds degrade to an empty show
> without breaking the app.*

### 3.1 Build lean — do NOT adopt a whole podcast app
Full FOSS podcast apps (Podverse, Winds) assume a server stack (Postgres/API, Mongo/Redis) and fight the
XP skin. We already have the audio transport + now-playing + `LibrarySource` pattern from §2. A podcast
client is just *RSS parse → episode list → stream enclosure*. So:
- **Parsing library only:** `@podverse/podcast-feed-parser` (**ISC**, node-or-browser, Podcasting-2.0,
  returns `{meta, episodes}`). Alt: `rss-parser` (MIT). Credit in CREDITS.md.
- **Architecture:** the Podcast app is essentially another `LibrarySource`-shaped thing (shows → episodes
  → `resolveStreamUrl`), reusing the foobar transport/now-playing so it behaves like a media player.

### 3.2 CORS / fetch strategy
Most of Bug's feeds are on big hosts (Spreaker/Megaphone/Libsyn/Buzzsprout/RedCircle/Anchor/art19/
audioboom/podbean) that generally send permissive CORS → fetch directly. For any that block: reuse the
**read-only proxy seam** from the Browser's Old-Net mode, or the free **Podcast Index API**. **Verify
per-host at build time; do not assume.** Episode audio (the enclosure) usually streams fine cross-origin
via the `<audio>` element even when the feed XML needs a proxy.

### 3.3 Features (real, not bloated)
- **Fixed subscription list = Bug's 57 feeds** (below), stored as `data/podcasts.opml` (seeded from the
  Podcast Addict export). "Add feed" allowed but the point is the curation.
- **Episode list per show** (title, date, duration, show-notes/description from the feed) + cover art.
- **Play/stream** via the existing transport; **resume position**; **mark played/unplayed**.
- **New-episode check** on open (re-fetch feeds; show unplayed counts).
- **Download for offline** (optional) — write the enclosure to the FS like any file.

### 3.4 Skin (period-correct option)
Podcasting is late-XP (~2004–05) — real but late. Prefer the **in-costume** skin: dress it as **iPodder/
Juice** (the actual 2004 podcatcher) or as a foobar/Winamp-style podcast component. Keep it on
`bug.msstyles`.

### 3.5 Seed — Bug's 57 subscriptions → `data/podcasts.opml`
(The 57 title→feed pairs are seeded verbatim in `data/podcasts.opml`.)

- **Accept:** the Podcast app opens with all 57 shows subscribed; selecting a show fetches + lists
  episodes; playing streams through the shared transport with resume + mark-played; feeds needing a
  proxy route through the Old-Net seam; unreachable feeds degrade to an empty show without breaking the app.

---

## 4 · Shelved / deferred (explicit, so it's not silently dropped)
- Label-as-Nostr-publisher, zap tip-jar, Nostr charts, NIP-23 blog publishing → **shelved** (serve a
  label business not being run).
- Wavlake track zaps (NIP-57) → **deferred, optional**, opt-in + no-wallet path when/if built.
- Nostr messenger upgrade (NIP-17/44, auto-keypair) → **Phase-6 realtime**, optional, about connection
  not platforming.

## Build order
1. `.whtml` blog system (§1) — **DONE** (Section 1).
2. foobar parity rebuild (§2.0/2.3/2.1) — **DONE** (Section 2).
3. Wavlake source (§2.2) — **DONE** (Section 3; expanded to search/genres/drill-in + mobile).
4. Podcast app (§3) — **DONE** (Section 4): lean, on the shared transport,
   `@podverse/podcast-feed-parser` (ISC), 57 feeds seeded to `data/podcasts.opml`, CORS via the Old-Net
   proxy seam, iPodder skin.
Commit each to main, stop for local review between sections; deploys auto-run from the GitHub repo
(no manual wrangler/R2 — those remain deferred until Cloudflare tokens are set up).
