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
**Tickets:** Explorer · Notepad · **foobar2000** wired to `data/discography.json` (resolve labels, art, embeds) · `trivia.exe` shell (stub) · `GAMES/` with ≥1 playable · the palimpsest folder structure (A/B/C) · leak-and-hide salting (recycle bin, hidden terminal cmds, locked `\weird\`) · `WORK/`/résumé/about placeholders (diegetic copy, no narration).
**Acceptance:** apps open/run; foobar2000 plays real catalog; folders reflect the palimpsest; zero self-describing copy.

## PHASE 4 — Parity QA + polish + assets
**Tickets:** full asset pass (icon pack, cursor, dock, system-monitor widget, boot/logon, foobar2000 skin — all token-driven) · responsive/mobile fallback · a11y floor · system sounds (XP-style) · side-by-side daedalOS parity audit · perf.
**Acceptance:** parity audit clean; a11y + reduced-motion pass; release-candidate preview deployed.

---

**Deferred to their own specs (do not build):** `trivia.exe` internals, `\weird\` payload, real portfolio content.
