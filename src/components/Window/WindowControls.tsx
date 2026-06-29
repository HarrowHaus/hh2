import styles from './WindowControls.module.css'

interface Props {
  maximized: boolean
  resizable: boolean
  onMinimize: () => void
  onToggleMaximize: () => void
  onClose: () => void
}

// XP title-bar controls: minimize / maximize(restore) / close.
export function WindowControls({ maximized, resizable, onMinimize, onToggleMaximize, onClose }: Props) {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        aria-label="Minimize"
        className={`${styles.btn} ${styles.min}`}
        onClick={onMinimize}
      />
      <button
        type="button"
        aria-label={maximized ? 'Restore' : 'Maximize'}
        className={`${styles.btn} ${maximized ? styles.restore : styles.max} ${
          resizable ? '' : styles.disabled
        }`}
        onClick={resizable ? onToggleMaximize : undefined}
      />
      <button
        type="button"
        aria-label="Close"
        className={`${styles.btn} ${styles.close}`}
        onClick={onClose}
      />
    </div>
  )
}
