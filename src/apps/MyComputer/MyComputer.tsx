import { ComputerIcon } from '../../os/icons'
import styles from './MyComputer.module.css'

// Placeholder. The real Explorer over the virtual file system lands in Phase 2/3.
const ITEMS = ['Local Disk (C:)', '3½ Floppy (A:)', 'CD Drive (D:)', 'Control Panel']

export function MyComputer() {
  return (
    <div className={styles.win}>
      <div className={styles.menubar}>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Favorites</span>
        <span>Tools</span>
        <span>Help</span>
      </div>
      <div className={styles.address}>
        <span>Address</span>
        <div className={styles.addressbox}>My Computer</div>
      </div>
      <div className={styles.body}>
        {ITEMS.map((label) => (
          <div key={label} className={styles.item}>
            <ComputerIcon size={32} />
            <span className={styles.label}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
