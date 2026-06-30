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
- ✅ **Perf** — all 39 apps lazy-split; initial bundle 873 kB → 243 kB (gzip 276 → 77).
- ✅ **A11y / reduced-motion** — selectable content, keyboard-open icons, arrow-nav menus, landmarks (all above).
- ✅ **Responsive / mobile fallback** — viewport-clamped + mobile-maximize.
- 🟡 **Asset pass** — token-driven cursor set, foobar2000 skin polish, boot/logon refinement: **awaiting owner art-direction** (aesthetic is locked to XP + `bug.msstyles`, Rule 4).
- ⏸️ **System sounds** — deferred to **Phase 8** per CLAUDE.md ("stubs/hooks only"); no audio assets this phase.
- ⏸️ **"Dock" + "system-monitor widget"** — **dropped**: neither is XP-authentic (dock = macOS/daedalOS, widgets = Vista). Rule 1/4 (parity, match real XP). The authentic taskbar quick-launch + tray cover the intent.

## Gaps / follow-ups
- **DOOM+Freedoom / OpenTyrian** (Tier 3) — toolchain-blocked; need a CI wasm-build pass (emscripten not available locally). Deferred per ruling, not a code blocker.
- **Asset pass** is the only open Phase-4 work and is gated on owner aesthetic decisions.

**Bottom line:** the `docs/02` parity checklist passes end-to-end against daedalOS; Phase-4 quality work (perf, a11y, responsive) is shipped. Remaining is owner-gated cosmetic asset work.
