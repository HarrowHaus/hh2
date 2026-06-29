import type { FSNode } from './types'
import { DESKTOP_PATH } from './path'

// Phase 3 content seed — the palimpsest as a real disk. Folders + text artifacts
// only here; images/app-launchers/props are added by their own tickets. Strata
// timestamps (A teenage 2002-06, B collector 2007-14, C now 2026, V deep vein)
// so "sort by date" walks the eras. All contents are fictional, in-voice, and
// non-narrating (CLAUDE.md Rule 2); real names are period flavor only (Rule 5).

const T = (iso: string) => Date.parse(iso)
const A = T('2005-04-12T20:11:00')
const A2 = T('2006-02-03T01:47:00')
const B = T('2009-08-19T23:30:00')
const B2 = T('2011-06-07T19:02:00')
const OINK = T('2007-10-23T02:15:00')
const C = T('2026-05-18T14:00:00')

const C_DRIVE = '/Local Disk (C:)'
const DOCS = `${C_DRIVE}/Documents and Settings`
const OWNER = `${DOCS}/owner`
const MYDOCS = `${OWNER}/My Documents`
const MUSIC = `${MYDOCS}/My Music`
const PICS = `${MYDOCS}/My Pictures`
const MOVIES = `${MYDOCS}/MOVIES`
const READING = `${MYDOCS}/reading`
const WORK = `${MYDOCS}/WORK`
const PF = `${C_DRIVE}/Program Files`

function folder(path: string, name: string, ts: number): FSNode {
  return { path, name, type: 'folder', kind: 'folder', ts }
}
function text(path: string, name: string, ts: number, content: string): FSNode {
  return { path, name, type: 'file', kind: 'text', ts, content }
}
function launcher(path: string, name: string, ts: number, app: FSNode['app']): FSNode {
  return { path, name, type: 'file', kind: 'exe', ts, app }
}
// Image files store an art id in `content`; the Image Viewer renders the
// matching original SVG recreation (no lifted bitmaps, docs/04).
function image(path: string, name: string, ts: number, artId: string): FSNode {
  return { path, name, type: 'file', kind: 'image', ts, content: artId }
}

const FOLDERS: [string, string, number][] = [
  [C_DRIVE, 'Local Disk (C:)', A],
  [`${C_DRIVE}/WINDOWS`, 'WINDOWS', A],
  [`${C_DRIVE}/WINDOWS/system32`, 'system32', A],
  [PF, 'Program Files', A],
  [`${PF}/foobar2000`, 'foobar2000', A],
  [`${PF}/Azureus`, 'Azureus', A],
  [`${PF}/BitTornado`, 'BitTornado', A],
  [`${PF}/uTorrent`, 'uTorrent', A2],
  [`${PF}/mIRC`, 'mIRC', A],
  [`${PF}/AIM`, 'AIM', A],
  [`${PF}/Adobe Photoshop CS2`, 'Adobe Photoshop CS2', A2],
  [`${PF}/FL Studio`, 'FL Studio', A2],
  [`${PF}/Macromedia Flash MX`, 'Macromedia Flash MX', A],
  [`${PF}/Sonic Foundry Sound Forge`, 'Sonic Foundry Sound Forge', A],
  [`${PF}/Emulators`, 'Emulators', A],
  [`${PF}/Emulators/ZSNES`, 'ZSNES', A],
  [`${PF}/Emulators/SNES9x`, 'SNES9x', A],
  [`${PF}/Emulators/VisualBoyAdvance`, 'VisualBoyAdvance', A2],
  [`${PF}/trivia`, 'trivia', C],
  [`${PF}/GAMES`, 'GAMES', A],
  [`${C_DRIVE}/CODECS`, 'CODECS', A],
  [`${C_DRIVE}/CODECS/do_not_open`, 'do_not_open', A2],
  [`${C_DRIVE}/RECYCLER`, 'RECYCLER', C],
  [DOCS, 'Documents and Settings', A],
  [`${DOCS}/FAMILY`, 'FAMILY', A],
  [`${DOCS}/FAMILY/Desktop`, 'Desktop', A],
  [`${DOCS}/FAMILY/My Documents`, 'My Documents', A],
  [OWNER, 'owner', A],
  [DESKTOP_PATH, 'Desktop', A],
  [MYDOCS, 'My Documents', A],
  [MUSIC, 'My Music', A],
  [`${MUSIC}/LABELS`, 'LABELS', A],
  [`${MUSIC}/LABELS/Moldmouth`, 'Moldmouth', A],
  [`${MUSIC}/LABELS/Dick Crush Records`, 'Dick Crush Records', A],
  [`${MUSIC}/LABELS/Couch Nap Records`, 'Couch Nap Records', A],
  [`${MUSIC}/LABELS/Shaking Dog Tapes`, 'Shaking Dog Tapes', A],
  [`${MUSIC}/rips`, 'rips', A],
  [`${MUSIC}/rips/Moldmouth - Demo (2005)`, 'Moldmouth - Demo (2005)', A],
  [PICS, 'My Pictures', A],
  [MOVIES, 'MOVIES', B],
  [`${MOVIES}/Spectral Corridor (1986)`, 'Spectral Corridor (1986)', B],
  [READING, 'reading', B2],
  [WORK, 'WORK', C],
  [`${MYDOCS}/winmx_shared`, 'winmx_shared', A],
  [`${MYDOCS}/soulseek_dl`, 'soulseek_dl', A2],
]

const FILES: FSNode[] = [
  text(
    `${MUSIC}/OiNK_RIP_memorial.txt`,
    'OiNK_RIP_memorial.txt',
    OINK,
    [
      'they took it down today.',
      '',
      'six years of the best music education i ever got, gone in a morning.',
      'every log, every cue, every comment thread where someone explained',
      'why a transcode is a lie. you could not buy what that place taught you.',
      '',
      'archived what i could. the rest is in my head now.',
      'long live the pink palace.',
    ].join('\n'),
  ),
  text(
    `${MUSIC}/whatcd_interview_notes.txt`,
    'whatcd_interview_notes.txt',
    B,
    [
      'interview prep — DO NOT FAIL THIS',
      '',
      '- lossless = FLAC/WAV/ALAC. lossy = MP3/AAC/Vorbis. know the difference cold.',
      '- a 320 re-encoded from a 192 is a transcode. it is garbage. spek it.',
      '- EAC + secure mode + AccurateRip. log or it did not happen.',
      '- never upload from a lossy source and call it lossless. that is the cardinal sin.',
      '',
      'breathe. you know this.',
    ].join('\n'),
  ),
  text(
    `${MUSIC}/FLAC_vs_V0_vs_320.txt`,
    'FLAC_vs_V0_vs_320.txt',
    B2,
    [
      'the only correct answer is FLAC and you know it.',
      'V0 if you are out of space. 320 if you hate yourself.',
      'anyone who says they "can hear the difference" on apple earbuds is lying,',
      'but archive lossless anyway because you only rip once.',
    ].join('\n'),
  ),
  text(
    `${MUSIC}/rips/Moldmouth - Demo (2005)/Moldmouth - Demo.log`,
    'Moldmouth - Demo.log',
    A,
    [
      'Exact Audio Copy V0.95 prebeta 4',
      'EAC extraction logfile from 12. April 2005, 20:11',
      '',
      'Moldmouth / Demo',
      '',
      'Used drive  : PLEXTOR  PX-708A   Adapter: 1  ID: 0',
      'Read mode   : Secure with NO C2, accurate stream, disable cache',
      'Used output format : Internal FLAC Codec (Level 8)',
      '',
      'Track  1 |  0:00.00 |  2:14.18 | CRC AF3C21B7 | Accurately ripped',
      'Track  2 |  2:14.18 |  1:58.04 | CRC 11D9E0A2 | Accurately ripped',
      'Track  3 |  4:12.22 |  3:31.51 | CRC 6E0B4F9D | Accurately ripped',
      '',
      'No errors occurred. End of status report.',
    ].join('\n'),
  ),
  text(
    `${MUSIC}/rips/Moldmouth - Demo (2005)/Moldmouth - Demo.cue`,
    'Moldmouth - Demo.cue',
    A,
    [
      'REM GENRE Noise',
      'REM DATE 2005',
      'PERFORMER "Moldmouth"',
      'TITLE "Demo"',
      'FILE "Moldmouth - Demo.flac" WAVE',
      '  TRACK 01 AUDIO',
      '    TITLE "untitled 1"',
      '    INDEX 01 00:00:00',
      '  TRACK 02 AUDIO',
      '    TITLE "untitled 2"',
      '    INDEX 01 02:14:18',
      '  TRACK 03 AUDIO',
      '    TITLE "untitled 3"',
      '    INDEX 01 04:12:22',
    ].join('\n'),
  ),
  text(
    `${MOVIES}/cinemageddon_memorial.txt`,
    'cinemageddon_memorial.txt',
    B2,
    [
      'rules of the church:',
      '- the uglier the transfer the holier the film',
      '- a VHS rip with tracking lines is a relic, not a flaw',
      '- giallo over gore, but gore is fine, but giallo',
      '- if it was banned somewhere it goes to the top of the list',
      '',
      'still hunting a watchable copy of half this list. some things',
      'are supposed to be hard to find.',
    ].join('\n'),
  ),
  text(
    `${MOVIES}/Spectral Corridor (1986)/spectral.corridor.1986.READNFO.txt`,
    'spectral.corridor.1986.READNFO.txt',
    B,
    [
      'Spectral Corridor (1986)',
      'source: PAL VHS (ex-rental, no subs)',
      'CD1 / CD2 — XViD, mp3, hardsubbed nowhere',
      '',
      'note: reel change at 47:10 is on the tape, not the rip.',
      'if anyone has a cleaner master, trade me.',
    ].join('\n'),
  ),
  text(
    `${MYDOCS}/soulseek_dl/DC++_queue.txt`,
    'DC++_queue.txt',
    A2,
    [
      'queue (do not close the hub):',
      '  Dead Snakes - live tape (someone had it!!)',
      '  Hung Eyes - split, side B only, looking for A',
      '  [comp] basement noise vol 3',
      '  Couch Nap Records - distro folder (whole thing, slow)',
      '',
      'ratio is fine. share more than you take.',
    ].join('\n'),
  ),
  text(
    `${READING}/time_cube.txt`,
    'time_cube.txt',
    B2,
    [
      'saved from a page that does not load anymore.',
      '',
      'FOUR simultaneous days in a single rotation of earth.',
      'they do not teach you this. ask yourself why.',
      '',
      '(i do not believe it. i just could not stop reading it.)',
    ].join('\n'),
  ),
  text(
    `${READING}/godlike_productions.txt`,
    'godlike_productions.txt',
    B2,
    [
      'thread dump before it 404s:',
      '- the numbers station on 4625 khz changed its pattern again',
      '- three people in this thread claim to be the same person',
      '- one of them is probably right',
      '',
      'half of this is bored people at 3am. the other half is the point.',
    ].join('\n'),
  ),
  text(
    `${READING}/cult_of_the_dead_cow.txt`,
    'cult_of_the_dead_cow.txt',
    B2,
    [
      'funny that the name shows up twice in my life.',
      'once as a band on a tape i traded for.',
      'once as the people who basically invented the e-zine i grew up reading.',
      '',
      'the cow abides. t-files forever.',
    ].join('\n'),
  ),
  text(
    `${READING}/anarchist_cookbook.txt`,
    'anarchist_cookbook.txt',
    B2,
    [
      '======================================================',
      '  [ FILE RECOVERED FROM A BAD FLOPPY — MOSTLY CORRUPT ]',
      '======================================================',
      '',
      'CHAPTER 1 ....... [unreadable]',
      'CHAPTER 2 ....... [unreadable]',
      'CHAPTER 3 ....... [redacted]',
      '',
      'every weird kid had a copy. nobody ever made anything from it.',
      'it was a dare you kept in a folder, not a manual.',
      '',
      '<the rest of this file did not survive>',
    ].join('\n'),
  ),
  text(
    `${WORK}/README - projects.txt`,
    'README - projects.txt',
    C,
    [
      'WORK in this folder. real entries get filled in here.',
      'each project: title / role / year / link.',
      '(placeholder structure for now.)',
    ].join('\n'),
  ),
  text(
    `${WORK}/project-01.txt`,
    'project-01.txt',
    C,
    ['Title: [project name]', 'Role: [role]', 'Year: 2025', 'Link: [url]', '', 'One line on what it was.'].join('\n'),
  ),
  text(
    `${WORK}/project-02.txt`,
    'project-02.txt',
    C,
    ['Title: [project name]', 'Role: [role]', 'Year: 2024', 'Link: [url]', '', 'One line on what it was.'].join('\n'),
  ),
  text(
    `${MYDOCS}/about.txt`,
    'about.txt',
    C,
    [
      'i fix things, make things, and keep too much stuff.',
      'mostly i make noise and the artwork that goes with it.',
      '',
      'if you need me: the CONTACT file has the current addresses.',
    ].join('\n'),
  ),
  text(
    `${PF}/Emulators/ZSNES/gamegenie_codes.txt`,
    'gamegenie_codes.txt',
    A2,
    [
      'codes that actually worked:',
      '  infinite lives ....... DD64-6488',
      '  walk through walls .... 7E0DXX (ram poke, careful)',
      '  moon jump ............ C28A-64A7',
      '',
      'save state before you try the ram ones or you will brick the save.',
    ].join('\n'),
  ),
]

// CODECS\ — the junk-drawer of codec-pack "installers" (manifest item 1). Each
// .exe is a prop that opens the fake-installer gag (app: 'installer'); none are
// real executables. Real-era names = period flavor only (docs/03, docs/07-A).
const CODECS = `${C_DRIVE}/CODECS`
const DNO = `${CODECS}/do_not_open`
const A04 = T('2004-08-22T23:14:00') // early codec-hell, pre-A
const CODEC_FILES: FSNode[] = [
  launcher(`${CODECS}/CCCP-2005-09-13.exe`, 'CCCP-2005-09-13.exe', A, 'installer'),
  launcher(`${CODECS}/K-Lite_Mega_Codec_Pack_140.exe`, 'K-Lite_Mega_Codec_Pack_140.exe', A, 'installer'),
  launcher(`${CODECS}/ffdshow_rev1853_20050307.exe`, 'ffdshow_rev1853_20050307.exe', A04, 'installer'),
  launcher(`${CODECS}/DivX511Bundle.exe`, 'DivX511Bundle.exe', A04, 'installer'),
  launcher(`${CODECS}/XviD-1.1.0-30122005.exe`, 'XviD-1.1.0-30122005.exe', A, 'installer'),
  launcher(`${CODECS}/VSFilter_VobSub_2.39.exe`, 'VSFilter_VobSub_2.39.exe', A, 'installer'),
  launcher(`${CODECS}/HaaliMediaSplitter.exe`, 'HaaliMediaSplitter.exe', A2, 'installer'),
  launcher(`${CODECS}/ac3filter_1_51b.exe`, 'ac3filter_1_51b.exe', A04, 'installer'),
  launcher(`${CODECS}/RealAlternative_151.exe`, 'RealAlternative_151.exe', A04, 'installer'),
  launcher(`${CODECS}/NimoCodecPack_50.exe`, 'NimoCodecPack_50.exe', A04, 'installer'),
  text(
    `${CODECS}/read_me_first.txt`,
    'read_me_first.txt',
    A04,
    [
      'codec hell survival rules (learned the hard way):',
      '',
      '1. do NOT install two packs at once. pick CCCP or K-Lite, never both.',
      '2. if it stops playing, it is ALWAYS a filter merit conflict. always.',
      '3. uninstall everything, reboot, install ONE pack, test on a known-good avi.',
      '4. ffdshow is doing the actual work. the rest is splitters and grief.',
      '5. anything in do_not_open is in there for a reason. leave it.',
    ].join('\n'),
  ),
  // do_not_open\ — the sketchier the name, the deeper it sits (depth-riot,
  // docs/03). Props only: no real exe, no malware, no crack code. Opening one
  // pops the same inert installer gag.
  launcher(`${DNO}/DivX_Pro_FREE_crack.exe`, 'DivX_Pro_FREE_crack.exe', A2, 'installer'),
  launcher(
    `${DNO}/codec_megapack_2005_FINAL_no_virus.exe`,
    'codec_megapack_2005_FINAL_no_virus.exe',
    A2,
    'installer',
  ),
  launcher(`${DNO}/KAZAA_codec_pack.exe`, 'KAZAA_codec_pack.exe', A2, 'installer'),
]

// Creative-software dioramas (manifest item 5). The .exe launches the diorama
// shell; the document files launch it pre-loaded with their artwork/project.
// Inert props — neither app edits anything.
const CREATIVE: FSNode[] = [
  launcher(`${PF}/Adobe Photoshop CS2/Photoshop.exe`, 'Photoshop.exe', A2, 'photoshop'),
  launcher(`${PF}/FL Studio/FL Studio.exe`, 'FL Studio.exe', A2, 'flstudio'),
  launcher(`${PICS}/moldmouth_demo_cover.psd`, 'moldmouth_demo_cover.psd', A, 'photoshop'),
  launcher(`${PICS}/dickcrush_show_flyer.psd`, 'dickcrush_show_flyer.psd', A2, 'photoshop'),
  launcher(`${MUSIC}/untitled_3.flp`, 'untitled_3.flp', A2, 'flstudio'),
]

// Image artifacts (manifest items 3, 4, 8). Original SVG recreations rendered by
// the Image Viewer; fictional, period-flavored, inert.
const IMAGES: FSNode[] = [
  image(`${PICS}/moldmouth_demo_cover.png`, 'moldmouth_demo_cover.png', A, 'moldmouth-cover'),
  image(`${PICS}/spek_spectral_FLAC.png`, 'spek_spectral_FLAC.png', B, 'spek-spectral'),
  image(`${MOVIES}/Spectral Corridor (1986)/poster.jpg`, 'poster.jpg', B, 'spectral-poster'),
  image(`${READING}/chaos_magick_sigil.bmp`, 'chaos_magick_sigil.bmp', B2, 'chaos-sigil'),
]

// Recycle Bin + leak-and-hide (manifest item 11). The locked \weird\ folder is
// a Phase-8 stub (opening it denies access). RECYCLER holds the deleted items,
// incl. normal_person.exe — the maturation gag, shown not told (docs/03).
const WEIRD = T('2014-02-09T03:33:00')
const SPECIAL: FSNode[] = [
  { path: `${C_DRIVE}/weird`, name: 'weird', type: 'folder', kind: 'folder', ts: WEIRD, locked: true },
  launcher(`${C_DRIVE}/RECYCLER/normal_person.exe`, 'normal_person.exe', C, 'msgbox'),
  text(
    `${C_DRIVE}/RECYCLER/curfew.txt`,
    'curfew.txt',
    A2,
    ['10:00 PM.', '', 'not anymore.'].join('\n'),
  ),
  text(
    `${C_DRIVE}/RECYCLER/old_screenname.txt`,
    'old_screenname.txt',
    A,
    [
      'retired this one. it followed me to too many places.',
      'kept the away message though. some things you earn.',
    ].join('\n'),
  ),
  text(
    `${C_DRIVE}/RECYCLER/apology_draft_FINAL_final.txt`,
    'apology_draft_FINAL_final.txt',
    B,
    [
      'draft 7.',
      '',
      'never sent it. did not need to in the end.',
      'leaving it here instead of the trash for good.',
    ].join('\n'),
  ),
]

// Program launchers (.exe shortcuts) — opening one opens its app.
const LAUNCHERS: FSNode[] = [
  launcher(`${DESKTOP_PATH}/foobar2000`, 'foobar2000', A, 'foobar'),
  launcher(`${DESKTOP_PATH}/µTorrent`, 'µTorrent', A2, 'bt'),
  launcher(`${PF}/foobar2000/foobar2000.exe`, 'foobar2000.exe', A, 'foobar'),
  launcher(`${PF}/uTorrent/µTorrent.exe`, 'µTorrent.exe', A2, 'bt'),
  launcher(`${C_DRIVE}/WINDOWS/system32/cmd.exe`, 'cmd.exe', A, 'terminal'),
  launcher(`${PF}/trivia/trivia.exe`, 'trivia.exe', C, 'trivia'),
  launcher(`${DESKTOP_PATH}/trivia.exe`, 'trivia.exe', C, 'trivia'),
  launcher(`${PF}/GAMES/Minesweeper.exe`, 'Minesweeper.exe', A, 'minesweeper'),
  launcher(`${DESKTOP_PATH}/Minesweeper`, 'Minesweeper', A, 'minesweeper'),
]

export function seedFS(): Record<string, FSNode> {
  const nodes: FSNode[] = [
    ...FOLDERS.map(([p, n, ts]) => folder(p, n, ts)),
    ...FILES,
    ...CODEC_FILES,
    ...CREATIVE,
    ...IMAGES,
    ...SPECIAL,
    ...LAUNCHERS,
  ]
  return Object.fromEntries(nodes.map((n) => [n.path, n]))
}
