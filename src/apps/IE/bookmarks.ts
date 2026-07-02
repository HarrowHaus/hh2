// Browser bookmarks — the curated set from docs/14 §2–4.
//
// Every link here was verified at build time (docs/14 §5). Classification:
//   • live   → opens directly (default CORS mode). Includes sites that answer
//              403/503/522 to datacenter bots but load fine in a real browser
//              (Cloudflare / WAF challenges) — they exist and are live.
//   • archive→ genuinely dead / hijacked / broken-TLS: opens through the app's
//              read-only Wayback proxy so no dead link ever ships (docs/14 §5).
// Stratum tags (docs/14 §2, docs/07): A = teenage 2002–06 · B = collector
// 2007–14 · V = now / cross-strata timeless.
//
// Dropped (never a silent drop, docs/14 §5):
//   • forum.davidicke.com (§4) — Icke's output is widely classified as
//     antisemitic conspiracy content; §4's hard limit says drop-and-flag when
//     unsure. Left out; flagged for the owner.

export interface Link {
  url: string
  name: string
  /** Load through the Wayback proxy instead of live (dead/hijacked/broken TLS). */
  archive?: boolean
}

export interface Folder {
  name: string
  /** Age stratum for the "accreted history" read (docs/14 §2). */
  stratum?: string
  links: Link[]
  /** The §4 "don't look mom" joke folder — set apart, never auto-loaded. */
  joke?: boolean
}

// The in-world Underground Noise Webring, demoted from homepage to a bookmark
// under Old-web (docs/14 §1). 'about:ring' is the Browser's in-world ring list.
export const WEBRING_URL = 'about:ring'

// Selectable search engines — the weird-web discovery tools (docs/14 §2). These
// ARE the in-world search, so they live in the chrome, not just the list.
export interface SearchEngine {
  id: string
  name: string
  /** Query is appended (already URL-encoded) to this prefix. */
  search: string
  home: string
}
export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'wiby', name: 'Wiby', search: 'https://wiby.me/?q=', home: 'https://wiby.me/' },
  { id: 'marginalia', name: 'Marginalia', search: 'https://search.marginalia.nu/search?query=', home: 'https://search.marginalia.nu/' },
  { id: 'frogfind', name: 'FrogFind', search: 'https://frogfind.com/?q=', home: 'https://frogfind.com/' },
]

// §3 — the curated set, in folders by category.
export const FOLDERS: Folder[] = [
  {
    name: 'weird knowledge',
    stratum: 'V',
    links: [
      { url: 'https://sacred-texts.com/', name: 'Sacred Texts' },
      { url: 'https://www.chaosmatrix.org/', name: 'Chaos Matrix', archive: true },
      { url: 'https://www.reddit.com/r/chaosmagick/', name: 'r/chaosmagick' },
      { url: 'https://principiadiscordia.com/', name: 'Principia Discordia' },
      { url: 'https://www.subgenius.com/', name: 'Church of the SubGenius' },
      { url: 'https://www.erowid.org/', name: 'Erowid' },
      { url: 'https://cryptome.org/', name: 'Cryptome' },
      { url: 'https://www.anomalist.com/', name: 'The Anomalist' },
      { url: 'https://www.forteantimes.com/', name: 'Fortean Times' },
      { url: 'https://mysteriousuniverse.org/', name: 'Mysterious Universe' },
      { url: 'https://www.coasttocoastam.com/', name: 'Coast to Coast AM' },
      { url: 'http://www.s8int.com/', name: 's8int.com' },
      { url: 'http://www.timecube.com/', name: 'Time Cube', archive: true },
    ],
  },
  {
    name: 'textfiles / scene',
    stratum: 'A→V',
    links: [
      { url: 'http://textfiles.com/', name: 'textfiles.com' },
      { url: 'http://phrack.org/', name: 'Phrack' },
      { url: 'https://www.2600.com/', name: '2600' },
      { url: 'https://cultdeadcow.com/', name: 'Cult of the Dead Cow' },
      { url: 'https://16colo.rs/', name: 'sixteencolors' },
      { url: 'https://www.pouet.net/', name: 'pouet.net' },
      { url: 'https://www.scene.org/', name: 'scene.org' },
      { url: 'https://www.hornet.org/', name: 'Hornet Archive' },
      { url: 'http://www.catb.org/jargon/', name: 'the Jargon File' },
      { url: 'https://hackaday.com/', name: 'Hackaday' },
    ],
  },
  {
    name: 'music undergrounds',
    stratum: 'B',
    links: [
      { url: 'https://www.metal-archives.com/', name: 'Encyclopaedia Metallum' },
      { url: 'https://rateyourmusic.com/', name: 'RateYourMusic' },
      { url: 'https://www.discogs.com/', name: 'Discogs' },
      { url: 'https://www.last.fm/', name: 'Last.fm' },
      { url: 'https://www.forcedexposure.com/', name: 'Forced Exposure' },
      { url: 'http://www.aquariusrecords.org/', name: 'Aquarius Records' },
      { url: 'https://wfmu.org/', name: 'WFMU' },
      { url: 'https://blog.wfmu.org/', name: 'Beware of the Blog', archive: true },
      { url: 'https://www.ubu.com/', name: 'UbuWeb' },
      { url: 'https://brainwashed.com/', name: 'Brainwashed' },
      { url: 'https://www.cvltnation.com/', name: 'Cvlt Nation' },
      { url: 'https://www.invisibleoranges.com/', name: 'Invisible Oranges' },
      { url: 'https://www.toiletovhell.com/', name: 'Toilet ov Hell' },
    ],
  },
  {
    name: 'horror / trash',
    stratum: 'B',
    links: [
      { url: 'https://www.bleedingskull.com/', name: 'Bleeding Skull' },
      { url: 'http://www.mondodigital.com/', name: 'Mondo Digital' },
      { url: 'https://templeofschlock.blogspot.com/', name: 'Temple of Schlock' },
      { url: 'https://houseofselfindulgence.blogspot.com/', name: 'House of Self-Indulgence' },
      { url: 'https://vinegarsyndrome.com/', name: 'Vinegar Syndrome' },
      { url: 'https://severinfilms.com/', name: 'Severin' },
      { url: 'https://mondomacabro.com/', name: 'Mondo Macabro' },
      { url: 'https://www.somethingweird.com/', name: 'Something Weird' },
      { url: 'https://letterboxd.com/', name: 'Letterboxd' },
    ],
  },
  {
    name: 'games / abandonware',
    stratum: 'A→B',
    links: [
      { url: 'http://www.hardcoregaming101.net/', name: 'Hardcore Gaming 101' },
      { url: 'https://tcrf.net/', name: 'The Cutting Room Floor' },
      { url: 'https://www.homeoftheunderdogs.net/', name: 'Home of the Underdogs' },
      { url: 'https://www.mobygames.com/', name: 'MobyGames' },
      { url: 'https://www.romhacking.net/', name: 'ROMhacking.net' },
      { url: 'https://museumofzzt.com/', name: 'Museum of ZZT' },
      { url: 'https://www.tigsource.com/', name: 'TIGSource' },
    ],
  },
  {
    name: 'old-web / weird-web',
    stratum: 'V',
    links: [
      { url: 'https://wiby.me/', name: 'Wiby' },
      { url: 'https://search.marginalia.nu/', name: 'Marginalia' },
      { url: 'https://frogfind.com/', name: 'FrogFind' },
      { url: 'https://www.cameronsworld.net/', name: "Cameron's World" },
      { url: 'http://www.oocities.org/', name: 'oocities / GeoCities archive' },
      { url: 'https://spacehey.com/', name: 'SpaceHey' },
      { url: 'https://melonland.net/', name: 'Melonland' },
      { url: 'https://theuselessweb.com/', name: 'The Useless Web' },
      { url: 'https://neal.fun/', name: 'neal.fun' },
      { url: 'https://512kb.club/', name: '512KB Club' },
      { url: 'https://publicdomainreview.org/', name: 'Public Domain Review' },
      { url: 'https://archive.org/', name: 'archive.org' },
      { url: WEBRING_URL, name: 'the Underground Noise Webring' },
    ],
  },
  {
    name: 'rabbit holes',
    stratum: 'V',
    links: [
      { url: 'https://everything2.com/', name: 'Everything2' },
      { url: 'https://www.damninteresting.com/', name: 'Damn Interesting' },
      { url: 'https://www.atlasobscura.com/', name: 'Atlas Obscura' },
      { url: 'https://lostmediawiki.com/', name: 'Lost Media Wiki' },
      { url: 'https://scp-wiki.wikidot.com/', name: 'SCP Foundation' },
      { url: 'http://hoaxes.org/', name: 'Museum of Hoaxes' },
      { url: 'https://en.wikipedia.org/wiki/Wikipedia:Unusual_articles', name: 'Wikipedia: Unusual Articles' },
    ],
  },
  {
    name: 'transgressive / DIY',
    stratum: 'A→V',
    links: [
      { url: 'https://crimethinc.com/', name: 'CrimethInc' },
      { url: 'https://theanarchistlibrary.org/', name: 'The Anarchist Library' },
      { url: 'https://www.somethingawful.com/', name: 'Something Awful' },
      { url: 'https://www.metafilter.com/', name: 'MetaFilter' },
      { url: 'https://www.fark.com/', name: 'Fark' },
      { url: 'https://www.b3ta.com/', name: 'b3ta' },
      { url: 'https://www.newgrounds.com/', name: 'Newgrounds' },
    ],
  },
]

// §4 — the hidden "don't look mom" joke folder. Set apart from the main bar,
// never auto-loaded; real working links (proxied if dead). Hard limits honored:
// nothing organized around hatred/violence; forum.davidicke.com dropped + flagged.
export const JOKE_FOLDER: Folder = {
  name: "don't look mom",
  joke: true,
  links: [
    { url: 'https://boards.4chan.org/x/', name: '4chan /x/' },
    { url: 'https://www.abovetopsecret.com/', name: 'AboveTopSecret', archive: true },
    { url: 'https://www.godlikeproductions.com/', name: 'Godlike Productions' },
    { url: 'http://www.lunaticoutpost.com/', name: 'Lunatic Outpost' },
    { url: 'https://stolenhistory.net/', name: 'Stolen History (Tartaria / mudflood)' },
  ],
}
