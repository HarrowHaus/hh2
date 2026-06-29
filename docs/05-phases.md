# 05 · BUILD PHASES (agent-ready tickets)

Each phase: orchestrator decomposes into the tickets below, Haiku agents run them in parallel, orchestrator integrates + verifies the acceptance checklist, the **git agent commits to `main` per ticket**, and the phase ends with a **deployed preview URL** for the user. Do not start a phase before the prior one passes its checklist.

---

## PHASE 0 — Engine + scaffold
**Tickets:** audit `ShizukuIchi/winXP` vs `daedalOS` (fork-effort vs parity) · choose base, log in `DECISIONS.md` · fork + strip to a bare bootable desktop · wire `tokens/themes.css` + theme-switch plumbing (no UI yet) · deploy empty-desktop preview · confirm base license.
**Acceptance:** repo builds + deploys; bare XP desktop boots; theme tokens load; `DECISIONS.md` records the base choice + reasoning.

## PHASE 1 — XP skin (the look-test)
**Tickets:** implement authentic XP chrome (taskbar, Start button, two-panel Start menu, title bars + controls) · apply `bug.msstyles` dark as default · build Display Properties → Appearance switcher (dark / Luna / Classic) live + persisted · boot + logon themed surfaces · grim wallpaper placeholder.
**Acceptance:** real XP chrome (from the base repo) with the `tokens/themes.css` dark skin applied; all 3 visual styles switch live and persist; **no meta-narrative copy anywhere** (Rule 2); user signs off the look before Phase 2.

## PHASE 2 — WM parity
**Tickets:** windowing (drag/resize-8/min/max/restore/focus/z-order/snapping) · virtual file system + Explorer · context menus (desktop/icon/window/taskbar) · persistence (windows, FS, open apps, visual style) · keyboard (Alt+Tab, Esc, arrows, focus rings).
**Acceptance:** the `02-os-parity.md` checklist passes side-by-side vs daedalOS; everything persists across reload.

## PHASE 3 — App set + content
**Tickets:** Explorer · Notepad · **foobar2000** wired to `data/discography.json` (resolve labels, art, embeds) · `trivia.exe` shell (stub) · `GAMES/` with ≥1 playable emulator · period-software diorama (BitTorrent-client prop + `CODECS/` folder of real+fake packs — **non-functional, fictional, no malware**; see `03`) · **plant the period-culture strata per `docs/07`** (AIM mainstay; private-tracker/P2P/mIRC/esoteric veins; age-tagged timestamps; anime/JRPG background only) · the palimpsest folder structure (A/B/C) · leak-and-hide salting (recycle bin, hidden terminal cmds, locked `\weird\`) · `WORK/`/résumé/about placeholders (diegetic copy, no narration).
**Acceptance:** apps open/run; foobar2000 plays real catalog; folders reflect the palimpsest; zero self-describing copy.
**Checkpoint (before populating):** draft a **content manifest** — the exact artifact list for `CODECS/`, the BT prop, and the `docs/07` strata: every file/app name, its stratum, its timestamp-era, and one line on what opening it does. Present it to the owner for red-pen and **wait for approval** before building the files. Aim for a tight, true set (signal over volume) — a curated ~40 artifacts a visitor fully explores beats 300 nobody opens. The owner cuts/keeps/adds; only then populate.

## PHASE 4 — Parity QA + polish + assets
**Tickets:** full asset pass (icon pack, cursor, dock, system-monitor widget, boot/logon, foobar2000 skin — all token-driven) · responsive/mobile fallback · a11y floor · system sounds (XP-style) · side-by-side daedalOS parity audit · perf.
**Acceptance:** parity audit clean; a11y + reduced-motion pass; release-candidate preview deployed.

---

## PHASE 5 — Real-theme engine (deferred; only on explicit go)
Build per `docs/06`. **Tickets:** client-side `.msstyles` parse/extract worker · property→manifest mapper (parts subset) · wire to the pack-driven engine · Display Properties "drop a `.msstyles` to install" affordance · 2–3 converted test themes (from styles the owner personally owns — NOT committed to the repo).
**Acceptance:** drop a real `.msstyles`, desktop reskins live + persists; zero third-party/Microsoft bitmaps committed.

---

**Deferred to their own specs (do not build until called):** `trivia.exe` internals, `\weird\` payload, real portfolio content, and Phase 5 above.
