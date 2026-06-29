# hh2 — THE HAND-ME-DOWN

A browser-based, **1:1 Windows XP desktop** (parity target: daedalOS) that is a personal portfolio-OS. It boots straight onto a desktop wearing a **dark, scene-kid `.msstyles` skin**, with Luna and Classic switchable through a real Display Properties panel. The owner's taste (grindcore/noise labels, horror, 90s games, weird knowledge) lives in the *content and customization layer*, never in on-screen narration.

**Read `CLAUDE.md` first.** It is the operating brief and contains the hard rules. Then read `docs/` in order.

## Repo map
```
CLAUDE.md                 ← operating brief (READ FIRST)
DECISIONS.md              ← log every non-obvious build decision here
docs/01-aesthetic.md      ← the locked look (XP + dark msstyle)
docs/02-os-parity.md      ← the daedalOS-parity floor + base repo + stack
docs/03-content.md        ← apps/folders/files + the music pillar + copy rules
docs/04-assets-and-tooling.md ← SVG/asset pipeline, MCP servers, sub-agents
docs/05-phases.md         ← build phases as agent-ready tickets
docs/06-real-theme-engine.md ← DEFERRED (Phase 5): load real .msstyles files
docs/07-period-strata.md  ← content bible: niche-culture artifacts by time-stratum
data/discography.json     ← real band catalog (music pillar data)
tokens/themes.css         ← the 3 visual-style token sets (dark/luna/classic)
```

## Git quickstart — create + push this handoff to a NEW GitHub repo
Run from the package root. Windows (PowerShell or Git Bash).

**Option A — GitHub CLI (easiest):**
```powershell
cd c:/changers/hh2
git init
git add -A
git commit -m "chore: initial handoff"
gh repo create hh2 --private --source=. --remote=origin --push
```

**Option B — no gh (create the empty repo on github.com first, no README):**
```powershell
cd c:/changers/hh2
git init
git branch -M main
git add -A
git commit -m "chore: initial handoff"
git remote add origin https://github.com/YOUR_USERNAME/hh2.git
git push -u origin main
```

After this, point Claude Code at the repo. It commits straight to `main` from then on (see `CLAUDE.md` → Git rules).
