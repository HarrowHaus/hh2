import { useEffect, useRef, useState } from 'react'
import { hasPromptAPI, promptAPIReady, promptAPIAsk } from '../../os/promptapi'
import { hasWebGPU, webLLMChat, type LLMProgress } from '../../os/webllm'
import { elizaReply } from '../Eliza/eliza'
import type { AppProps } from '../../os/types'
import styles from './AIChat.module.css'

// AI Chat Agent (docs/12 §1.1) — a fully in-browser / on-device assistant, $0,
// no paid API ever. Engine priority: Chrome Prompt API (Gemini Nano) → WebLLM
// (WebGPU, opt-in ~1GB download) → ELIZA (always-on floor). Actions: chat +
// Summarize. (Image generation via WebSD lands in the next Section-4 step.)

type Engine = 'promptapi' | 'webllm' | 'eliza'
interface Msg { role: 'user' | 'bot'; text: string }

const CHAT_SYSTEM = 'You are a helpful, friendly assistant living inside a retro desktop. Answer concisely.'
const SUMMARY_SYSTEM = 'You are a concise summarizer. Summarize the user text in 2–4 plain sentences.'

export function AIChat(_props: AppProps) {
  const [engine, setEngine] = useState<Engine>('eliza')
  const [promptReady, setPromptReady] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'bot', text: 'Hi — I run entirely in your browser, no server. Ask me anything.' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [dl, setDl] = useState<LLMProgress | null>(null)
  const [summarize, setSummarize] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Pick the best available engine on mount (Prompt API wins if a model is ready).
  useEffect(() => {
    let alive = true
    void (async () => {
      if (hasPromptAPI() && (await promptAPIReady())) {
        if (alive) { setPromptReady(true); setEngine('promptapi') }
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [msgs, dl])

  async function enableWebLLM() {
    if (!hasWebGPU()) return
    setDl({ text: 'Starting…', progress: 0 })
    try {
      await webLLMChat([{ role: 'user', content: 'hi' }], { maxTokens: 1, onProgress: (p) => setDl(p) })
      setEngine('webllm')
      setDl(null)
      setMsgs((m) => [...m, { role: 'bot', text: 'Local AI loaded. Chatting on-device now.' }])
    } catch {
      setDl(null)
      setMsgs((m) => [...m, { role: 'bot', text: "Couldn't load the local model. Staying on the basic chat." }])
    }
  }

  async function ask(text: string): Promise<string> {
    const wantSummary = summarize
    const system = wantSummary ? SUMMARY_SYSTEM : CHAT_SYSTEM
    const prompt = wantSummary ? `Summarize the following:\n\n${text}` : text
    if (engine === 'promptapi') return promptAPIAsk(prompt, system)
    if (engine === 'webllm') {
      const history = msgs.slice(-8).map((m) => ({ role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text }))
      return (await webLLMChat([{ role: 'system', content: system }, ...history, { role: 'user', content: prompt }], { maxTokens: 400 })).trim()
    }
    // ELIZA floor — can chat, can't truly summarize.
    return wantSummary
      ? 'Summarizing needs the smarter model — enable Local AI (WebGPU) above.'
      : elizaReply(text)
  }

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setMsgs((m) => [...m, { role: 'user', text }])
    setBusy(true)
    try {
      const reply = await ask(text)
      setMsgs((m) => [...m, { role: 'bot', text: reply || '…' }])
    } catch {
      setMsgs((m) => [...m, { role: 'bot', text: 'Something went wrong answering that.' }])
    } finally {
      setBusy(false)
      setSummarize(false)
    }
  }

  const engineLabel =
    engine === 'promptapi' ? 'Gemini Nano (on-device)' : engine === 'webllm' ? 'Local LLM (WebGPU)' : 'Basic (ELIZA)'
  const canWebLLM = hasWebGPU() && engine !== 'webllm' && !promptReady

  return (
    <div className={styles.chat}>
      <div className={styles.bar}>
        <span className={styles.engine} title="Everything runs in your browser — $0, no server.">{engineLabel}</span>
        {canWebLLM && !dl && (
          <button type="button" className={styles.enable} onClick={() => void enableWebLLM()}>
            Enable Local AI (~1&nbsp;GB)
          </button>
        )}
      </div>

      <div className={styles.log} ref={scrollRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.user : styles.bot}`}>
            <span className={styles.bubble}>{m.text}</span>
          </div>
        ))}
        {busy && <div className={`${styles.msg} ${styles.bot}`}><span className={styles.bubble}>…</span></div>}
        {dl && (
          <div className={styles.dl}>
            <div className={styles.dlText}>{dl.text}</div>
            <div className={styles.dlBar}><div className={styles.dlFill} style={{ width: `${Math.round(dl.progress * 100)}%` }} /></div>
          </div>
        )}
      </div>

      <div className={styles.composer}>
        <button
          type="button"
          className={`${styles.mode} ${summarize ? styles.modeOn : ''}`}
          title="Summarize the next message instead of chatting"
          onClick={() => setSummarize((s) => !s)}
        >
          Summarize
        </button>
        <textarea
          className={styles.input}
          value={input}
          placeholder={summarize ? 'Paste text to summarize…' : 'Message'}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
          rows={2}
        />
        <button type="button" className={styles.send} disabled={busy} onClick={() => void send()}>Send</button>
      </div>
    </div>
  )
}
