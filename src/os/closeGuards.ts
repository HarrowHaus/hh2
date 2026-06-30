// Window close guards (OS-subsystem parity) — lets an app intercept its window's
// close to prompt about unsaved work, like a real OS. An app registers a guard
// for its window id; when the user clicks Close (title bar X or window context
// menu), the WM runs the guard first.
//
// A guard receives `proceed` (call it to actually close) and returns:
//   true  → "I've taken over" (the WM should NOT close now; the guard will call
//           proceed() itself once the user has saved/discarded).
//   false → nothing to confirm; the WM closes immediately.
// Guards live outside the persisted store (they hold live functions).
export type CloseGuard = (proceed: () => void) => boolean

const guards = new Map<number, CloseGuard>()

export function registerCloseGuard(id: number, guard: CloseGuard): void {
  guards.set(id, guard)
}
export function unregisterCloseGuard(id: number): void {
  guards.delete(id)
}

// Returns true if the guard handled it (close deferred); false → caller closes now.
export function runCloseGuard(id: number, proceed: () => void): boolean {
  const guard = guards.get(id)
  if (!guard) return false
  try {
    return guard(proceed)
  } catch {
    return false // a broken guard must never trap the window open
  }
}
