import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { elizaReply, ELIZA_GREETING } from './eliza'
import type { AppProps } from '../../os/types'
import styles from './Eliza.module.css'

// ELIZA (docs/08) — the classic 1966 therapist chatbot, ORIGINAL implementation,
// NO LLM. The named non-AI substitute for the AI Chat Agent. Runs entirely in the
// browser; nothing is sent anywhere.
interface Line { who: 'eliza' | 'you'; text: string }

export function Eliza(_props: AppProps) {
  const [lines, setLines] = useState<Line[]>([{ who: 'eliza', text: ELIZA_GREETING }])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [lines])

  function submit() {
    const text = input.trim()
    if (!text) return
    const reply = elizaReply(text)
    setLines((ls) => [...ls, { who: 'you', text }, { who: 'eliza', text: reply }])
    setInput('')
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) { if (e.key === 'Enter') submit() }

  return (
    <div className={styles.eliza} onMouseDown={() => inputRef.current?.focus()}>
      <div className={styles.screen}>
        {lines.map((l, i) => (
          <div key={i} className={l.who === 'eliza' ? styles.eli : styles.you}>
            <span className={styles.who}>{l.who === 'eliza' ? 'ELIZA' : 'YOU'}:</span> {l.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className={styles.prompt}>
        <span className={styles.caret}>&gt;</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          autoFocus
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          aria-label="Talk to ELIZA"
        />
      </div>
    </div>
  )
}
