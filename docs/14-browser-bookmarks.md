# 14 · BROWSER — BOOKMARKS, START PAGE & THE "don't look mom" FOLDER

Supersedes the browser-content scattered across docs/07/08. Governs what the IE/Browser app
ships with. Two rulings changed from earlier plans:

1. **Webring is demoted, not deleted.** It is NO LONGER the default start page. It becomes a
   thing you *find* — a bookmark like any other, reachable by digging, same as the blog. The
   default start page is a plain, period-plausible page (see §1), not a self-announcing feature.
2. **Guestbook: CUT.** (Owner call, 2026-07.) Do not build it. Ignore any earlier guestbook spec.

And the NSFW handling is inverted from the old "name-only, never link" rule:

> **NSFW/fringe entries ARE linked and working** — real, clickable, they open. They just live
> in their own **tongue-in-cheek hidden bookmark folder** (a "don't-look-mom" joke folder), set
> apart from the main bar. The joke is the folder, not a fake link. Nothing here is auto-loaded;
> you open the folder and click in on purpose. (Still: no hate/extremist sites — see §4.)

---

## 1 · START PAGE — a personalized portal (My Yahoo! mould)  **[CHANGE — was webring]**

The default start page is a **parody of an early-2000s personalized portal** — the *My Yahoo! /
iGoogle / Netvibes* format: a skinned page of modular boxes. This format is chosen deliberately:
it's **instantly recognizable as "a homepage"** (surface familiarity — anyone expects it), and
its whole premise is user-personalization, so **filling every box with Bug's own content isn't a
violation of the parody, it IS the parody.** The modules also lay out the identity arc in one
glance — the teenage stepping-stones (music, p2p), the collector middle, and where it all led
(current interests) all sit on the same page. **Not Digg** (Digg is a destination, not a start
page); Digg becomes a bookmark in §3.

- **Skin:** the site's dark `bug.msstyles` palette; period portal chrome (boxed modules,
  drag-to-arrange optional, a header greeting). Reads as a portal at a glance.
- **No meta-narrative** (Rule 2): it never explains itself; it just IS his customized start page.

### Modules (each does double duty: *expected on the surface / him underneath / a step on the path*)
1. **Search bar** (top) — expected furniture, BUT the engines are **Wiby / Marginalia / FrogFind**
   (the weird-web discovery tools already wired per §2). *Current him: still hunting the fringes.*
2. **Now Playing / Recently Played** — reads the real catalog (`data/discography.json`), ties to
   foobar. *The music stepping-stone, still humming under everything.*
3. **Downloads** — a small torrent-status box nodding to the BitTorrent app. *The p2p
   stepping-stone, shown not told.*
4. **Headlines / "what I'm reading"** — curated from real sources already in the repo (the podcast
   OPML feeds and/or the §3 weird-knowledge sites; if a live fetch is needed, fall back to a
   curated static list — do not add backend). *Where the path led.*
5. **Quick Links** — a handful of §3 bookmarks surfaced as tiles. *The map of the landscape.*
6. **Furniture box** — date + a static "weather"-style widget + a **"transmission / quote of the
   day"** line in Bug's voice. Period flavor; static, no API. *The ordinary-portal grounding, with
   one line that gives the game away as his.*

- **The webring** moves OUT of the homepage into the bookmarks under *Old-web / weird-web* (§3),
  and/or a page reached by digging. Keep the existing webring content; just stop making it home.

**Accept (start page):** the Browser opens to a skinned personalized-portal page (NOT the webring,
NOT a self-describing menu); the modules above render from existing repo data where possible and
period-static otherwise; the search box offers Wiby/Marginalia/FrogFind; nothing announces itself.

## 2 · BOOKMARK BAR — structure
Load the Browser's bookmark bar / favorites with the curated set below, **in folders by
category**, favicons where the real app supports them (daedalOS Browser ports favicons). Live
sites open normally; dead/archived ones route through the existing read-only Wayback / Old-Net
proxy seam already in the app. Age-tag each folder by stratum where the FS/bookmark model
supports it, so the bookmarks read as an accreted history, not a flat dump:
**A** = teenage (2002–06) · **B** = collector (2007–14) · **C/V** = now / cross-strata timeless.

Also wire **Wiby, Marginalia, and FrogFind** as selectable search engines / "weird-web"
shortcuts in the Browser — they ARE the in-world discovery tools, so they belong in the chrome,
not just the list.

---

## 3 · THE CURATED SET  (main bar — safe-for-anyone, real links)

**Weird-knowledge / esoteric / paranormal** *(V, timeless core)*
Sacred-Texts.com · Chaos Matrix · r/chaosmagick · Principia Discordia · Church of the SubGenius ·
Erowid · Cryptome · The Anomalist · Fortean Times · Mysterious Universe · Coast to Coast AM ·
s8int.com · Time Cube (archived, Wayback).

**Textfiles / hacker / demoscene** *(A→V)*
textfiles.com · Phrack · 2600 · Cult of the Dead Cow (the band name *and* the institution) ·
sixteencolors.net · pouet.net · scene.org · Hornet archive · catb.org / the Jargon File ·
Hackaday.

**Music undergrounds** *(B, deepest vein)*
Encyclopaedia Metallum (metal-archives.com) · RateYourMusic · Discogs · Last.fm · Forced
Exposure · Aquarius Records (archived) · WFMU + Beware of the Blog · UbuWeb · Brainwashed ·
Cvlt Nation · Invisible Oranges · Toilet ov Hell.

**Horror / trash cinema** *(B)*
Bleeding Skull · Mondo Digital · Temple of Schlock · House of Self-Indulgence · Vinegar
Syndrome · Severin · Mondo Macabro · Something Weird · Letterboxd.

**Games / emulation / abandonware** *(A→B)*
Hardcore Gaming 101 · The Cutting Room Floor (tcrf.net) · Home of the Underdogs · MobyGames ·
ROMhacking.net · Museum of ZZT · TIGSource.

**Old-web / weird-web / indie-web** *(V)*
Wiby (wiby.me) · Marginalia (search.marginalia.nu) · FrogFind · Cameron's World · oocities /
GeoCities archive · SpaceHey · Melonland · The Useless Web · neal.fun · 512KB Club · Public
Domain Review · archive.org · **[the HarrowHaus webring — moved here from the homepage].**

**Knowledge rabbit holes** *(V)*
Everything2 · Damn Interesting · Atlas Obscura · Lost Media Wiki · SCP Foundation · Museum of
Hoaxes · Wikipedia "Unusual Articles".

**Transgressive / DIY** *(A→V)*
CrimethInc · The Anarchist Library · Something Awful · MetaFilter · Fark · b3ta · Newgrounds.

---

## 4 · THE "don't look mom" FOLDER  (hidden, real, linked)  **[CHANGE — was name-only]**
A separate bookmark folder set apart from the main bar — the joke IS the folder: name it in
tongue-in-cheek voice (e.g. **`don't look mom`** / `👀 not for mom` / `\private\` — pick the one
that reads funniest in the chrome). Everything inside is **a real, working link** that opens
normally (through the Old-Net proxy if the site is dead). Not auto-loaded — the visitor opens the
folder and clicks in deliberately. This is character truth played for a wink, not shock.

**Contents (real links):**
4chan /x/ (paranormal board) · AboveTopSecret · Godlike Productions · Lunatic Outpost ·
forum.davidicke.com · Stolen History / the Tartaria–mudflood scene · (any other fringe-forum
siblings the build-time check finds still live in this vein).

**Hard limits (unchanged, non-negotiable):**
- **No hate sites, no extremist/violent sites, no illegal content.** "Fringe/conspiracy/paranormal
  forum" is in; anything organized around hatred or violence is out — do not add it even if it's
  period-adjacent. If unsure about a specific entry, leave it out and flag it for the owner.
- Nothing here is auto-loaded or set as a start page.
- Real product/community names = period flavor; we link the front door, we don't reproduce or
  host their content.

---

## 5 · BUILD NOTES for the agent
- **Verify links at build time.** Some of these are 20+ years old. For each: if it 200s live, link
  it live; if dead, link the Wayback/Old-Net proxied version the Browser already supports; if it
  can't be found either way, drop it and note the drop (never a silent drop, never a dead link).
- **Favicons:** use the daedalOS Browser favicon behavior already ported (docs/08).
- **Do not** reintroduce the webring as the homepage. **Do not** build a guestbook.
- **No meta-narrative** anywhere in the Browser chrome or start page (Rule 2).
- Fold this doc's stratum tags into the existing period-strata model (docs/07) so bookmarks
  carry era where the model supports it.

**Accept:** Browser opens to the skinned personalized-portal start page (§1 — not the webring, not a
self-describing menu), its modules rendering from existing repo data where possible; the bookmark
bar has the §3 folders with working/proxied links; the §4 hidden joke-folder exists with real
working links to the fringe forums, set apart and never auto-loaded; Wiby/Marginalia/FrogFind are
selectable search shortcuts; no guestbook exists; no dead links ship.
