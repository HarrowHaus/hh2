# 09 · PARITY AUDIT (Phase 4)

Side-by-side audit against the `docs/02-os-parity.md` checklist (parity target:
**daedalOS**). Every item verified against the actual code, not asserted. Status
keys: ✅ done · 🟡 partial · ❌ missing.

_Audited at Phase-4 polish. Deploy: the live `*.pages.dev` build reflects `master`._

| # | Checklist item | Status | Evidence / notes |
|---|----------------|--------|------------------|
| 1 | **Boot** — splash → desktop; skippable; reduced-motion instant; themed | ✅ | `components/Boot` honors `prefers-reduced-motion`; boots straight to desktop (no meta-narrative, Rule 2). |
| 2 | **Window manager** — drag, 8-handle resize, min/max/restore/close, focus+z, edge/half snap, per-window state | ✅ | `Window.tsx` + `store.ts`: pointer-driven drag/resize, `SnapZone` half/max tiling with pre-snap `prev`, z-order via `nextZ`. Restore now always available when maximized. |
| 3 | **Taskbar** — Start, running-task buttons (active/focus/minimize), tray, live clock | ✅ | `Taskbar.tsx` `<nav aria-label="Taskbar">`; `useClock` ticks aligned to the minute. |
| 4 | **Start menu** — two-panel, user header, Log Off/Turn Off, **All Programs**, keyboard | ✅ | Two-panel; **All Programs flyout** is data-driven (`os/programs.ts`) grouped by Program Files category — every shipped app launches from Start. |
| 5 | **Desktop** — selectable icons (single + marquee), drag-arrange, double-click open, context menu | ✅ | `Desktop.tsx`: marquee select, drag-arrange w/ persisted `desktopPos`, double-click open **+ Enter to open (keyboard)**. |
| 6 | **Context menus** — desktop/icon/window/taskbar | ✅ | Single global menu; viewport-clamped; **arrow-key navigable** (#9). |
| 7 | **Virtual file system** — folders/files, Explorer, open-with routing, persistence | ✅ | IndexedDB-backed `fs/store.ts` (v23); `routeOpen` by `app` field then extension; copy/cut/paste/move + multi-select in Explorer. |
| 8 | **App framework** — windowed programs registered to the WM | ✅ | 39 apps via the `APPS` registry; **each lazy-code-split** into its own chunk (Phase-4 perf). |
| 9 | **Keyboard** — Alt+Tab, Esc, arrow-nav menus, visible focus | ✅ | `useKeyboard` (Alt+Tab cycle, Esc closes menus); context-menu arrow/Home/End nav; `:focus-visible` ring. |
| 10 | **Persistence** — window positions, open apps, FS, visual style survive reload | ✅ | `persist` (`hmd.os`): `visualStyle`, `windows`, `crt/neko/screensaver`, z-counters; FS persisted separately (`hmd.fs`); defensive `merge` drops windows for removed apps. |
| 11 | **Responsive** — small-screen fallback; windows → near-fullscreen; taskbar adapts | ✅ | Phase-4: open geometry clamps to viewport; phones (<768px) open non-fitting windows maximized, small fixed apps centered. Touch via pointer events. |
| 12 | **A11y floor** — landmarks, focus mgmt, reduced-motion, contrast | ✅ | `<main>`/`<nav>` landmarks; OS-wide reduced-motion; window **content selectable/copyable**; labeled icon-buttons; dark-theme contrast on tokens. |

## Theming engine (CLAUDE.md core)
✅ Three visual styles (`bug.msstyles` dark default, Luna Blue, Classic) switch live via Display Properties → Appearance and persist. Engine is pack/manifest-shaped per `docs/02` so the deferred real-`.msstyles` loader (Phase 5) drops in additively.

## Phase-4 tickets — status
- ✅ **Perf** — all 39 apps lazy-split; initial bundle 873 kB → 245 kB (gzip 276 → 78). See sign-off below.
- ✅ **A11y / reduced-motion** — selectable content, keyboard-open icons, arrow-nav menus, landmarks (all above).
- ✅ **Responsive / mobile fallback** — viewport-clamped + mobile-maximize.
- ✅ **Asset pass** (all token-driven, matching `bug.msstyles`):
  - **foobar2000** — tightened to the Columns-UI dark palette; functional transport (click-to-seek + current/total time), accent volume slider, gradient spectrum w/ peak caps, gradient header bars, refined now-playing.
  - **Cursors** — original XP-style set (`scripts/make-cursors.mjs` → `src/styles/cursors.css`): arrow everywhere incl. buttons (fixing the prior un-XP hand-on-buttons), hand on real links, I-beam in fields/Monaco, custom resize on handles, `none` preserved over fullscreen overlays. No Microsoft bitmaps; `--cur-*` tokens.
  - **Boot/logon** — authentic XP sliding marquee (lit triad on a rail); welcome screen with distinct per-account avatar tiles + hairline bars. Reduced-motion still instant.
- ✅ **System sounds (silent seam)** — `src/os/sound.ts` wires every event point (startup/shutdown/window open/close/minimize/menu/error) to empty slots; persisted mute/volume + a real tray mute toggle; **ships zero audio assets** and stays silent (verified 0 playback calls) until the Phase-8 pack fills the slots.
- ⏸️ **"Dock" + "system-monitor widget"** — **dropped**: neither is XP-authentic (dock = macOS/daedalOS, widgets = Vista). Rule 1/4. The authentic taskbar quick-launch + tray cover the intent.

## Perf sign-off
- **Initial load:** `index` JS 245 kB (**gzip 78 kB**) + CSS 24 kB (gzip ~5 kB) for a full windowed desktop OS — lean.
- **Code-splitting:** 135 chunks; every app loads on demand. The heavy chunks (Monaco `editor.main` 3.8 MB + its TS/CSS/HTML/JSON language workers) are fetched **only when the Code app opens**, never on first paint.
- **Heavy emulator/runtime assets** (v86 wasm, EmulatorJS cores, Ruffle wasm, TIC-80 wasm) are static `public/` files fetched only when their app opens — off the critical path.
- **Animation:** OS-wide `prefers-reduced-motion` kill-switch; boot skips instantly.
- **Verdict:** initial payload is small and stable; no regressions from the asset pass (CSS-only + one small sound module). ✅

## Gaps / follow-ups
- **DOOM+Freedoom / OpenTyrian** (Tier 3) — toolchain-blocked; need a CI wasm-build pass (emscripten not available locally). Deferred per ruling, not a code blocker.
- **System sound pack** (Phase 8) — drop `.wav` files into `public/sounds/` and fill the `SLOTS` paths in `src/os/sound.ts`; no rewiring needed.

**Bottom line:** the `docs/02` parity checklist passes end-to-end against daedalOS; all Phase-4 work (perf, a11y, responsive, the full asset pass, and the silent sound seam) is shipped and deployed. Phase 4 is complete.
