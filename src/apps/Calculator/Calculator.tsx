import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppProps } from '../../os/types'
import styles from './Calculator.module.css'

// Classic Windows XP Calculator — Standard view.
// All arithmetic is handled by the CalcState machine below.

interface CalcState {
  display: string      // what's shown in the readout
  stored: number       // left-hand operand waiting for an operator
  pendingOp: string    // '+' '-' '*' '/'
  justEvaled: boolean  // true right after = so next digit starts fresh
  fresh: boolean       // true when the display can be overwritten by a digit
  memory: number
  error: boolean
}

function init(): CalcState {
  return {
    display: '0',
    stored: 0,
    pendingOp: '',
    justEvaled: false,
    fresh: true,
    memory: 0,
    error: false,
  }
}

function applyOp(op: string, a: number, b: number): { val: number; err: boolean } {
  switch (op) {
    case '+': return { val: a + b, err: false }
    case '-': return { val: a - b, err: false }
    case '*': return { val: a * b, err: false }
    case '/':
      if (b === 0) return { val: 0, err: true }
      return { val: a / b, err: false }
  }
  return { val: b, err: false }
}

function formatNum(n: number): string {
  // Keep precision but strip floating-point noise.
  const s = parseFloat(n.toPrecision(15)).toString()
  return s
}

type Action =
  | { type: 'digit'; key: string }
  | { type: 'dot' }
  | { type: 'op'; key: string }
  | { type: 'equals' }
  | { type: 'ce' }
  | { type: 'c' }
  | { type: 'back' }
  | { type: 'sign' }
  | { type: 'sqrt' }
  | { type: 'pct' }
  | { type: 'recip' }
  | { type: 'mc' }
  | { type: 'mr' }
  | { type: 'ms' }
  | { type: 'mplus' }

function reduce(s: CalcState, a: Action): CalcState {
  if (s.error && a.type !== 'c' && a.type !== 'ce') return s

  switch (a.type) {
    case 'digit': {
      if (s.fresh || s.justEvaled) {
        return { ...s, display: a.key, fresh: false, justEvaled: false }
      }
      if (s.display === '0') return { ...s, display: a.key }
      if (s.display.replace('-', '').replace('.', '').length >= 15) return s
      return { ...s, display: s.display + a.key }
    }
    case 'dot': {
      if (s.fresh || s.justEvaled) return { ...s, display: '0.', fresh: false, justEvaled: false }
      if (s.display.includes('.')) return s
      return { ...s, display: s.display + '.' }
    }
    case 'sign': {
      if (s.display === '0' || s.display === '0.') return s
      const toggled = s.display.startsWith('-') ? s.display.slice(1) : '-' + s.display
      return { ...s, display: toggled }
    }
    case 'op': {
      const cur = parseFloat(s.display)
      if (s.pendingOp && !s.fresh && !s.justEvaled) {
        const { val, err } = applyOp(s.pendingOp, s.stored, cur)
        if (err) return { ...s, display: 'Cannot divide by zero', error: true }
        return { ...s, display: formatNum(val), stored: val, pendingOp: a.key, fresh: true, justEvaled: false }
      }
      return { ...s, stored: cur, pendingOp: a.key, fresh: true, justEvaled: false }
    }
    case 'equals': {
      if (!s.pendingOp) return { ...s, justEvaled: true, fresh: true }
      const cur = parseFloat(s.display)
      const { val, err } = applyOp(s.pendingOp, s.stored, cur)
      if (err) return { ...s, display: 'Cannot divide by zero', error: true }
      return { ...s, display: formatNum(val), stored: val, pendingOp: '', justEvaled: true, fresh: true }
    }
    case 'ce':
      return { ...s, display: '0', fresh: true, error: false }
    case 'c':
      return { ...init(), memory: s.memory }
    case 'back': {
      if (s.fresh || s.justEvaled) return s
      if (s.display.length === 1 || (s.display.length === 2 && s.display.startsWith('-'))) {
        return { ...s, display: '0', fresh: true }
      }
      return { ...s, display: s.display.slice(0, -1) }
    }
    case 'sqrt': {
      const cur = parseFloat(s.display)
      if (cur < 0) return { ...s, display: 'Cannot take sqrt of negative', error: true }
      return { ...s, display: formatNum(Math.sqrt(cur)), fresh: true, justEvaled: true }
    }
    case 'pct': {
      // XP behaviour: compute % of stored if an operator is pending, else /100
      const cur = parseFloat(s.display)
      const base = s.pendingOp ? s.stored : 0
      const val = (base * cur) / 100
      return { ...s, display: formatNum(val), fresh: true }
    }
    case 'recip': {
      const cur = parseFloat(s.display)
      if (cur === 0) return { ...s, display: 'Cannot divide by zero', error: true }
      return { ...s, display: formatNum(1 / cur), fresh: true, justEvaled: true }
    }
    case 'mc':
      return { ...s, memory: 0 }
    case 'mr':
      return { ...s, display: formatNum(s.memory), fresh: true, justEvaled: true }
    case 'ms':
      return { ...s, memory: parseFloat(s.display), fresh: true }
    case 'mplus':
      return { ...s, memory: s.memory + parseFloat(s.display), fresh: true }
  }
}

export function Calculator({ winId: _winId, args: _args }: AppProps) {
  const [calc, setCalc] = useState<CalcState>(init)
  const dispatch = useCallback((a: Action) => setCalc((s) => reduce(s, a)), [])
  const rootRef = useRef<HTMLDivElement>(null)

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't steal from other inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); dispatch({ type: 'digit', key: e.key }) }
      else if (e.key === '.') { e.preventDefault(); dispatch({ type: 'dot' }) }
      else if (e.key === '+') { e.preventDefault(); dispatch({ type: 'op', key: '+' }) }
      else if (e.key === '-') { e.preventDefault(); dispatch({ type: 'op', key: '-' }) }
      else if (e.key === '*') { e.preventDefault(); dispatch({ type: 'op', key: '*' }) }
      else if (e.key === '/') { e.preventDefault(); dispatch({ type: 'op', key: '/' }) }
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); dispatch({ type: 'equals' }) }
      else if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'c' }) }
      else if (e.key === 'Backspace') { e.preventDefault(); dispatch({ type: 'back' }) }
      else if (e.key === 'Delete') { e.preventDefault(); dispatch({ type: 'ce' }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  const hasMemory = calc.memory !== 0

  return (
    <div className={styles.calc} ref={rootRef} tabIndex={-1}>
      {/* Display */}
      <div className={styles.display} aria-live="polite" aria-label="Calculator display">
        {calc.display}
      </div>

      {/* Memory row */}
      <div className={styles.memRow}>
        <button type="button" className={styles.memBtn} onClick={() => dispatch({ type: 'mc' })} disabled={!hasMemory}>MC</button>
        <button type="button" className={styles.memBtn} onClick={() => dispatch({ type: 'mr' })} disabled={!hasMemory}>MR</button>
        <button type="button" className={styles.memBtn} onClick={() => dispatch({ type: 'ms' })}>MS</button>
        <button type="button" className={styles.memBtn} onClick={() => dispatch({ type: 'mplus' })}>M+</button>
      </div>

      {/* Button grid — 4 columns matching XP Standard layout */}
      <div className={styles.grid}>
        {/* Row 1: Backspace, CE, C */}
        <button type="button" className={`${styles.btn} ${styles.action}`} onClick={() => dispatch({ type: 'back' })}>←</button>
        <button type="button" className={`${styles.btn} ${styles.action}`} onClick={() => dispatch({ type: 'ce' })}>CE</button>
        <button type="button" className={`${styles.btn} ${styles.action}`} onClick={() => dispatch({ type: 'c' })}>C</button>
        <button type="button" className={`${styles.btn} ${styles.op}`} onClick={() => dispatch({ type: 'recip' })}>1/x</button>

        {/* Row 2: 7 8 9 / */}
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'digit', key: '7' })}>7</button>
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'digit', key: '8' })}>8</button>
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'digit', key: '9' })}>9</button>
        <button type="button" className={`${styles.btn} ${styles.op}`} onClick={() => dispatch({ type: 'op', key: '/' })}>÷</button>

        {/* Row 3: 4 5 6 * */}
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'digit', key: '4' })}>4</button>
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'digit', key: '5' })}>5</button>
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'digit', key: '6' })}>6</button>
        <button type="button" className={`${styles.btn} ${styles.op}`} onClick={() => dispatch({ type: 'op', key: '*' })}>×</button>

        {/* Row 4: 1 2 3 - */}
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'digit', key: '1' })}>1</button>
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'digit', key: '2' })}>2</button>
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'digit', key: '3' })}>3</button>
        <button type="button" className={`${styles.btn} ${styles.op}`} onClick={() => dispatch({ type: 'op', key: '-' })}>−</button>

        {/* Row 5: +/- 0 . + */}
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'sign' })}>±</button>
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'digit', key: '0' })}>0</button>
        <button type="button" className={`${styles.btn} ${styles.num}`} onClick={() => dispatch({ type: 'dot' })}>.</button>
        <button type="button" className={`${styles.btn} ${styles.op}`} onClick={() => dispatch({ type: 'op', key: '+' })}>+</button>

        {/* Row 6: sqrt % (span 2) = */}
        <button type="button" className={`${styles.btn} ${styles.action}`} onClick={() => dispatch({ type: 'sqrt' })}>√</button>
        <button type="button" className={`${styles.btn} ${styles.action}`} onClick={() => dispatch({ type: 'pct' })}>%</button>
        <button type="button" className={`${styles.btn} ${styles.equals}`} onClick={() => dispatch({ type: 'equals' })} style={{ gridColumn: 'span 2' }}>=</button>
      </div>
    </div>
  )
}
