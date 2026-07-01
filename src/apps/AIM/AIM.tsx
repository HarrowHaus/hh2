import { useEffect, useMemo, useRef, useState } from 'react'
import { SimplePool, nip19 } from 'nostr-tools'
import {
  loadOrCreateIdentity, subscribeDMs, sendDM, toPubkey, shortNpub, RELAYS,
  type Identity, type DM,
} from './nostr'
import { BOT_BUDDIES, type BotBuddy, type BuddyStatus } from './bots'
import { getReply, type ChatTurn } from '../../os/botvoice'
import { hasWebGPU } from '../../os/webllm'
import { playSound } from '../../os/sound'
import styles from './AIM.module.css'

// AOL Instant Messenger — a real Nostr messenger skinned as AIM (docs/12 §2).
// Local BOT BUDDIES (driven by the §1 bot-voice service) make the list alive and
// chattable with zero network; real encrypted DMs (NIP-04) ride public relays for
// anyone you add by npub. Full AIM chrome: buddy groups, online/away/idle states
// with graying + "(Away)", working away auto-responses, typing indicator,
// timestamps, warning %, profile quote, and sign-on/off + IM sounds (silent seam).

interface Contact { pk: string; npub: string; nick: string }
interface Line { id: string; mine: boolean; text: string; ts: number }
type SelfStatus = 'online' | 'away' | 'invisible'

const CONTACTS_KEY = 'hmd.nostr.contacts'
const CONVO_KEY = 'hmd.aim.convos'
const CAVEAT_KEY = 'hmd.aim.caveat.v1'
const IDLE_MS = 5 * 60 * 1000

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
}
const hhmm = (ts: number) => { try { return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) } catch { return '' } }
const dot = (s: BuddyStatus) => (s === 'online' ? styles.dOn : s === 'away' ? styles.dAway : s === 'idle' ? styles.dIdle : styles.dOff)
const tag = (s: BuddyStatus) => (s === 'away' ? ' (Away)' : s === 'idle' ? ' (Idle)' : '')

export function AIM() {
  const identity = useMemo<Identity>(() => loadOrCreateIdentity(), [])
  const poolRef = useRef<SimplePool>()
  if (!poolRef.current) poolRef.current = new SimplePool()

  const [contacts, setContacts] = useState<Contact[]>(() => loadJSON<Contact[]>(CONTACTS_KEY, []))
  const [convos, setConvos] = useState<Record<string, Line[]>>(() => loadJSON<Record<string, Line[]>>(CONVO_KEY, {}))
  // selected key: `bot:<id>` or `pk:<hex>`
  const [selected, setSelected] = useState<string>('')
  const [nostrMsgs, setNostrMsgs] = useState<DM[]>([])
  const [draft, setDraft] = useState('')
  const [addInput, setAddInput] = useState('')
  const [addErr, setAddErr] = useState('')
  const [copied, setCopied] = useState('')
  const [typing, setTyping] = useState<string | null>(null)
  const [self, setSelf] = useState<SelfStatus>('online')
  const [idle, setIdle] = useState(false)
  const [awayMsg, setAwayMsg] = useState('I am away from the computer right now.')
  const [smart, setSmart] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [caveat, setCaveat] = useState(() => !localStorage.getItem(CAVEAT_KEY))
  const endRef = useRef<HTMLDivElement>(null)

  const selBot = selected.startsWith('bot:') ? BOT_BUDDIES.find((b) => b.id === selected.slice(4)) : undefined
  const selContact = selected.startsWith('pk:') ? contacts.find((c) => c.pk === selected.slice(3)) : undefined

  // Sign-on/off door sounds (silent until the Phase-8 pack fills the slots).
  useEffect(() => { playSound('aim-signon'); return () => playSound('aim-signoff') }, [])

  // Idle auto-status after inactivity (classic AIM). Any input resets it.
  useEffect(() => {
    let t = window.setTimeout(() => setIdle(true), IDLE_MS)
    const bump = () => { setIdle(false); clearTimeout(t); t = window.setTimeout(() => setIdle(true), IDLE_MS) }
    window.addEventListener('mousemove', bump)
    window.addEventListener('keydown', bump)
    return () => { clearTimeout(t); window.removeEventListener('mousemove', bump); window.removeEventListener('keydown', bump) }
  }, [])

  // Subscribe to a real contact's conversation over relays.
  useEffect(() => {
    if (!selContact) { setNostrMsgs([]); return }
    setNostrMsgs([])
    const unsub = subscribeDMs(poolRef.current!, identity, selContact.pk, (dm) => {
      setNostrMsgs((prev) => (prev.some((m) => m.id === dm.id) ? prev : [...prev, dm].sort((a, b) => a.ts - b.ts)))
      if (!dm.mine) playSound('aim-in')
    })
    return unsub
  }, [selContact, identity])

  useEffect(() => () => { try { poolRef.current?.close(RELAYS) } catch { /* ignore */ } }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [nostrMsgs, convos, typing, selected])

  function pushLine(botId: string, line: Line) {
    setConvos((prev) => {
      const next = { ...prev, [botId]: [...(prev[botId] ?? []), line] }
      try { localStorage.setItem(CONVO_KEY, JSON.stringify(next)) } catch { /* quota */ }
      return next
    })
  }

  const seq = useRef(0)
  const lineId = () => `l${Date.now().toString(36)}-${seq.current++}`

  async function sendToBot(bot: BotBuddy, text: string) {
    pushLine(bot.id, { id: lineId(), mine: true, text, ts: Date.now() })
    playSound('aim-out')
    // Away buddy → auto-response, no generation.
    if (bot.status === 'away' && bot.awayMessage) {
      window.setTimeout(() => {
        pushLine(bot.id, { id: lineId(), mine: false, text: `${bot.awayMessage}`, ts: Date.now() })
        playSound('aim-in')
      }, 600)
      return
    }
    setTyping(bot.id)
    const history: ChatTurn[] = (convos[bot.id] ?? []).slice(-8).map((l) => ({ role: l.mine ? 'user' : 'bot', text: l.text }))
    try {
      const reply = await getReply(bot, history, text, { useWebLLM: smart, allowHosted: true })
      pushLine(bot.id, { id: lineId(), mine: false, text: reply, ts: Date.now() })
      playSound('aim-in')
    } catch {
      pushLine(bot.id, { id: lineId(), mine: false, text: '…', ts: Date.now() })
    } finally {
      setTyping((t) => (t === bot.id ? null : t))
    }
  }

  async function send() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    if (selBot) { void sendToBot(selBot, text); return }
    if (selContact) {
      playSound('aim-out')
      try { await sendDM(poolRef.current!, identity, selContact.pk, text) } catch { /* optimistic */ }
    }
  }

  function openBot(bot: BotBuddy) {
    setSelected(`bot:${bot.id}`)
    // First open seeds the greeting so the window isn't empty.
    if (!(convos[bot.id]?.length)) pushLine(bot.id, { id: lineId(), mine: false, text: bot.greeting, ts: Date.now() })
  }

  function addBuddy() {
    const pk = toPubkey(addInput)
    if (!pk) { setAddErr('Enter a valid npub…'); return }
    if (pk === identity.pk) { setAddErr("That's you."); return }
    if (contacts.some((c) => c.pk === pk)) { setSelected(`pk:${pk}`); setAddInput(''); return }
    const npub = nip19.npubEncode(pk)
    const next = [...contacts, { pk, npub, nick: shortNpub(npub) }]
    setContacts(next); localStorage.setItem(CONTACTS_KEY, JSON.stringify(next))
    setAddInput(''); setAddErr(''); setSelected(`pk:${pk}`)
  }

  function copy(what: 'npub' | 'nsec') {
    const val = what === 'npub' ? identity.npub : identity.nsec
    navigator.clipboard?.writeText(val).then(() => { setCopied(what); setTimeout(() => setCopied(''), 1400) })
  }
  function dismissCaveat() { setCaveat(false); localStorage.setItem(CAVEAT_KEY, '1') }

  // Buddy groups: bots by their group + a "Contacts" group for real npubs.
  const groups = useMemo(() => {
    const g = new Map<string, { bots: BotBuddy[]; contacts: Contact[] }>()
    for (const b of BOT_BUDDIES) {
      const e = g.get(b.group) ?? { bots: [], contacts: [] }
      e.bots.push(b); g.set(b.group, e)
    }
    if (contacts.length) {
      const e = g.get('Contacts') ?? { bots: [], contacts: [] }
      e.contacts = contacts; g.set('Contacts', e)
    }
    return [...g.entries()]
  }, [contacts])

  const effSelf: BuddyStatus = self === 'invisible' ? 'offline' : idle && self === 'online' ? 'idle' : self
  const lines: Line[] = selBot ? (convos[selBot.id] ?? []) : nostrMsgs.map((m) => ({ id: m.id, mine: m.mine, text: m.text, ts: m.ts }))
  const headName = selBot ? selBot.screenname : selContact?.nick ?? ''

  return (
    <div className={styles.aim}>
      <div className={styles.header}>
        <span className={styles.logo}>AOL Instant Messenger<span className={styles.tm}>™</span></span>
      </div>

      <div className={styles.me}>
        <span className={`${styles.dot} ${dot(effSelf)}`} />
        <span className={styles.meName} title={identity.npub}>{shortNpub(identity.npub)}</span>
        <select className={styles.status} value={self} onChange={(e) => setSelf(e.target.value as SelfStatus)} aria-label="My status">
          <option value="online">Available</option>
          <option value="away">Away</option>
          <option value="invisible">Invisible</option>
        </select>
      </div>
      {self === 'away' && (
        <input className={styles.awayInput} value={awayMsg} onChange={(e) => setAwayMsg(e.target.value)} placeholder="Away message…" />
      )}

      {caveat && (
        <div className={styles.caveat}>
          Your screen name is a Nostr key made in this browser — fine for casual chat, not high-security.
          <div className={styles.caveatBtns}>
            <button type="button" onClick={() => copy('npub')}>{copied === 'npub' ? 'copied npub' : 'copy npub'}</button>
            <button type="button" onClick={() => copy('nsec')}>{copied === 'nsec' ? 'copied key!' : 'back up key'}</button>
            <button type="button" onClick={dismissCaveat}>OK</button>
          </div>
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.buddyList}>
          {groups.map(([name, e]) => {
            const all = [...e.bots, ...e.contacts]
            const online = e.bots.filter((b) => b.status === 'online').length + e.contacts.length
            const open = !collapsed.has(name)
            return (
              <div key={name}>
                <div className={styles.groupHead} onClick={() => setCollapsed((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n })}>
                  {open ? '▼' : '▶'} {name} <span className={styles.groupCount}>({online}/{all.length})</span>
                </div>
                {open && e.bots.map((b) => {
                  const key = `bot:${b.id}`
                  const away = b.status === 'away' || b.status === 'idle' || b.status === 'offline'
                  return (
                    <button key={key} type="button" className={`${styles.buddy} ${selected === key ? styles.buddyActive : ''} ${away ? styles.buddyAway : ''}`} onClick={() => openBot(b)} title={b.quote}>
                      <span className={`${styles.dot} ${dot(b.status)}`} /> {b.screenname}{tag(b.status)}
                    </button>
                  )
                })}
                {open && e.contacts.map((c) => {
                  const key = `pk:${c.pk}`
                  return (
                    <button key={key} type="button" className={`${styles.buddy} ${selected === key ? styles.buddyActive : ''}`} onClick={() => setSelected(key)} title={c.npub}>
                      <span className={`${styles.dot} ${styles.dOn}`} /> {c.nick}
                    </button>
                  )
                })}
              </div>
            )
          })}

          <div className={styles.addRow}>
            <input className={styles.addInput} placeholder="add buddy (npub1…)" value={addInput} spellCheck={false}
              onChange={(e) => { setAddInput(e.target.value); setAddErr('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') addBuddy() }} />
            <button type="button" className={styles.addBtn} onClick={addBuddy}>+</button>
          </div>
          {addErr && <div className={styles.addErr}>{addErr}</div>}
          {hasWebGPU() && (
            <label className={styles.smart} title="Use the on-device LLM for bot replies (one-time model download)">
              <input type="checkbox" checked={smart} onChange={(e) => setSmart(e.target.checked)} /> smarter bots (beta)
            </label>
          )}
        </div>

        <div className={styles.chat}>
          {!selBot && !selContact ? (
            <div className={styles.noChat}>
              Click a buddy to chat. The bots reply instantly (offline).<br />
              Add a real person by their <b>npub</b>; share yours to be reached.
            </div>
          ) : (
            <>
              <div className={styles.chatHead}>
                <span className={styles.chatWho}>{headName}</span>
                <span className={styles.warn}>Warning: 0%</span>
              </div>
              {selBot?.quote && <div className={styles.quote}>{selBot.quote}</div>}
              <div className={styles.log}>
                {lines.length === 0 && <div className={styles.logEmpty}>{selContact ? "No messages yet. Say hi — it's encrypted (NIP-04)." : 'Say something.'}</div>}
                {lines.map((m) => (
                  <div key={m.id} className={m.mine ? styles.rowMine : styles.rowThem}>
                    <span className={styles.who}>{m.mine ? 'me' : headName}</span>
                    <span className={styles.ts}>{hhmm(m.ts)}</span>
                    <div className={styles.msg}>{m.text}</div>
                  </div>
                ))}
                {typing && selBot?.id === typing && <div className={styles.typing}>{selBot.screenname} is typing…</div>}
                <div ref={endRef} />
              </div>
              <form className={styles.sendRow} onSubmit={(e) => { e.preventDefault(); void send() }}>
                <input className={styles.sendInput} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" aria-label="Message" />
                <button type="submit" className={styles.sendBtn}>Send</button>
              </form>
            </>
          )}
        </div>
      </div>
      <div className={styles.foot}>{RELAYS.length} relays · bots are local · encrypted DMs (NIP-04) · keys stay in this browser</div>
    </div>
  )
}
