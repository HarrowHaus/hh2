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

## The music pillar (first-class)
A foobar2000 (heavily customized power-user dark layout — Columns UI-style: playlist grid + album-art panel + spectrum/peak meters) playing the real catalog in `data/discography.json`:
- **Moldmouth** (band) · **Dick Crush Records** · **Couch Nap Records** · **Shaking Dog Tapes** (labels).
- Build tasks: fetch the four Bandcamp pages → map each band to its label(s), pull cover art, capture embed/track IDs for real playback. A `LABELS/` folder + `DISCOGRAPHY` view read the same data.
- Represent names factually; design around the DIY/noise/xerox aesthetic; generate no new crude content.
- The player keeps playing across the desktop (ambient "always something on").

## Leak-and-hide system (found, never announced)
Staged by depth: boot/BIOS strings flavored; switchable "other-side" wallpapers; lived-in file names + a `do_not_open/`; a `normal_person.exe` in the recycle bin (the maturation gag, shown not told); hidden terminal commands (`discog`, `horror`, `metal`, `weird`, `whoami`); in-voice-but-functional error dialogs; a locked `\weird\` folder seeding the deferred conspiracy layer; a guestbook + webring.

## Placeholder vs deferred
- **Real now:** music catalog data, social/contact links, the app/folder structure, the 3 visual styles.
- **Placeholder now:** `WORK/` entries, résumé, about copy.
- **Deferred (own specs):** `trivia.exe` internals, `\weird\` payload, sound pack.
