import { useEffect, useMemo, useRef, useState } from 'react'
import { SimplePool, nip19 } from 'nostr-tools'
import {
  loadOrCreateIdentity, subscribeDMs, sendDM, toPubkey, shortNpub, RELAYS,
  type Identity, type DM,
} from './nostr'
import styles from './AIM.module.css'

// AOL Instant Messenger — now REAL (docs/08 Tier D · Messenger). Encrypted DMs
// over PUBLIC Nostr relays (NIP-04), with an automatic keypair created on first
// run. No backend of ours, no Cloudflare — it rides open relays. Your npub is
// your screen name; add a buddy by their npub. Styled as classic AIM.

interface Contact { pk: string; npub: string; nick: string }
const CONTACTS_KEY = 'hmd.nostr.contacts'

function loadContacts(): Contact[] {
  try { return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]') } catch { return [] }
}
function saveContacts(c: Contact[]) { localStorage.setItem(CONTACTS_KEY, JSON.stringify(c)) }

export function AIM() {
  const identity = useMemo<Identity>(() => loadOrCreateIdentity(), [])
  const poolRef = useRef<SimplePool>()
  if (!poolRef.current) poolRef.current = new SimplePool()

  const [contacts, setContacts] = useState<Contact[]>(loadContacts)
  const [selected, setSelected] = useState<string>('') // contact pk
  const [messages, setMessages] = useState<DM[]>([])
  const [draft, setDraft] = useState('')
  const [addInput, setAddInput] = useState('')
  const [addErr, setAddErr] = useState('')
  const [copied, setCopied] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  // Subscribe to the selected conversation.
  useEffect(() => {
    if (!selected) { setMessages([]); return }
    setMessages([])
    const pool = poolRef.current!
    const unsub = subscribeDMs(pool, identity, selected, (dm) => {
      setMessages((prev) => (prev.some((m) => m.id === dm.id) ? prev : [...prev, dm].sort((a, b) => a.ts - b.ts)))
    })
    return unsub
  }, [selected, identity])

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages])

  // Dispose the relay pool on unmount.
  useEffect(() => () => { try { poolRef.current?.close(RELAYS) } catch { /* ignore */ } }, [])

  function addBuddy() {
    const pk = toPubkey(addInput)
    if (!pk) { setAddErr('Enter a valid npub…'); return }
    if (pk === identity.pk) { setAddErr("That's you."); return }
    if (contacts.some((c) => c.pk === pk)) { setSelected(pk); setAddInput(''); return }
    const npub = nip19.npubEncode(pk)
    const next = [...contacts, { pk, npub, nick: shortNpub(npub) }]
    setContacts(next); saveContacts(next); setAddInput(''); setAddErr(''); setSelected(pk)
  }

  async function send() {
    const text = draft.trim()
    if (!text || !selected) return
    setDraft('')
    try { await sendDM(poolRef.current!, identity, selected, text) }
    catch { /* optimistic; relay may still take it */ }
  }

  function copyNpub() {
    navigator.clipboard?.writeText(identity.npub).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200) })
  }

  const current = contacts.find((c) => c.pk === selected)

  return (
    <div className={styles.aim}>
      <div className={styles.header}>
        <span className={styles.logo}>AOL Instant Messenger<span className={styles.tm}>™</span></span>
      </div>

      <div className={styles.me}>
        <span className={styles.meLabel}>Screen Name:</span>
        <span className={styles.meName} title={identity.npub}>{shortNpub(identity.npub)}</span>
        <button type="button" className={styles.copyBtn} onClick={copyNpub}>{copied ? 'copied!' : 'copy npub'}</button>
      </div>

      <div className={styles.body}>
        <div className={styles.buddyList}>
          <div className={styles.groupHead}>▼ Buddies ({contacts.length})</div>
          {contacts.length === 0 && <div className={styles.empty}>No buddies yet. Add one by npub below.</div>}
          {contacts.map((c) => (
            <button
              key={c.pk}
              type="button"
              className={`${styles.buddy} ${selected === c.pk ? styles.buddyActive : ''}`}
              onClick={() => setSelected(c.pk)}
              title={c.npub}
            >
              <span className={styles.dot} /> {c.nick}
            </button>
          ))}
          <div className={styles.addRow}>
            <input
              className={styles.addInput}
              placeholder="add buddy (npub1…)"
              value={addInput}
              spellCheck={false}
              onChange={(e) => { setAddInput(e.target.value); setAddErr('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') addBuddy() }}
            />
            <button type="button" className={styles.addBtn} onClick={addBuddy}>+</button>
          </div>
          {addErr && <div className={styles.addErr}>{addErr}</div>}
        </div>

        <div className={styles.chat}>
          {!current ? (
            <div className={styles.noChat}>
              Select a buddy, or add one by their <b>npub</b>.<br />
              Share your npub (above) so others can message you.
            </div>
          ) : (
            <>
              <div className={styles.chatHead}>{current.nick}</div>
              <div className={styles.log}>
                {messages.length === 0 && <div className={styles.logEmpty}>No messages yet. Say hi — it's end-to-end encrypted (NIP-04).</div>}
                {messages.map((m) => (
                  <div key={m.id} className={m.mine ? styles.rowMine : styles.rowThem}>
                    <span className={styles.who}>{m.mine ? 'me' : current.nick}:</span> <span className={styles.msg}>{m.text}</span>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form className={styles.sendRow} onSubmit={(e) => { e.preventDefault(); void send() }}>
                <input
                  className={styles.sendInput}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  aria-label="Message"
                />
                <button type="submit" className={styles.sendBtn}>Send</button>
              </form>
            </>
          )}
        </div>
      </div>
      <div className={styles.foot}>{RELAYS.length} relays · encrypted (NIP-04) · your keys stay in this browser</div>
    </div>
  )
}
