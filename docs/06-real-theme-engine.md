# 06 · REAL-THEME ENGINE (deferred — Phase 5)
**Goal:** the user drops a real Windows `.msstyles` (and/or `.theme`) file into the OS, a converter cracks it open client-side, and the desktop wears it live — no Windows, no patching, they never see the machinery. Ship only our own recreations; *load* real ones the user supplies.

**Status:** deferred. Do NOT build during Phases 0–4. But the Phase-1 theming engine MUST be **pack/manifest-driven** (see `02-os-parity.md`) so this drops in as an additive module, not a rewrite.

---

## Prior art (absorb these — don't reinvent)
| Source | URL | Take from it |
|---|---|---|
| **nptr/msstyleEditor** + wiki | github.com/nptr/msstyleEditor — wiki pages ".msstyles Format" & "Basic Concepts" | The reference *parser*. Documents the byte format + the class→part→state→property model. How to READ the file. |
| **Wine `uxtheme`** | github.com/wine-mirror/wine — `dlls/uxtheme/msstyles.c` and `dlls/uxtheme/draw.c` | Reference *implementation*: theme-INI parse, part/state/property lookup, `DrawThemeBackground`, `GetThemeMargins`, gradient fills, stretch + alpha. How to turn it into PIXELS. |
| **ReactOS `uxtheme`** | doxygen.reactos.org → `dll/win32/uxtheme/draw.c` | Second, cleaner reference for the same drawing semantics. |
| **convert.guru msstyles tool** | convert.guru/msstyles-converter | Proof that PE parse + bitmap extraction already runs **in-browser**. |
| **XP.css / 98.css** | github.com/botoxparty/XP.css · github.com/jdan/98.css (verify) | The CSS *target dialect* — XP chrome already expressed in pure CSS. |

Authority check: the Wine project's own recommended approach to this problem is "a tool that generates themes from the native ones" — i.e. a transpiler, exactly this. We are on the sanctioned path, not improvising.

## The format (what you're parsing)
A `.msstyles` is a PE/DLL with **no code, only resources**. Logical model: **Class → Part → State → Property** (e.g. `Window → Caption → Active → fill/image/margins`). The `VARIANT` resource holds properties; `CMAP` holds class names; `IMAGE`/`STREAM` hold bitmaps. `.theme` is plain INI (colors, wallpaper, cursor, sound pointers). XP-era images are BMP-based (some with alpha / a transparent key color); Vista+ uses PNG.

## The bridge
Windows themes **split each control into 9 regions and recombine them for the requested size** — this is identical to CSS `border-image` 9-slice. So: read each part/state's image + its **sizing margins** from the file, emit a `border-image-slice`/`border-image-width` rule + the extracted image. Gradient fills → CSS gradients. Colors/fonts/metrics → CSS custom properties.

## Pipeline (client-side, in a Web Worker)
1. **Read** the dropped file → ArrayBuffer.
2. **Parse PE** → enumerate resources (a small JS PE/resource reader; convert.guru proves feasibility).
3. **Extract** part/state bitmaps (IMAGE/STREAM) → decode BMP/PNG → `ImageBitmap`/blob URLs. Honor alpha / transparent-key.
4. **Parse properties** (VARIANT): for each part/state pull `ImageFile`, `SizingMargins`, `ContentMargins`, `Fill`/gradient, `TextColor`, fonts, transparency. Port the lookup logic from Wine `msstyles.c`.
5. **Map** the parts we actually render (subset table below) → a **theme pack manifest** (schema below).
6. **Apply**: feed the manifest to the existing pack-driven theming engine → it sets CSS custom props + `border-image` rules + blob-URL images → desktop reskins live. Persist the pack.

Only a **subset** of uxtheme parts needs support — not the whole schema.

## Parts subset → CSS mapping
| uxtheme class/part | our chrome element | CSS technique |
|---|---|---|
| `Window` Caption / FrameLeft/Right/Bottom (Active/Inactive) | window title bar + frame | `border-image` 9-slice from caption/frame bitmaps + sizing margins; active/inactive states |
| `Window` SysButton / MinButton / MaxButton / CloseButton (Normal/Hot/Pressed/Disabled) | caption buttons | per-state background slices |
| `Button` Pushbutton (states) | push buttons / dialog buttons | `border-image` per state |
| `Taskbar` / `TaskBand` / `Tray` | taskbar | tiled/stretched background + slices |
| `Start` / `StartPanel` | Start button + Start menu | background slices + content margins |
| `Scrollbar` (thumb/track/arrows) | scrollbars | slices per part/state |
| `Edit` / `Combobox` / global colors & fonts | fields, system colors, fonts | CSS custom properties |

## Theme-pack manifest (the engine's contract — same for our recreations and converted ones)
```jsonc
{
  "name": "Royale Noir",
  "colors": { "--accent": "#...", "--win-text": "#...", "...": "..." },
  "fonts":  { "--ui-font": "Tahoma, sans-serif", "--ui-size": "11px" },
  "metrics":{ "--title-h": "27px", "--border-w": "4px" },
  "parts": {
    "windowCaption": {
      "active":   { "image": "blob:...|/themes/x/cap-active.png",
                    "slice": [5,5,5,5], "width": [5,5,5,5], "fill": "stretch" },
      "inactive": { "image": "...", "slice": [5,5,5,5] }
    },
    "closeButton": { "normal": {...}, "hot": {...}, "pressed": {...} },
    "taskbar":     { "default": { "image": "...", "slice": [0,0,2,0], "repeat": "repeat-x" } }
    /* ...subset above... */
  }
}
```
Our bundled recreations ship as static packs in this shape. The converter emits the same shape with blob-URL images. The engine doesn't care which it got.

## Decision forks (everything else is settled)
1. **Convert-on-drop (client-side, live install)** vs build-time pre-convert. → Client-side in a worker — the live "install a theme" UX is the whole point. Build-time only for our bundled recreations.
2. **`border-image` declarative** vs canvas redraw (Wine-faithful). → border-image first (~95%); canvas only for exotic fills if ever needed.
3. **Full uxtheme schema** vs the parts subset above. → Subset.

## Legal-clean loader (locked policy)
- **Bundle only our own recreations.** Never ship/redistribute Microsoft's or any third-party artist's bitmaps.
- The loader converts files the **user supplies at runtime**, client-side — we never host the copyrighted asset (same posture as a media player playing a user's file).
- The "Windows blocks third-party themes" lock is a `uxtheme.dll`-on-real-Windows thing (requires SecureUxTheme/patchers there); our browser engine isn't bound by it. Only redistribution matters, and the user-supplies-it model sidesteps it.
- Optional nicety: a one-line "drop a .msstyles to install" affordance in Display Properties — diegetic, not a tutorial.

## Phasing
- **Now (Phase 1):** engine is pack/manifest-driven + `border-image`-ready. (Cheap hook — see `02`.)
- **Phase 5 (this doc):** build the worker pipeline + the Display Properties install affordance + 2–3 converted test themes (using styles you personally own, not shipped). Acceptance: drop a real `.msstyles`, desktop reskins live and persists; no third-party bitmaps in the repo.
