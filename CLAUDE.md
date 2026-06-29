# CLAUDE.md — OPERATING BRIEF
Read this fully before doing anything. These are hard rules, not suggestions.

## What we're building
**THE HAND-ME-DOWN** — a browser-based Windows XP desktop that is a personal portfolio-OS. It must feel like a real, heavily-customized XP machine (parity target: **daedalOS**), booting straight onto a desktop wearing a **dark scene-kid `.msstyles` skin**. Luna Blue and Windows Classic are switchable via a working Display Properties panel. The owner's life (underground music labels, horror, 90s games, weird knowledge) lives in the content/customization layer — discovered, never narrated.

---

## HARD RULES

### 1. Parity before aesthetic — always
Build and preserve **real OS function first**, then skin it. Never let the look compromise behavior. Acceptance for every OS feature is measured **side-by-side against daedalOS**. The skin sits on top of a genuine window manager + virtual file system; it never replaces them. If a choice trades function for looks, function wins.

### 2. No meta-narrative. Ever. (Copy rule)
The **desktop is the entry point.** Boot straight onto it. The site never explains itself.
- **Banned:** onboarding, welcome screens, tutorials, "interactive portfolio OS" framing, fourth-wall narration, any copy that describes the concept or tells the visitor how to explore ("open Display", "the deeper you go…", "this is a hand-me-down PC", etc.).
- **Allowed:** diegetic content written straight — a real about, real contact, real project files, a note a person would actually leave on their machine. In-world only, never commentary on the experience.
- The concept (hand-me-down palimpsest, surface-order/depth-riot) lives **only in these docs**. On screen it is *felt* through what's where and what gets found — never announced. If a visitor would have to be told the deep layers get weirder, it failed.
- The approved mock's `START_HERE.txt` copy is an example of what to CUT.

### 3. Git workflow — commit to main, no branches
- **Always commit directly to `main`.** Never create branches. Never open pull requests. Never ask the user to merge.
- After each completed ticket, stage everything, commit with a Conventional Commit message, and push to `origin main`.
- A dedicated **Haiku git sub-agent** owns this (see Build model). Its only job:
  ```bash
  git add -A
  git commit -m "<type>: <concise summary of the ticket>"
  git push origin main
  ```
- If a push fails (e.g. remote ahead), `git pull --rebase origin main` then push. Never branch around a conflict.

### 4. Aesthetic is locked
Authentic XP chrome (taskbar, Start, two-panel Start menu, XP title bars + controls) wearing `bug.msstyles` (dark). Luna + Classic are real alternate visual styles via Display Properties. **Do not drift** toward abstract/Swiss/brutalist/glass looks — those were rejected. When in doubt, match real XP and the dark skin in `tokens/themes.css`. **Build XP chrome from the winXP base; never hand-roll it or port it from a throwaway mock — only the skin (tokens) is ours.**

### 5. Content handling
Represent the band/label catalog (`data/discography.json`) as **factual real entities**. Do **not** generate new crude/offensive content to "match" the names. Keep any in-world error/UI copy functional. **Neurodivergence is never an on-screen theme** — it only informs how obsessively complete the deep layers are.

---

## Build model (orchestrator + Haiku sub-agents)
- **Orchestrator** (this agent) plans each phase, decomposes it into independent tickets, integrates, and reviews against the phase's acceptance checklist.
- **Haiku sub-agents** execute parallel tickets within a phase (e.g. {resize-handles}, {context-menus}, {fs-persistence}).
- **Haiku git sub-agent** (dedicated): after each ticket lands and passes its check, it runs the add/commit/push-to-main sequence in Rule 3. One commit per ticket, descriptive message.
- **Every phase ends with a deployed preview URL** for the user to test (Cloudflare Pages or Vercel).

See `docs/05-phases.md` for the 4 phases as tickets with acceptance checklists.

## Base repo & stack
- **Fork `ShizukuIchi/winXP`** (github.com/ShizukuIchi/winXP) as the XP chrome/feel base — most period-accurate. Bring **`DustinBrett/daedalOS`** up as the functional-depth reference (deeper FS/WM).
- **Phase-0 decision (log in `DECISIONS.md`):** deepen winXP toward daedalOS parity, vs. fork daedalOS and re-skin to XP. Default: the former, for fidelity. Verify repo health + license before committing.
- Stack: React + TypeScript, Zustand for OS/window state, **CSS modules + custom-property theme tokens** (`tokens/themes.css`) for the visual-style engine, IndexedDB/OPFS for FS persistence, deploy to Cloudflare Pages / Vercel.

## The theming engine = msstyles, replicated (build it pack-driven)
Implement Display Properties → Appearance as the real style switcher. Ship 3 visual styles from `tokens/themes.css`: **bug.msstyles (dark, default)**, **Luna Blue** (factory/family layer), **Classic**. Switching is a working in-OS feature, persisted. This is also why "it's just one skin" holds — more styles can be added later. **Build the engine pack/manifest-driven + `border-image`-ready** (`docs/02` → Theming engine) so the deferred real-`.msstyles` loader (`docs/06`) drops in additively. Do not hard-code per-theme.

## Deferred (do NOT build now; stubs/hooks only)
- `trivia.exe` internals (no LLM; API questions + scripted bots + hand-written host line-bank) — its own spec later.
- The `\weird\` locked-folder payload (conspiracy/Easter-egg layer).
- System-sound pack.
- **Real-`.msstyles` theme loader/installer** (`docs/06`, Phase 5) — but build the theming engine pack/manifest-driven NOW (`docs/02`) so it's additive, not a rewrite.
- Real portfolio content — `WORK/`, résumé, about are **placeholder structure** the owner fills later.

## Read next
`docs/01-aesthetic.md` → `02-os-parity.md` → `03-content.md` → `04-assets-and-tooling.md` → `05-phases.md`. Log decisions in `DECISIONS.md`.
