// Nostr messaging core for the real AIM (docs/08 Tier D · Messenger). Real
// encrypted DMs over PUBLIC Nostr relays — no backend of ours, no Cloudflare.
// Automatic keypair creation (persisted in localStorage) + NIP-04 encrypted
// direct messages (kind 4). nostr-tools (MIT) does the crypto/relay work.
import { SimplePool, generateSecretKey, getPublicKey, finalizeEvent, nip04, nip19 } from 'nostr-tools'

// A small set of open public relays. WebSockets aren't subject to CORS, so these
// work straight from the browser.
export const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr.wine',
]

const SK_KEY = 'hmd.nostr.sk'

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}
function hexToBytes(h: string): Uint8Array {
  const out = new Uint8Array(h.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  return out
}

export interface Identity {
  sk: Uint8Array
  pk: string
  npub: string
  nsec: string
}

// Load the persisted identity or create + persist a fresh keypair on first run.
export function loadOrCreateIdentity(): Identity {
  let hex = localStorage.getItem(SK_KEY)
  let sk: Uint8Array
  if (hex && /^[0-9a-f]{64}$/i.test(hex)) sk = hexToBytes(hex)
  else {
    sk = generateSecretKey()
    localStorage.setItem(SK_KEY, bytesToHex(sk))
  }
  const pk = getPublicKey(sk)
  return { sk, pk, npub: nip19.npubEncode(pk), nsec: nip19.nsecEncode(sk) }
}

/** Resolve an npub (or hex) to a 64-char hex pubkey, or null if invalid. */
export function toPubkey(input: string): string | null {
  const s = input.trim()
  if (/^[0-9a-f]{64}$/i.test(s)) return s.toLowerCase()
  try {
    const { type, data } = nip19.decode(s)
    if (type === 'npub' && typeof data === 'string') return data
  } catch { /* invalid */ }
  return null
}

export const shortNpub = (npub: string): string => (npub.length > 16 ? `${npub.slice(0, 10)}…${npub.slice(-4)}` : npub)

export interface DM {
  id: string
  from: string // pubkey
  to: string // pubkey
  text: string
  ts: number
  mine: boolean
}

// Live DM conversation between me and a contact. Subscribes both directions,
// decrypts NIP-04, and calls onMessage for each. Returns an unsubscribe fn.
export function subscribeDMs(
  pool: SimplePool,
  self: Identity,
  contactPk: string,
  onMessage: (dm: DM) => void,
): () => void {
  // One filter that captures both directions of the conversation (author is
  // me-or-them AND p-tagged to me-or-them); the decrypt step drops anything else.
  const sub = pool.subscribeMany(
    RELAYS,
    { kinds: [4], authors: [self.pk, contactPk], '#p': [self.pk, contactPk] },
    {
      onevent: async (evt) => {
        const mine = evt.pubkey === self.pk
        // Decrypt with the *other* party's key.
        const other = mine ? contactPk : evt.pubkey
        try {
          const text = await nip04.decrypt(self.sk, other, evt.content)
          onMessage({
            id: evt.id,
            from: evt.pubkey,
            to: mine ? contactPk : self.pk,
            text,
            ts: evt.created_at * 1000,
            mine,
          })
        } catch { /* not for us / undecryptable */ }
      },
    },
  )
  return () => sub.close()
}

// Encrypt + publish a NIP-04 DM to a contact. Resolves when at least one relay
// accepts it.
export async function sendDM(pool: SimplePool, self: Identity, toPk: string, text: string): Promise<void> {
  const content = await nip04.encrypt(self.sk, toPk, text)
  const evt = finalizeEvent(
    { kind: 4, created_at: Math.floor(Date.now() / 1000), tags: [['p', toPk]], content },
    self.sk,
  )
  await Promise.any(pool.publish(RELAYS, evt))
}
