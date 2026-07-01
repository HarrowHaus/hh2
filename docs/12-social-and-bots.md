# 12 · SOCIAL & BOTS — chatbot layer · AIM(Nostr) · local MySpace

## Framing
Personal site. **"Free AI" = zero-API-cost only** (no paid inference, no server we pay for). Two allowed
engines: in-browser **ELIZA-class** pattern bots, and **optional in-browser LLM (WebLLM/WebGPU)** that
runs on the *visitor's* machine at $0 to us. **AIM is now a real Nostr messaging client skinned as AIM**
(encrypted DMs underneath). MySpace is **local-fake first**, architected so a Nostr backend can replace
the local store later without a UI rewrite. Everything is diegetic, opt-in, and works with zero crypto/
network for a casual visitor.

---

## 1 · FREE CHATBOT LAYER  (shared "bot voice" service)
A single service drives every bot mouth (AIM buddies + MySpace profiles). Zero API cost — hard rule.

> **STATUS — tiered, provider-agnostic bot layer (ELIZA/WebLLM live; hosted tier dormant):**
> `src/os/botvoice.ts` exposes `getReply(persona, history, userText, opts)` — the single entry §2 (AIM)
> and §3 (MySpace) both call. Each persona carries `{ name, era, tone, model, randomFree }` where
> **`model` = `'eliza'` | `'webllm'` | a hosted `'provider/model-id'`**. Per-call resolution:
> **assigned hosted model (via proxy) → WebLLM (if WebGPU / opted-in / already loaded) → ELIZA** — never
> breaks.
> - **Tier A — ELIZA** (`src/apps/Eliza/eliza.ts`): always-on, offline, period-accurate floor.
> - **Tier B — WebLLM** (`src/os/webllm.ts`, WebGPU): opt-in ~0.5 GB (Qwen2.5-0.5B), degrades to ELIZA.
> - **Tier C/D — hosted** (`src/os/hostedllm.ts`): OpenRouter `:free` / Gemini Flash / optional Haiku via
>   the proxy. **DORMANT** — `HOSTED_ENABLED = false`, so the proxy is never called; hosted bots fall back
>   to WebLLM/ELIZA. Flip the flag after the proxy + secrets are set up (§1.0c).
> - **Weirdness (§1.0a):** each buddy is assigned a distinct Tier-C model (helperbot9000 stays on ELIZA —
>   a clunky 2003 bot is period-accurate); `MoltenMoth` uses `randomFree` (rolls a random `:free` model
>   per session, drifting over time). All dormant until the hosted tier is on.
> - The **AI Chat Agent** (`src/apps/AIChat/`, separate from bots): chat + Summarize + Image (WebSD),
>   Chrome Prompt API → WebLLM → ELIZA (`src/os/promptapi.ts`). *WebSD (image) is experimental/WebGPU-only.*

### 1.0c · THE PROXY — provider-agnostic Cloudflare Function  (BUILD WHEN SECRETS ARE SET; do NOT wire yet)
One Cloudflare Pages Function, `functions/api/chat.js`, is the ONLY place provider keys live (Cloudflare
**secrets**, never client-side). The client (`src/os/hostedllm.ts`) is already provider-agnostic — it
POSTs `{ model, messages, max_tokens }` to `/api/chat`; the proxy routes by model id:
- `claude-*` → **Anthropic** Messages API (`ANTHROPIC_API_KEY`).
- `gemini-*` → **Gemini** `generateContent` (`GEMINI_API_KEY`).
- everything else → **OpenRouter** (OpenAI-compatible base-URL swap, `OPENROUTER_API_KEY`).

**Guardrails:** origin check; per-IP + per-session rate limit; a global **daily request/spend cap that
hard-stops** (Workers KV / Durable Object counter); low `max_tokens`; and an **owner gate** — a secret
flag (`OWNER_FLAG`) that unlocks the paid (Haiku) tier and, optionally, all hosted tiers while unlaunched
(public gets ELIZA/WebLLM/free-hosted; owner gets everything). Free-tier caveat: free inputs may train the
provider (banter only) and can be pulled without notice — so ELIZA is the floor and `model` is swappable
config, never a hard-wired provider.

**Activation (two steps, no client rewrite):** (1) add `functions/api/chat.js` (ready implementation
below) + set the Cloudflare secrets; (2) set `HOSTED_ENABLED = true` in `src/os/hostedllm.ts`. Bots then
immediately pick up their assigned Tier-C voices.

<details><summary>Ready-to-deploy <code>functions/api/chat.js</code> (dormant until secrets exist)</summary>

```js
// Provider-agnostic hosted-LLM proxy (docs/12 §1.0c). Keys are Cloudflare
// secrets — NEVER client-side. Returns 503 until configured, so it's inert.
const DAILY_CAP = 2000            // hard stop: requests/day across everyone
const PER_IP_PER_MIN = 20
const MAX_TOKENS = 200

export async function onRequestPost(context) {
  const { request, env } = context
  // Origin check — only our own site may call it.
  const origin = request.headers.get('origin') || ''
  if (env.ALLOWED_ORIGIN && origin && origin !== env.ALLOWED_ORIGIN) return json({ error: 'origin' }, 403)

  let body
  try { body = await request.json() } catch { return json({ error: 'bad json' }, 400) }
  const model = String(body.model || '')
  const messages = Array.isArray(body.messages) ? body.messages : []
  const maxTokens = Math.min(Number(body.max_tokens) || 160, MAX_TOKENS)
  if (!model || !messages.length) return json({ error: 'model + messages required' }, 400)

  // Owner gate: paid (claude-*) and — if LOCK_ALL is set — every hosted tier
  // require the owner flag while unlaunched.
  const isOwner = env.OWNER_FLAG && (request.headers.get('x-owner') === env.OWNER_FLAG ||
    (request.headers.get('cookie') || '').includes(`owner=${env.OWNER_FLAG}`))
  const paid = model.startsWith('claude-')
  if ((paid || env.LOCK_ALL === '1') && !isOwner) return json({ error: 'locked' }, 403)

  // Rate limit + daily cap via KV (bind CHAT_KV). Best-effort if unbound.
  if (env.CHAT_KV) {
    const ip = request.headers.get('cf-connecting-ip') || 'anon'
    const min = new Date().toISOString().slice(0, 16)
    const day = min.slice(0, 10)
    const [ipN, dayN] = await Promise.all([
      env.CHAT_KV.get(`r:${ip}:${min}`).then(Number), env.CHAT_KV.get(`d:${day}`).then(Number),
    ])
    if ((ipN || 0) >= PER_IP_PER_MIN) return json({ error: 'rate' }, 429)
    if ((dayN || 0) >= DAILY_CAP) return json({ error: 'daily cap' }, 429)
    context.waitUntil(Promise.all([
      env.CHAT_KV.put(`r:${ip}:${min}`, String((ipN || 0) + 1), { expirationTtl: 120 }),
      env.CHAT_KV.put(`d:${day}`, String((dayN || 0) + 1), { expirationTtl: 172800 }),
    ]))
  }

  try {
    let text
    if (paid) text = await anthropic(env, model, messages, maxTokens)
    else if (model.startsWith('gemini-')) text = await gemini(env, model, messages, maxTokens)
    else text = await openrouter(env, model, messages, maxTokens)
    return json({ text })
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 502)
  }
}

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })

async function openrouter(env, model, messages, max_tokens) {
  if (!env.OPENROUTER_API_KEY) throw new Error('not configured')
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.OPENROUTER_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error?.message || `openrouter ${r.status}`)
  return j.choices?.[0]?.message?.content || ''
}

async function gemini(env, model, messages, maxOutputTokens) {
  if (!env.GEMINI_API_KEY) throw new Error('not configured')
  const sys = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
  const contents = messages.filter((m) => m.role !== 'system').map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }],
  }))
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents, systemInstruction: sys ? { parts: [{ text: sys }] } : undefined, generationConfig: { maxOutputTokens } }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error?.message || `gemini ${r.status}`)
  return j.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function anthropic(env, model, messages, max_tokens) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('not configured')
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
  const msgs = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content }))
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, system, messages: msgs, max_tokens }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error?.message || `anthropic ${r.status}`)
  return j.content?.[0]?.text || ''
}
```
</details>

- **Tier A — ELIZA-class (default, always works):** `elizabot.js` (or an AIML-lite engine), pure in-
  browser, instant, no network. A 2003 AIM bot (SmarterChild-era) *should* feel like a clunky pattern
  bot — so ELIZA is period-*accurate*, not a compromise. This is the baseline every bot falls back to.
- **Tier B — WebLLM (optional, "smarter" characters):** `@mlc-ai/web-llm`, a small model (Phi-3-mini /
  Llama-3.2-1B/3B / Qwen2.5) running in the visitor's browser via **WebGPU** — genuine LLM quality,
  **$0 to us**, no server, no API key. Adopt daedalOS's WebLLM wiring (now allowed — the only prior
  objection was API cost, which WebLLM has none of). Credit as applicable.
- **Guardrails:** feature-detect WebGPU; if absent (older browsers / most mobile) **degrade to Tier A**
  silently. WebLLM's one honest cost is a one-time model download (~0.5–2 GB) on the visitor's side —
  gate it behind an explicit opt-in ("load smarter chat?"), never auto-download.
- **Bot-voice API:** `getReply(botId, history, mode: 'eliza'|'webllm')` → text. Each bot has a persona
  seed (name, era, tone). AIM and MySpace both call this; neither special-cases the engine.
- **Accept:** bots reply instantly via ELIZA offline; enabling WebLLM (WebGPU present) yields markedly
  better replies; no paid API is ever called; WebGPU-absent degrades without error.

### 1.1 FULL FREE LLM PARITY WITH daedalOS  (reverses the earlier AI-skip rulings)
The only prior objection to AI was **API cost** — daedalOS's AI features all run **in-browser at $0**, so
we now adopt them to **full parity**. This REVERSES the docs/08 rulings that skipped WebLLM / substituted
the AI chat agent / skipped Stable-Diffusion wallpapers. Adopt daedalOS's wiring from source, credited:
- **AI Chat Agent** (taskbar) — **Chrome Prompt API** (`window.ai`, on-device Gemini Nano) **+ WebLLM**
  fallback — including its **Summarize** and **Image Generation** actions.
- **In-browser image generation + AI wallpapers** — **WebSD (Stable Diffusion, WebGPU)** for the image-
  gen action AND as the **AI Generated Wallpaper** option in Display Properties (re-enable it in docs/10
  §4's wallpaper list).
- **Hard rule unchanged:** in-browser / on-device only — **no paid API, no server inference, ever.**
  Feature-detect (Prompt API → WebLLM → hide) and WebGPU-gate WebSD; degrade silently where unsupported;
  gate large model/SD downloads behind explicit opt-in. Everything here is optional flavor, never a wall.
- **Accept:** the AI Chat Agent answers + summarizes + generates an image fully client-side; WebSD
  produces a wallpaper; nothing calls a paid endpoint; unsupported browsers degrade without error.

---

## 2 · AIM = REAL NOSTR MESSAGING CLIENT, SKINNED AS AIM  (`src/apps/AIM`)
Under the hood it's Nostr (real, encrypted, uncensorable). On the surface it's AIM to the pixel. A
casual visitor chats with bot buddies immediately; a visitor who wants real messaging has a working
encrypted Nostr DM client.

> **STATUS (Section 5 landed):** local **bot buddies** (`bots.ts`, six in-world characters) driven by
> the §1 bot-voice service — the list is alive and chattable **offline**, transcripts persisted. Full
> AIM chrome: **buddy groups** (collapsible, online/total counts), **status states** (online/away/idle/
> invisible) with graying + "(Away)", a **self status selector** + away message, **idle auto-status**
> after inactivity, working **away auto-responses** (messaging an away bot returns its away message),
> **typing indicator**, **timestamps**, **warning %**, **profile quote** panel, and **sign-on/off + IM
> sounds** wired to the silent `sound.ts` seam. A one-time **auto-key caveat** with copy-npub / back-up-
> key. Real npub contacts still use encrypted **NIP-04** DMs over public relays. An optional "smarter
> bots" toggle routes bot replies through WebLLM when WebGPU is present. *Deferred: NIP-17/44 gift-wrap
> privacy upgrade (NIP-04 remains the working default); multiple simultaneous IM windows (single
> switchable pane for now); kind-0 profile avatars for real contacts.*

### 2.1 Nostr core
- **Library:** `nostr-tools` (keys, events, relays, nip19, encryption).
- **Identity:** auto-generate a per-visitor keypair on first run, stored in IndexedDB (their screen-name
  maps to an npub). Optionally use **NIP-07** (browser extension like Alby/nos2x) if present. HONEST
  CAVEAT surfaced in-world once: a browser-stored generated key is fine for casual chat, not high-
  security — offer "export/import key" so it's portable.
- **Encrypted DMs:** prefer **NIP-17 (gift-wrapped) + NIP-44** encryption (hides metadata) over legacy
  **NIP-04** (NIP-04 leaks who-talks-to-whom; only as a compatibility fallback). Real send/receive.
- **Relays:** connect to a small default public relay set (WebSocket); allow editing. Presence/away via
  a status event (NIP-38 style) or profile flag.
- **Buddies = Nostr contacts:** contact list (NIP-02); profiles (kind-0) supply display name + **buddy
  icon** (profile picture) + profile/quote text. Adding a buddy = add an npub.

### 2.2 Local bot buddies (so the list is alive with no contacts)
- Seed the buddy list with **local bot accounts** (not real Nostr identities) driven by §1, always-
  present, so a fresh visitor has someone to talk to instantly. These live alongside any real Nostr
  buddies. Clearly separated internally (bot vs. npub) but visually identical in the list.
- Optional later: give bots real seeded npubs so they exist on Nostr too. Not now.

### 2.3 AIM parity chrome (to the pixel)
- **Away messages that WORK:** set/clear away; buddy grays + "(Away)"; **auto-response fires** when
  someone messages an away user; the away-message-as-song-lyrics culture (Stratum A) seeded in samples.
- **Buddy icons:** the little square per buddy + your own (from Nostr kind-0 for real buddies; assigned
  art for bots).
- **Buddy-list groups:** Buddies / Family / Co-Workers; **states:** online / offline / **idle (auto
  after N min)** / away / invisible; the running-man icon; collapsible groups; buddy count.
- **IM window:** "BuddyName is typing…", timestamps, warning %, the Arial-blue-on-white transcript,
  the profile/quote panel. Multiple IM windows.
- **Sounds:** sign-on/off + door-open/door-slam wired to the silent sound seam (`src/os/sound.ts`) —
  slots only, no assets yet (Phase 8 fills them).
- **Skin:** authentic AIM (running-man, buddy-list window chrome) under the active visual style.

### 2.4 Guardrails
- **Works with zero network:** if relays are unreachable, real DMs degrade but the **bot buddies still
  chat** — AIM never appears broken. Real Nostr messaging is the opt-in layer, bots are the floor.
- **Privacy:** NIP-17/44 default; the auto-key caveat shown once; no real message content ever leaves
  the visitor's client except to their chosen relays.
- **Accept:** boot AIM → bot buddies online, chattable offline. Generate/confirm a keypair → add an
  npub → exchange a real encrypted DM over a relay. Set an away message → messaging that account
  returns the auto-response and the buddy shows "(Away)". Idle after N minutes flips status.

---

## 3 · LOCAL MYSPACE  (local-fake first, Nostr-ready later)
Self-contained in-OS MySpace circa 2005–07.

> **STATUS (Section 6 landed):** `src/apps/MySpace/` — profiles, **Top 8**, comments, **bulletins**,
> **blogs**, and **custom-CSS profiles** (SpaceHey-style, scoped to the profile card so it can't touch
> the OS). Everything is local + **persisted to IndexedDB** behind a **`SocialStore` interface**
> (`social.ts`) so a Nostr-backed impl can replace it without a UI rewrite. **Eight bot profiles** (the
> AIM characters + Moldmouth/Couch Nap) seeded with content, Top-8'd on your profile; commenting on a
> bot's page earns a **bot reply on yours** via the §1 bot-voice service. Editable profile (name/
> tagline/mood/about/interests/pic/background/**profile song**/custom CSS/Top 8), Browse, Bulletins, and
> Blog views. **Parity reference: superswan/anyspace — GPL-3.0, so STUDIED ONLY (no code ported);** our
> implementation is original TS/React and the OS stays MIT (CREDITS.md).
- **Parity reference:** `superswan/anyspace` (open-source MySpace-2005 clone) — study its **data model +
  layout**: profiles with background image + profile song + custom layout, **Top 8**, comments, blogs,
  bulletins, friends/requests, groups. **VERIFY its license; reimplement client-side (do NOT port its
  PHP); credit it** in CREDITS.md. (SpaceHey itself is closed-source; anyspace is the studyable one.)
- **Build:** profiles, Top-8, comments, bulletins, blogs, friends — all local, persisted to IndexedDB.
  **Custom-CSS profiles** (SpaceHey-style paste-your-CSS) for the glittery self-expression.
- **Bot profiles:** seed the network with bot accounts driven by §1 — they post bulletins and leave
  comments so the place feels populated. Your profile is the center; the top-8 are seeded characters.
- **Nostr-ready architecture:** put all reads/writes behind a `SocialStore` interface (local IndexedDB
  impl now) so a Nostr-backed impl can replace it later **without a UI rewrite**.
- **Accept:** a working MySpace with a customizable profile (incl. custom CSS + profile song via
  foobar/R2), a populated Top-8 of bot profiles that post/comment, all offline and persisted.

---

## 4 · Shelved / deferred
- Nostr **zaps** (NIP-57) anywhere → deferred, opt-in, no-wallet path if ever.
- Label-as-publisher / NIP-23 blog publishing → shelved (docs/11).
- MySpace on real Nostr federation → later, via the `SocialStore` seam.
- WebLLM for anything beyond optional chat flavor → not now.

## Build order
1. §1 chatbot layer (the shared voice service) — ELIZA first, WebLLM opt-in behind WebGPU detect.
2. §2 AIM as Nostr client skinned as AIM — Nostr core + local bot buddies + full AIM chrome.
3. §3 local MySpace — anyspace-modeled, bot profiles, SocialStore seam.
Commit each to main; STOP for local review; **do NOT deploy** (deploys frozen until Cloudflare tokens
are set up).
