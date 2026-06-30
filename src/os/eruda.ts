// DevTools (docs/08 Tier B) — eruda (liriliri/eruda, MIT): a real in-page
// Console / Elements / Network / Resources panel, toggled with SHIFT+F12. Loaded
// lazily (its own chunk) only when first summoned, so it costs nothing until
// used. The floating entry button is hidden — the keystroke is the only door, so
// it stays a hidden DevTools rather than desktop chrome (Rule 2).
let loaded = false
let visible = false

export async function toggleDevTools(): Promise<void> {
  const eruda = (await import('eruda')).default
  if (!loaded) {
    eruda.init()
    loaded = true
    // Hide eruda's always-on floating button — SHIFT+F12 is the only entry.
    const btn = document.querySelector<HTMLElement>('.eruda-entry-btn')
    if (btn) btn.style.display = 'none'
  }
  visible = !visible
  if (visible) eruda.show()
  else eruda.hide()
}
