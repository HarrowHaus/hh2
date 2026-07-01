import type { BotPersona } from '../../os/botvoice'

// Local bot buddies (docs/12 §2.2) — always-present accounts so a fresh visitor
// has someone to talk to instantly, even with zero network. Driven by the shared
// bot-voice service (§1): ELIZA by default (period-accurate for a 2003 AIM bot),
// WebLLM when the visitor opts in. They live alongside any real Nostr contacts
// and are visually identical in the list, but never touch a relay.
//
// In-voice, period-flavored characters from Bug's world (tape trading, the old
// net, horror/occult chatter). Functional and non-offensive (CLAUDE.md Rule 5).

export type BuddyStatus = 'online' | 'away' | 'idle' | 'offline' | 'invisible'

export interface BotBuddy extends BotPersona {
  screenname: string
  group: string
  /** AIM profile "quote" — the away-message-as-song-lyrics culture (Stratum A). */
  quote?: string
  /** If set, the bot is Away and messaging it returns this auto-response. */
  awayMessage?: string
  status: BuddyStatus
  greeting: string
}

export const BOT_BUDDIES: BotBuddy[] = [
  {
    id: 'tapehiss_kelly',
    screenname: 'tapehiss_kelly',
    name: 'tapehiss_kelly',
    group: 'Buddies',
    era: '2003',
    blurb: 'A noise/tape-trading friend who rips lossless, argues about transcodes, and mails CD-Rs.',
    quote: '"the hiss is the room, not the loss"',
    status: 'online',
    greeting: 'hey. you rip that comp yet or what',
  },
  {
    id: 'DialUpDoom',
    screenname: 'DialUpDoom',
    name: 'DialUpDoom',
    group: 'The Basement',
    era: '2003',
    blurb: 'An old-net/BBS relic who talks in warez-scene cadence and misses 56k.',
    quote: '"still seeding. good lad."',
    status: 'online',
    greeting: 'sup. hub is up, do not close it',
  },
  {
    id: 'grimwax',
    screenname: 'grimwax',
    name: 'grimwax',
    group: 'The Basement',
    era: '2003',
    blurb: 'The invite-tree friend — ratio police, cryptic, protective of the private trackers.',
    quote: '"one bad ratio climbs back up the tree to you"',
    awayMessage: 'afk — seeding. leave a message and do not leech and run.',
    status: 'away',
    greeting: 'you again. what do you need',
  },
  {
    id: 'MoltenMoth',
    screenname: 'MoltenMoth',
    name: 'MoltenMoth',
    group: 'Buddies',
    era: '2003',
    blurb: 'A horror/occult-podcast head who speaks in half-riddles about symbols and late-night radio.',
    quote: '"the numbers station changed its pattern again"',
    status: 'idle',
    greeting: 'you hear the 3am broadcast last night?',
  },
  {
    id: 'VHS_Reverend',
    screenname: 'VHS_Reverend',
    name: 'VHS_Reverend',
    group: 'Co-Workers',
    era: '2003',
    blurb: 'A giallo/VHS-rip evangelist who rates films by how ugly the transfer is.',
    quote: '"the uglier the transfer the holier the film"',
    status: 'online',
    greeting: 'got a PAL rip you have to see. tracking lines and all',
  },
  {
    id: 'helperbot9000',
    screenname: 'helperbot9000',
    name: 'helperbot9000',
    group: 'Buddies',
    era: '2003',
    blurb: 'A clunky early instant-messenger helper bot — eager, a little robotic, offers "facts".',
    quote: '"ask me something! (results may vary)"',
    status: 'online',
    greeting: 'HELLO! i am helperbot9000. ask me anything and i will TRY my best!',
  },
]

export const BOT_IDS = new Set(BOT_BUDDIES.map((b) => b.id))
