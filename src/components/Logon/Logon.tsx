import { useOS } from '../../os/store'
import styles from './Logon.module.css'

// Account picker. Two accounts seed the palimpsest (the owner's handle + the
// inherited FAMILY account); both just log in for now. Felt, never narrated.
const ACCOUNTS = ['moldmouth', 'FAMILY']

export function Logon() {
  const login = useOS((s) => s.login)

  return (
    <div className={styles.screen}>
      <div className={`${styles.bar} ${styles.top}`} />
      <div className={styles.center}>
        <div className={styles.brand}>
          <div className={styles.brandName}>
            HARROW<span>·</span>HAUS
          </div>
        </div>
        <div className={styles.brandline} />
        <div className={styles.accounts}>
          {ACCOUNTS.map((a) => (
            <button key={a} type="button" className={styles.account} onClick={() => login(a)}>
              <span className={styles.avatar} aria-hidden="true" />
              <span className={styles.name}>{a}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={`${styles.bar} ${styles.bottom}`} />
    </div>
  )
}
