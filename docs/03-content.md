# 03 · CONTENT

Parity-content floor (from the OS-portfolio set): a visitor can learn **who/what/how-to-contact**, **browse the work**, **be entertained** (games + music), and **discover hidden depth** — with **zero meta-narrative** (CLAUDE.md Rule 2).

## App / folder / file map (placeholder content, real structure)
- **`START_HERE.txt` / Notepad** — diegetic about, in voice. (NOT the mock's self-describing copy — write it as a real personal note, or cut it.)
- **`WORK/` (Explorer folder)** — projects as files, each opens in its app. Placeholder entries, real structure (title/role/year/links).
- **`résumé.pdf`** — PDF viewer.
- **`CONTACT` / Mail** — contact + links.
- **Terminal** — working CLI over the FS (`ls/cd/cat/open`); also a leak surface (hidden commands).
- **foobar2000** — the music pillar (below).
- **`GAMES/`** — real playable mini-games (parity flex); one classic-reskinned + one small custom; 90s flavor.
- **`trivia.exe`** — always-on weird-knowledge game; **no LLM**; API questions + scripted bots + hand-written host line-bank. Shell/stub now, internals deferred.
- **Image viewer / `PHOTOS/`** — gallery; cover art, flyers, stills.
- **Display / Control Panel** — the visual-style switcher + sound toggle + cursor.
- **Recycle Bin** — Easter-egg payload (leak-and-hide).
- **"Internet"/Browser** — curated weird-web webring + a guestbook (bots keep it alive).

### Period software (diorama props — the 2004–06 texture)
The era's lived reality: torrenting fansubbed anime and DivX movies at brutal speeds, then fighting codec hell to make them play (pre-VLC-ubiquity). Build these as **diegetic props, not working software.**
- **BitTorrent client** (period-appropriate: µTorrent-/Azureus-style window) — fake torrents mid-download: invented anime/movie release names with era-authentic fansub-group tags (e.g. `[FakeSubGroup]`), columns for size / seeds / peers / % / ratio, the classic crawling progress and the "ratio: 0.04" guilt. **Non-functional: no real trackers, no real downloads, no real titles — fictional data only.** A museum diorama of the experience, not a client.
- **`CODECS/` folder — hundreds of real + fake codec packs.** The authentic horror: a junk-drawer you hoarded trying to play one `.avi`.
  - *Real-era names (period flavor):* CCCP (Combined Community Codec Pack), K-Lite, ffdshow, DivX, XviD, VobSub, Haali Media Splitter, AC3Filter, Real Alternative, QuickTime Alternative, Nimo, ACE Mega CoDecS, Storm, Cole2k, Media Player Classic.
  - *Fake/sketchy ones (the joke + the depth-riot):* the malware-vector clutter the era was infamous for — `DivX_Pro_FREE_crack.exe`, `xvid_FULL_no_virus.exe`, `KAZAA_codec_pack.exe`, and friends. **Props only — file names + fake installer dialogs / readmes. Generate NO real executables, NO real or simulated malware, NO working "crack" code.** Opening a sketchy one pops an in-character fake-installer gag (next-next-finish, "12 toolbars installed").
  - Depth-riot: deeper into `CODECS/` / `do_not_open/`, the names get sketchier — found, never announced.
- Optional companion clutter: a `DOWNLOADS/` of half-finished `.avi.!ut` part-files; an `.nfo` viewer with ASCII-art scene art (invented groups).

**Full niche-culture artifact set + planting-by-era → see `docs/07-period-strata.md`** (private trackers, P2P, AIM/mIRC, emulation, esoteric/textfiles veins; AIM is a mainstay, anime/JRPG are background only). Everything there obeys the same non-functional/fictional/no-malware guardrails.

## The music pillar (first-class) — full self-hosted R2 catalog
The whole discography is **self-hosted on Cloudflare R2** and played with real HTML5 `<audio>` (NOT Bandcamp embeds — Bandcamp 403s bots). The **volume is the point**: every label × band × album × track, not a curated sample. foobar2000 is a real **media-library UI** (foobar Album List / Columns UI style): a browsable **tree by label → band → year/album**, plus playlist, now-playing, transport, and a **real Web Audio spectrum** (AnalyserNode on the `<audio>` element). It must scale to hundreds of tracks. The player keeps playing across the desktop (ambient "always something on").

**Two-file data model** (foobar reads + joins both):
- `data/discography.json` — hand-authored **metadata spine**: labels → bands → albums, founding years, relationships. Source of truth for facts.
- `data/audio-manifest.json` — **generated bulk**: every track `{ title, artist, album, label, year, art (R2 url), src (R2 url) }`. Stubbed empty until ingest runs; foobar shows a ready/empty state and plays **no fake audio** until real `src`s exist.

**Ingest (how the catalog is populated):** `scripts/ingest-music.mjs` (`npm run ingest`) walks the owner's **own organized music folder**, reads ID3/Vorbis tags, uploads audio + embedded art to R2 via wrangler (Cache-Control: `public, max-age=31536000, immutable`), and emits `audio-manifest.json`. Do NOT scrape Bandcamp. Keep an optional "view on Bandcamp" link per release. Represent names factually; design around the DIY/noise/xerox aesthetic; generate no new crude content. A `LABELS/` folder + `DISCOGRAPHY` view read the same spine.

## Leak-and-hide system (found, never announced)
Staged by depth: boot/BIOS strings flavored; switchable "other-side" wallpapers; lived-in file names + a `do_not_open/`; a `normal_person.exe` in the recycle bin (the maturation gag, shown not told); hidden terminal commands (`discog`, `horror`, `metal`, `weird`, `whoami`); in-voice-but-functional error dialogs; a locked `\weird\` folder seeding the deferred conspiracy layer; a guestbook + webring.

## Placeholder vs deferred
- **Real now:** music catalog data, social/contact links, the app/folder structure, the 3 visual styles.
- **Placeholder now:** `WORK/` entries, résumé, about copy.
- **Deferred (own specs):** `trivia.exe` internals, `\weird\` payload, sound pack.
