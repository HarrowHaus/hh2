# 02 · OS PARITY FLOOR

Parity target: **daedalOS**. Every item below must be real, not faked. Run the checklist side-by-side against daedalOS; any gap is a bug.

## Required features
1. **Boot** — POST/splash → desktop; skippable; reduced-motion = instant. Themed per visual style.
2. **Window manager** — drag, resize (8 handles), min / max / restore / close, focus + z-order, edge + half snapping, per-window state.
3. **Taskbar** — XP layout: Start button, running-task buttons (active state, click to focus/minimize), system tray, live clock.
4. **Start menu** — XP two-panel (programs left, places right; user header; Log Off / Turn Off). Searchable, keyboard-navigable.
5. **Desktop** — selectable icons (single + marquee), drag-arrange, double-click open, right-click context menu.
6. **Context menus** — desktop, icon, window, taskbar — all real.
7. **Virtual file system** — folders/files, an Explorer app, open-with routing, **persistence** across sessions (IndexedDB/OPFS).
8. **App framework** — apps are windowed programs registered to the WM. Phase-3 ships working: Explorer, Notepad, foobar2000 (music pillar), `trivia.exe` shell (stub).
9. **Keyboard** — Alt+Tab cycle, Esc closes menus, arrow-nav menus, visible focus.
10. **Persistence** — window positions, open apps, FS, and **selected visual style** survive reload.
11. **Responsive** — graceful fallback on small screens (windows → near-fullscreen; taskbar adapts); the XP feel survives.
12. **A11y floor** — semantic landmarks, focus management, reduced-motion, adequate contrast in each visual style.

## Theming engine
Display Properties → Appearance is the real visual-style switcher. 3 styles from `tokens/themes.css`: `bug.msstyles` (dark, default), Luna Blue, Classic. Switching is live + persisted. Architect chrome so all colors/bitmaps derive from theme tokens (so future styles drop in cleanly).

## Base repo & stack
- Fork **`ShizukuIchi/winXP`** (authentic XP) ; reference **`DustinBrett/daedalOS`** for FS/WM depth. Phase-0 decision logged in `DECISIONS.md`.
- React + TypeScript · Zustand (OS/window state) · CSS modules + theme-token custom properties · IndexedDB/OPFS (FS) · deploy Cloudflare Pages / Vercel.
- Keep XP assets as **original recreations**, not lifted Microsoft bitmaps. Confirm base-repo license at Phase 0.
