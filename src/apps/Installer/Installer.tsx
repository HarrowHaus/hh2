import { useEffect, useMemo, useState } from 'react'
import { useOS } from '../../os/store'
import { baseName } from '../../os/fs/path'
import type { AppProps } from '../../os/types'
import styles from './Installer.module.css'

// The fake-installer gag (docs/03, manifest item 1). A diorama of 2004-era
// codec-pack setup: a next-next-finish wizard whose "components" page is
// pre-checked with the period's notorious co-installed adware (Bonzi, Gator,
// Hotbar, Comet Cursor...). NON-FUNCTIONAL — nothing is installed, no payload,
// no real software; the joke is the toolbar count on the finish screen. Inert.

// Real product display names, keyed by a substring of the .exe filename. Falls
// back to the raw stem so unknown codec props still read as a setup wizard.
const PRODUCTS: [test: RegExp, name: string][] = [
  [/cccp/i, 'Combined Community Codec Pack'],
  [/k-?lite/i, 'K-Lite Mega Codec Pack'],
  [/ffdshow/i, 'ffdshow (DirectShow filters)'],
  [/divx.*pro.*crack|divx_pro/i, 'DivX Pro 6 (FREE)'],
  [/divx/i, 'DivX 5.1.1 Bundle'],
  [/xvid/i, 'XviD MPEG-4 Codec'],
  [/vobsub|vsfilter/i, 'VobSub / VSFilter'],
  [/haali/i, 'Haali Media Splitter'],
  [/ac3filter/i, 'AC3Filter'],
  [/real.?alt/i, 'Real Alternative'],
  [/nimo/i, 'Nimo Codec Pack 5.0'],
  [/megapack|codec_megapack/i, 'Codec MegaPack 2005 FINAL'],
  [/kazaa/i, 'KaZaA Codec Pack'],
]

function productName(file: string): string {
  for (const [test, name] of PRODUCTS) if (test.test(file)) return name
  // Strip extension + version cruft for a passable title.
  return baseName(file).replace(/\.exe$/i, '').replace(/[._-]+/g, ' ').trim()
}

// The era's co-installed adware. Pre-checked "(Recommended)" — the whole joke.
// Names only; none of it exists or does anything.
interface Bundle {
  id: string
  label: string
  blurb: string
}
const BUNDLES: Bundle[] = [
  { id: 'bonzi', label: 'BonziBUDDY', blurb: 'Your friendly purple desktop companion' },
  { id: 'gator', label: 'Gator eWallet (GAIN)', blurb: 'Fills in forms automatically' },
  { id: 'hotbar', label: 'Hotbar Smiley Toolbar', blurb: '1,000+ smileys for your e-mail' },
  { id: 'comet', label: 'Comet Cursor', blurb: 'Animated mouse pointers' },
  { id: 'weatherbug', label: 'WeatherBug Desktop', blurb: 'Live local weather in your tray' },
  { id: 'mywebsearch', label: 'MyWebSearch Speedbar', blurb: 'Search the web faster' },
  { id: 'xupiter', label: 'Xupiter Toolbar', blurb: 'Sets your home page for you' },
  { id: 'savenow', label: 'WhenU SaveNow', blurb: 'Coupons while you shop' },
]

type Step = 'welcome' | 'license' | 'components' | 'installing' | 'finish'
const ORDER: Step[] = ['welcome', 'license', 'components', 'installing', 'finish']

export function Installer({ winId, args }: AppProps) {
  const path = (args?.path as string) || (args?.title as string) || 'setup.exe'
  const product = useMemo(() => productName(path), [path])
  const sketchy = /do_not_open|crack|no_virus|free|keygen/i.test(path)

  const closeWindow = useOS((s) => s.closeWindow)
  const setWindowTitle = useOS((s) => s.setWindowTitle)

  const [step, setStep] = useState<Step>('welcome')
  const [accepted, setAccepted] = useState(false)
  const [checked, setChecked] = useState<Record<string, boolean>>(
    () => Object.fromEntries(BUNDLES.map((b) => [b.id, true])),
  )
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setWindowTitle(winId, `${product} - InstallShield Wizard`)
  }, [winId, product, setWindowTitle])

  // Drive the fake progress bar while on the installing step.
  useEffect(() => {
    if (step !== 'installing') return
    setProgress(0)
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t)
          setStep('finish')
          return 100
        }
        return Math.min(100, p + 4 + Math.floor(p / 25))
      })
    }, 90)
    return () => clearInterval(t)
  }, [step])

  const idx = ORDER.indexOf(step)
  const installedCount = BUNDLES.filter((b) => checked[b.id]).length
  // The punchline scales with how much bundleware survived the wizard.
  const toolbars = installedCount * 2 + (sketchy ? 5 : 0)

  const next = () => setStep(ORDER[Math.min(ORDER.length - 1, idx + 1)])
  const back = () => setStep(ORDER[Math.max(0, idx - 1)])

  const canNext =
    step === 'license' ? accepted : step !== 'installing' && step !== 'finish'

  return (
    <div className={styles.wiz}>
      <div className={styles.body}>
        {/* Left banner rail, the classic InstallShield blue gradient. */}
        <div className={styles.rail} aria-hidden="true">
          <div className={styles.railArt}>
            <div className={styles.cd} />
          </div>
        </div>

        <div className={styles.content}>
          {step === 'welcome' && (
            <>
              <h2 className={styles.h2}>Welcome to the {product} Setup Wizard</h2>
              <p>
                This wizard will install <b>{product}</b> on your computer. It is strongly
                recommended that you close all other applications before continuing.
              </p>
              <p className={styles.dim}>
                Click Next to continue, or Cancel to exit Setup.
              </p>
            </>
          )}

          {step === 'license' && (
            <>
              <h3 className={styles.h3}>License Agreement</h3>
              <p className={styles.dim}>Please read the following agreement carefully.</p>
              <div className={styles.license}>
                END USER LICENSE AGREEMENT{'\n\n'}
                THIS SOFTWARE IS PROVIDED "AS IS" WITH NO WARRANTY OF ANY KIND. By
                installing, you agree to receive offers from our trusted partners and
                you acknowledge that some components may change your home page, your
                default search provider, and your will to live.{'\n\n'}
                Do not install two codec packs at the same time. We are not
                responsible for what happens to your DirectShow filter merits. You
                were warned in the readme that you did not read.
              </div>
              <label className={styles.accept}>
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                I accept the terms in the License Agreement
              </label>
            </>
          )}

          {step === 'components' && (
            <>
              <h3 className={styles.h3}>Choose Components</h3>
              <p className={styles.dim}>
                Select additional components to install with {product}:
              </p>
              <div className={styles.bundles}>
                {BUNDLES.map((b) => (
                  <label key={b.id} className={styles.bundle}>
                    <input
                      type="checkbox"
                      checked={!!checked[b.id]}
                      onChange={(e) =>
                        setChecked((c) => ({ ...c, [b.id]: e.target.checked }))
                      }
                    />
                    <span className={styles.bundleName}>
                      {b.label} <span className={styles.rec}>(Recommended)</span>
                    </span>
                    <span className={styles.bundleBlurb}>{b.blurb}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 'installing' && (
            <>
              <h3 className={styles.h3}>Installing</h3>
              <p className={styles.dim}>
                Please wait while Setup installs {product} and your selected components.
              </p>
              <div className={styles.progressWrap}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <div className={styles.progressNum}>{progress}%</div>
              </div>
              <p className={styles.statusLine}>
                {progress < 100
                  ? `Registering filters and "free" extras…`
                  : 'Finishing up…'}
              </p>
            </>
          )}

          {step === 'finish' && (
            <>
              <h2 className={styles.h2}>Setup Complete</h2>
              <p>
                {product} has been installed on your computer.
              </p>
              <ul className={styles.summary}>
                <li>{product} — installed</li>
                {BUNDLES.filter((b) => checked[b.id]).map((b) => (
                  <li key={b.id} className={styles.dim}>{b.label} — installed</li>
                ))}
                <li className={styles.punch}>{toolbars} toolbars installed.</li>
              </ul>
              <p className={styles.dim}>
                Your home page has been changed. Click Finish to exit Setup.
              </p>
            </>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.steps}>
          {ORDER.map((s) => (
            <span key={s} className={`${styles.dot} ${s === step ? styles.dotOn : ''}`} />
          ))}
        </div>
        <div className={styles.btns}>
          <button
            type="button"
            className={styles.btn}
            onClick={back}
            disabled={idx === 0 || step === 'installing' || step === 'finish'}
          >
            &lt; Back
          </button>
          {step === 'finish' ? (
            <button type="button" className={styles.btn} onClick={() => closeWindow(winId)}>
              Finish
            </button>
          ) : (
            <button type="button" className={styles.btn} onClick={next} disabled={!canNext}>
              {step === 'components' ? 'Install' : 'Next >'}
            </button>
          )}
          <button type="button" className={styles.btn} onClick={() => closeWindow(winId)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
