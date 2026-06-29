# 04 · ASSETS & AGENT TOOLING

## Asset pipeline (vector-first, token-driven)
Every icon, cursor, boot/logon, dock, widget, and chrome bitmap derives from the visual-style tokens (`tokens/themes.css`) so all three styles regenerate cleanly and future styles drop in.
- **Algorithmic/vector** for anything systematic: XP chrome bitmaps (title-bar gradients, buttons), icon set, cursor, registration/gloss details → generate as **SVG** (or CSS) from tokens. Crisp, scalable, themeable.
- **Raster only where vector can't fake it**: xerox/photostat grain, halftone photo textures, the grim wallpaper. Keep minimal.
- **Asset set to produce:** Start button + flag, taskbar, title-bar + window controls (per style), Start-menu art, desktop icon pack, cursor, BootSkin, LogonStudio screen, foobar2000 skin, dock, system-monitor widget skin.
- Keep XP-derived assets as **original recreations**, not lifted Microsoft files.

## Skills (Claude Code)
- **frontend-design** — for any new UI/chrome work.
- An **SVG / asset-generation** skill — for the icon/cursor/chrome asset set.
- An **image/texture** skill — only for the few raster textures (grain/wallpaper).

## MCP servers (measured set — not gratuitous)
- **GitHub** — repo workflow (commits/pushes to `main`; see CLAUDE.md Rule 3).
- **Deploy** (Cloudflare Pages or Vercel) — per-phase preview URLs.
- **Bandcamp / asset fetch** (optional) — resolve the discography mapping + pull cover art/embeds.
Nothing beyond these unless a concrete need appears; log additions in `DECISIONS.md`.

## Sub-agent patterns (Haiku)
- **Parallel build agents:** orchestrator splits each phase into independent tickets; Haiku agents run them concurrently; orchestrator integrates + checks against the phase acceptance list.
- **Asset agents:** one phase fans out icon-set / wallpaper / chrome-bitmap / cursor generation across Haiku agents.
- **Git agent (dedicated):** after each ticket passes its check, runs:
  ```bash
  git add -A
  git commit -m "<type>: <ticket summary>"
  git push origin main
  ```
  Commits to `main` only. No branches, no PRs. On non-fast-forward: `git pull --rebase origin main` then push.
