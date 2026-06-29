import { Taskbar } from '../Taskbar/Taskbar'
import styles from './Desktop.module.css'

// Bare desktop: wallpaper + taskbar. The window/icon layers register here in
// later phases; for now it just proves the machine boots onto a desktop.
export function Desktop() {
  return (
    <main className={styles.desktop} aria-label="Desktop">
      <div className={styles.surface} />
      <Taskbar />
    </main>
  )
}
