import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useOS } from '../../os/store'
import type { AppProps } from '../../os/types'
import styles from './Bsod.module.css'

// BSOD easter egg (Tier 1, docs/08 — leak-and-hide flavor). A full-screen STOP
// screen portalled over everything; any key/click after a beat dismisses it.
// Diegetic (a real crash screen), never narrates the site (Rule 2). Original copy.
export function Bsod({ winId }: AppProps) {
  const closeWindow = useOS((s) => s.closeWindow)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!armed) return
    const dismiss = () => closeWindow(winId)
    window.addEventListener('keydown', dismiss)
    window.addEventListener('mousedown', dismiss)
    return () => {
      window.removeEventListener('keydown', dismiss)
      window.removeEventListener('mousedown', dismiss)
    }
  }, [armed, winId, closeWindow])

  return createPortal(
    <div className={styles.bsod} role="alertdialog" aria-label="A problem has been detected">
      <pre className={styles.text}>{`A problem has been detected and Windows has been shut down to prevent
damage to your computer.

UNEXPECTED_STORE_EXCEPTION

If this is the first time you've seen this Stop error screen,
restart your computer. If this screen appears again, follow
these steps:

Check to make sure any new hardware or software is properly installed.
If this is a new installation, ask your hardware or software manufacturer
for any updates you might need.

If problems continue, disable or remove any newly installed hardware
or software. Disable BIOS memory options such as caching or shadowing.

Technical information:

*** STOP: 0x000000F4 (0x00000003, 0x867C2A30, 0x867C2BA4, 0x805D2978)

*** moldmouth.sys - Address 805D2978 base at 805C1000, DateStamp 4d8e7b1c

Beginning dump of physical memory
Physical memory dump complete.
Contact your system administrator or technical support group for further
assistance.`}</pre>
      <div className={styles.hint}>{armed ? 'Press any key to continue _' : ''}</div>
    </div>,
    document.body,
  )
}
