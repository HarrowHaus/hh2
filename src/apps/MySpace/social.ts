import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '../../os/fs/idb'
import type { BotPersona } from '../../os/botvoice'

// Local MySpace (docs/12 §3) — a self-contained 2005–07 social network. Modeled
// on the data/layout of superswan/anyspace (open-source MySpace clone; studied,
// NOT ported — credited in CREDITS.md). Everything is local + persisted to
// IndexedDB behind a SocialStore interface so a Nostr-backed impl can replace it
// later without a UI rewrite. Bot profiles are driven by the §1 bot-voice service.

export interface Profile {
  id: string
  name: string
  tagline: string
  mood?: string
  about: string
  meet?: string
  interests: string
  pic?: string
  background?: string
  song?: string
  songTitle?: string
  css?: string
  top8: string[]
  views: number
  online?: boolean
  bot?: boolean
  /** Persona seed for bot replies (bots only). */
  persona?: BotPersona
}
export interface Comment { id: string; profileId: string; authorId: string; text: string; ts: number }
export interface Bulletin { id: string; authorId: string; subject: string; body: string; ts: number }
export interface BlogPost { id: string; authorId: string; title: string; body: string; ts: number }

// The seam: the UI depends only on this shape. Local (IndexedDB) impl now; a
// Nostr-backed impl can drop in later without touching the components.
export interface SocialStore {
  meId: string
  profiles: Record<string, Profile>
  comments: Comment[]
  bulletins: Bulletin[]
  blog: BlogPost[]
  saveProfile: (p: Partial<Profile> & { id: string }) => void
  addComment: (profileId: string, authorId: string, text: string) => void
  addBulletin: (authorId: string, subject: string, body: string) => void
  addBlog: (authorId: string, title: string, body: string) => void
  bumpViews: (id: string) => void
}

// Deterministic gradient avatar (no lifted assets).
function avatar(seed: string): string {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360
  const initials = (seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2) || '??').toUpperCase()
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${h},55%,45%)"/><stop offset="1" stop-color="hsl(${(h + 45) % 360},55%,22%)"/>` +
    `</linearGradient></defs><rect width="80" height="80" fill="url(#g)"/>` +
    `<text x="40" y="52" font-size="34" fill="#fff" text-anchor="middle" font-family="Verdana,sans-serif" font-weight="bold">${initials}</text></svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const persona = (id: string, name: string, blurb: string): BotPersona => ({ id, name, blurb, era: '2006' })

// A glittery custom-CSS sample so the paste-your-CSS feature is visible on a couple
// of profiles (SpaceHey-style). Scoped to the profile card iframe, so it's safe.
const GLITTER_CSS =
  'body{background:#0a0010;color:#ffb3f0;font-family:"Comic Sans MS",Verdana}' +
  'h1,h2{color:#7CFC00;text-shadow:0 0 6px #39ff14}a{color:#66d9ff}' +
  '.card{border:2px dashed #ff33cc;background:#12001a}'

const NOISE_CSS =
  'body{background:#0b0b0b;color:#d8d8d8;font-family:Courier New,monospace}' +
  'h1,h2{color:#c0392b;letter-spacing:2px}.card{border:1px solid #333;background:#111}'

function seed(): Pick<SocialStore, 'meId' | 'profiles' | 'comments' | 'bulletins' | 'blog'> {
  const now = Date.now()
  const ago = (mins: number) => now - mins * 60000

  const bots: Profile[] = [
    {
      id: 'tapehiss_kelly', name: 'tapehiss_kelly', tagline: 'the hiss is the room, not the loss',
      mood: 'crate-digging', about: 'i rip lossless and mail CD-Rs to strangers. do not send me a 320 and call it a FLAC.',
      meet: 'anyone with a Dead Snakes live tape.', interests: 'noise, tape trading, EAC logs, TDK CD-Rs',
      pic: avatar('tapehiss'), top8: [], views: 4211, online: true, bot: true, persona: persona('tapehiss_kelly', 'tapehiss_kelly', 'A noise/tape-trading friend who rips lossless and argues about transcodes.'),
    },
    {
      id: 'DialUpDoom', name: 'DialUpDoom', tagline: 'still seeding. good lad.',
      mood: 'nostalgic', about: 'i remember when the whole scene fit on a 56k line. hub is up, do not close it.',
      meet: 'sysops and couriers.', interests: 'BBS, warez scene, ANSI art, dial-up', css: NOISE_CSS,
      pic: avatar('dialup'), top8: [], views: 9031, online: true, bot: true, persona: persona('DialUpDoom', 'DialUpDoom', 'An old-net/BBS relic who talks in warez-scene cadence and misses 56k.'),
    },
    {
      id: 'grimwax', name: 'grimwax', tagline: 'one bad ratio climbs back up the tree to you',
      mood: 'suspicious', about: 'ratio police. i vouched for you once. do not make me regret it.',
      meet: 'people who seed.', interests: 'private trackers, FLAC, spectral analysis',
      pic: avatar('grimwax'), top8: [], views: 1337, online: false, bot: true, persona: persona('grimwax', 'grimwax', 'The invite-tree friend — ratio police, cryptic, protective of private trackers.'),
    },
    {
      id: 'MoltenMoth', name: 'MoltenMoth', tagline: 'the numbers station changed its pattern again',
      mood: 'awake at 3am', about: 'i listen to shortwave and read the threads that 404 by morning.',
      meet: 'the person on the other end of 4625 kHz.', interests: 'occult, shortwave, conspiracy podcasts, moths', css: GLITTER_CSS,
      pic: avatar('moltenmoth'), top8: [], views: 666, online: true, bot: true, persona: persona('MoltenMoth', 'MoltenMoth', 'A horror/occult-podcast head who speaks in half-riddles about symbols and late-night radio.'),
    },
    {
      id: 'VHS_Reverend', name: 'VHS_Reverend', tagline: 'the uglier the transfer the holier the film',
      mood: 'reverent', about: 'i keep the church of the bad transfer. tracking lines are stigmata.',
      meet: 'giallo heads and video store survivors.', interests: 'giallo, VHS, horror, ex-rental tapes',
      pic: avatar('vhsrev'), top8: [], views: 2013, online: true, bot: true, persona: persona('VHS_Reverend', 'VHS_Reverend', 'A giallo/VHS-rip evangelist who rates films by how ugly the transfer is.'),
    },
    {
      id: 'helperbot9000', name: 'helperbot9000', tagline: 'ask me something! (results may vary)',
      mood: 'eager', about: 'HELLO! i am a friendly helper bot. i know FACTS. some of them are TRUE!',
      meet: 'users with QUESTIONS.', interests: 'answering, beeping, being helpful',
      pic: avatar('helperbot'), top8: [], views: 100000, online: true, bot: true, persona: persona('helperbot9000', 'helperbot9000', 'A clunky early instant-messenger helper bot — eager, robotic, offers facts.'),
    },
    {
      id: 'moldmouth', name: 'Moldmouth', tagline: 'basement noise since 2005',
      mood: 'feedback', about: 'three tracks, one demo, forty CD-Rs. we play your basement if the amp survives the drive.',
      meet: 'promoters with a PA and no rules.', interests: 'noise, harsh, power electronics, home recording', css: NOISE_CSS,
      pic: avatar('moldmouth'), top8: [], views: 5540, online: false, bot: true, persona: persona('moldmouth', 'Moldmouth', 'A basement noise band — terse, feedback-drenched, DIY to the bone.'),
    },
    {
      id: 'couchnap', name: 'Couch Nap Records', tagline: 'tapes, not follows',
      mood: 'distro', about: 'a tape label run out of a closet. we trade, we do not sell out. add us, we add back.',
      meet: 'bands with a demo and a van.', interests: 'cassette culture, DIY labels, distros, trades',
      pic: avatar('couchnap'), top8: [], views: 3120, online: true, bot: true, persona: persona('couchnap', 'Couch Nap Records', 'A DIY cassette label — friendly, scene-minded, all about trades.'),
    },
  ]

  const me: Profile = {
    id: 'me',
    name: 'Bug',
    tagline: 'this machine is older than the work on it',
    mood: 'online',
    about: 'i fix things, make things, and keep too much stuff. mostly i make noise and the artwork that goes with it.',
    meet: 'people who still burn CD-Rs.',
    interests: 'noise, horror VHS, old net, tape trading, 90s games',
    pic: avatar('bug'),
    song: '',
    songTitle: '',
    css: '',
    top8: bots.map((b) => b.id),
    views: 88,
    online: true,
  }

  const profiles: Record<string, Profile> = { me, ...Object.fromEntries(bots.map((b) => [b.id, b])) }

  const comments: Comment[] = [
    { id: 'c1', profileId: 'me', authorId: 'tapehiss_kelly', text: 'you rip that comp yet or what', ts: ago(140) },
    { id: 'c2', profileId: 'me', authorId: 'MoltenMoth', text: 'add me to the basement list. i heard the 3am broadcast too.', ts: ago(300) },
    { id: 'c3', profileId: 'me', authorId: 'couchnap', text: 'thanks for the add — we trade tapes not follows. demo in the mail.', ts: ago(600) },
    { id: 'c4', profileId: 'tapehiss_kelly', authorId: 'grimwax', text: 'your log had a read error and you know it', ts: ago(720) },
  ]

  const bulletins: Bulletin[] = [
    { id: 'b1', authorId: 'VHS_Reverend', subject: 'NEW RIP — PAL ex-rental', body: 'tracking lines and all. trade me if you have a cleaner master.', ts: ago(45) },
    { id: 'b2', authorId: 'moldmouth', subject: 'basement show fri', body: 'if the amp survives the drive we play. bring earplugs or dont.', ts: ago(180) },
    { id: 'b3', authorId: 'DialUpDoom', subject: 'hub is UP', body: 'do not close it. share more than you take.', ts: ago(420) },
    { id: 'b4', authorId: 'grimwax', subject: 'ratio check', body: 'some of you know who you are. fix it before invites reset.', ts: ago(900) },
    { id: 'b5', authorId: 'helperbot9000', subject: 'DID YOU KNOW?', body: 'a group of moths is called an ECLIPSE! (fact rating: probably)', ts: ago(1200) },
  ]

  const blog: BlogPost[] = [
    { id: 'bl1', authorId: 'MoltenMoth', title: 'the pattern, again', body: 'saved from a thread before it 404s. the station on 4625 changed again. i wrote it all down. i do not know what it means yet.', ts: ago(500) },
    { id: 'bl2', authorId: 'tapehiss_kelly', title: 'why lossless', body: 'people ask why archive lossless if you cant hear it. you cant hear it because it is not there to be heard. it is there so the copy after the copy still has somewhere to fall from.', ts: ago(2600) },
  ]

  return { meId: 'me', profiles, comments, bulletins, blog }
}

let cid = 0
const newId = (p: string) => `${p}${Date.now().toString(36)}${cid++}`

export const useSocial = create<SocialStore>()(
  persist(
    (set) => ({
      ...seed(),
      saveProfile: (p) =>
        set((s) => {
          const cur = s.profiles[p.id]
          if (!cur) return s
          return { profiles: { ...s.profiles, [p.id]: { ...cur, ...p } } }
        }),
      addComment: (profileId, authorId, text) =>
        set((s) => ({ comments: [...s.comments, { id: newId('c'), profileId, authorId, text, ts: Date.now() }] })),
      addBulletin: (authorId, subject, body) =>
        set((s) => ({ bulletins: [{ id: newId('b'), authorId, subject, body, ts: Date.now() }, ...s.bulletins] })),
      addBlog: (authorId, title, body) =>
        set((s) => ({ blog: [{ id: newId('bl'), authorId, title, body, ts: Date.now() }, ...s.blog] })),
      bumpViews: (id) =>
        set((s) => (s.profiles[id] ? { profiles: { ...s.profiles, [id]: { ...s.profiles[id], views: s.profiles[id].views + 1 } } } : s)),
    }),
    {
      name: 'hmd.myspace',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ meId: s.meId, profiles: s.profiles, comments: s.comments, bulletins: s.bulletins, blog: s.blog }),
    },
  ),
)
