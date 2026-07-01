import { useMemo, useState } from 'react'
import { useSocial, type Profile } from './social'
import { getReply } from '../../os/botvoice'
import { useOS } from '../../os/store'
import type { AppProps } from '../../os/types'
import styles from './MySpace.module.css'

// Local MySpace (docs/12 §3) — profiles, Top 8, comments, bulletins, blogs,
// custom-CSS profiles. All local + persisted (social.ts). Bot profiles reply via
// the §1 bot-voice service. Nostr-ready behind the SocialStore seam.

type View = 'profile' | 'browse' | 'bulletins' | 'blog' | 'edit'

function since(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  return `${Math.floor(s / 86400)} d ago`
}

// Scope pasted custom CSS to the profile card so it can style the page
// (SpaceHey-style) without touching the OS. `body` maps to the card; other
// selectors are prefixed. </style> is stripped to prevent breakout.
function scopeCss(css: string | undefined, scope: string): string {
  if (!css) return ''
  const clean = css.replace(/<\/style>/gi, '')
  return clean.replace(/(^|})\s*([^{}@]+)\{/g, (_m, brace: string, sel: string) => {
    const scoped = sel
      .split(',')
      .map((raw) => {
        const s = raw.trim()
        if (!s) return s
        if (/^body\b/i.test(s)) return s.replace(/^body/i, scope)
        if (/^html\b/i.test(s)) return s.replace(/^html/i, scope)
        return `${scope} ${s}`
      })
      .join(', ')
    return `${brace} ${scoped}{`
  })
}

export function MySpace(_props: AppProps) {
  const s = useSocial()
  const openApp = useOS((o) => o.openApp)
  const [view, setView] = useState<View>('profile')
  const [viewing, setViewing] = useState<string>(s.meId)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const profile = s.profiles[viewing] ?? s.profiles[s.meId]
  const me = s.profiles[s.meId]
  const isMe = profile.id === s.meId

  function goProfile(id: string) { setViewing(id); setView('profile'); s.bumpViews(id) }

  async function postComment() {
    const text = comment.trim()
    if (!text || busy) return
    setComment('')
    s.addComment(profile.id, s.meId, text)
    // Commenting on a bot's page earns a reply back on your page (§1 voice).
    if (profile.bot && profile.persona) {
      setBusy(true)
      try {
        const reply = await getReply(profile.persona, [], text, 'eliza')
        s.addComment(s.meId, profile.id, reply)
      } finally { setBusy(false) }
    }
  }

  const scoped = useMemo(() => scopeCss(profile.css, '.msCard'), [profile.css])
  const pageComments = s.comments.filter((c) => c.profileId === profile.id).sort((a, b) => b.ts - a.ts)
  const name = (id: string) => s.profiles[id]?.name ?? id
  const pic = (id: string) => s.profiles[id]?.pic

  return (
    <div className={styles.ms}>
      <div className={styles.nav}>
        <span className={styles.brand}>myspace<span className={styles.dot}>.</span></span>
        <button type="button" className={view === 'profile' && isMe ? styles.on : ''} onClick={() => goProfile(s.meId)}>Home</button>
        <button type="button" className={view === 'browse' ? styles.on : ''} onClick={() => setView('browse')}>Browse</button>
        <button type="button" className={view === 'bulletins' ? styles.on : ''} onClick={() => setView('bulletins')}>Bulletins</button>
        <button type="button" className={view === 'blog' ? styles.on : ''} onClick={() => setView('blog')}>Blog</button>
        <button type="button" className={view === 'edit' ? styles.on : ''} onClick={() => setView('edit')}>Edit Profile</button>
      </div>

      {view === 'edit' ? (
        <EditProfile me={me} onDone={() => goProfile(s.meId)} />
      ) : view === 'browse' ? (
        <div className={styles.browse}>
          {Object.values(s.profiles).map((p) => (
            <button key={p.id} type="button" className={styles.browseItem} onClick={() => goProfile(p.id)}>
              <img src={p.pic} alt="" className={styles.browsePic} />
              <div className={styles.browseName}>{p.name}</div>
              <div className={styles.browseTag}>{p.tagline}</div>
            </button>
          ))}
        </div>
      ) : view === 'bulletins' ? (
        <Bulletins />
      ) : view === 'blog' ? (
        <Blog viewing={profile.id} />
      ) : (
        // ── Profile ──────────────────────────────────────────────────────────
        <div className={styles.scroll}>
          {scoped && <style>{scoped}</style>}
          <div className={`${styles.card} msCard`} style={profile.background ? { backgroundImage: `url("${profile.background}")`, backgroundSize: 'cover' } : undefined}>
            <div className={styles.head}>
              <img src={profile.pic} alt="" className={styles.avatar} />
              <div className={styles.headText}>
                <h1 className={styles.name}>{profile.name}</h1>
                <div className={styles.tagline}>“{profile.tagline}”</div>
                <div className={styles.status}>{profile.online ? <span className={styles.onNow}>Online Now!</span> : 'Last login: a while ago'}</div>
              </div>
            </div>

            <div className={styles.cols}>
              <div className={styles.left}>
                <div className={styles.box}>
                  <div className={styles.boxHead}>{profile.name}’s latest</div>
                  <div className={styles.mood}>Mood: {profile.mood || '—'}</div>
                  <div className={styles.stat}>Views: {profile.views}</div>
                  <div className={styles.stat}>Interests: {profile.interests}</div>
                </div>
                {profile.song && (
                  <div className={styles.box}>
                    <div className={styles.boxHead}>Profile Song{profile.songTitle ? ` — ${profile.songTitle}` : ''}</div>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio className={styles.song} src={profile.song} controls autoPlay />
                  </div>
                )}
                <div className={styles.box}>
                  <div className={styles.boxHead}>Contacting {profile.name}</div>
                  <button type="button" className={styles.contact} onClick={() => openApp('aim')}>Send Message</button>
                  {!isMe && <button type="button" className={styles.contact} onClick={() => document.getElementById('ms-comment')?.focus()}>Add Comment</button>}
                </div>
              </div>

              <div className={styles.main}>
                <section className={styles.section}><h2>About me</h2><p>{profile.about}</p></section>
                {profile.meet && <section className={styles.section}><h2>Who I’d like to meet</h2><p>{profile.meet}</p></section>}

                <section className={styles.section}>
                  <h2>{profile.name}’s Top 8</h2>
                  <div className={styles.top8}>
                    {profile.top8.slice(0, 8).map((id) => (
                      <button key={id} type="button" className={styles.friend} onClick={() => goProfile(id)}>
                        <img src={pic(id)} alt="" />
                        <span>{name(id)}</span>
                      </button>
                    ))}
                    {profile.top8.length === 0 && <div className={styles.muted}>No friends yet.</div>}
                  </div>
                </section>

                <section className={styles.section}>
                  <h2>{profile.name}’s Comments</h2>
                  <div className={styles.commentForm}>
                    <textarea id="ms-comment" className={styles.commentInput} value={comment} placeholder={`Leave ${profile.name} a comment…`} rows={2}
                      onChange={(e) => setComment(e.target.value)} />
                    <button type="button" className={styles.postBtn} disabled={busy} onClick={() => void postComment()}>Post</button>
                  </div>
                  {pageComments.map((c) => (
                    <div key={c.id} className={styles.comment}>
                      <img src={pic(c.authorId)} alt="" className={styles.commentPic} />
                      <div className={styles.commentBody}>
                        <button type="button" className={styles.commentAuthor} onClick={() => goProfile(c.authorId)}>{name(c.authorId)}</button>
                        <span className={styles.commentTime}>{since(c.ts)}</span>
                        <div>{c.text}</div>
                      </div>
                    </div>
                  ))}
                  {pageComments.length === 0 && <div className={styles.muted}>No comments yet. Be the first.</div>}
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Bulletins() {
  const s = useSocial()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const post = () => {
    if (!subject.trim()) return
    s.addBulletin(s.meId, subject.trim(), body.trim())
    setSubject(''); setBody('')
  }
  return (
    <div className={styles.scroll}>
      <div className={styles.card}>
        <h2 className={styles.feedHead}>Bulletin Board</h2>
        <div className={styles.postbox}>
          <input className={styles.postInput} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea className={styles.postArea} placeholder="Post a bulletin…" rows={2} value={body} onChange={(e) => setBody(e.target.value)} />
          <button type="button" className={styles.postBtn} onClick={post}>Post Bulletin</button>
        </div>
        {s.bulletins.map((b) => (
          <div key={b.id} className={styles.bulletin}>
            <img src={s.profiles[b.authorId]?.pic} alt="" className={styles.commentPic} />
            <div className={styles.commentBody}>
              <span className={styles.commentAuthor}>{s.profiles[b.authorId]?.name ?? b.authorId}</span>
              <span className={styles.commentTime}>{since(b.ts)}</span>
              <div className={styles.bulletinSubject}>{b.subject}</div>
              <div>{b.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Blog({ viewing }: { viewing: string }) {
  const s = useSocial()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const posts = s.blog.slice().sort((a, b) => b.ts - a.ts)
  const post = () => {
    if (!title.trim()) return
    s.addBlog(s.meId, title.trim(), body.trim())
    setTitle(''); setBody('')
  }
  return (
    <div className={styles.scroll}>
      <div className={styles.card}>
        <h2 className={styles.feedHead}>Blog</h2>
        <div className={styles.postbox}>
          <input className={styles.postInput} placeholder="Post title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className={styles.postArea} placeholder="Write a blog entry…" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          <button type="button" className={styles.postBtn} onClick={post}>Publish</button>
        </div>
        {posts.map((p) => (
          <article key={p.id} className={styles.blogPost}>
            <div className={styles.blogMeta}>{s.profiles[p.authorId]?.name ?? p.authorId} · {since(p.ts)}</div>
            <h3 className={styles.blogTitle}>{p.title}</h3>
            <p>{p.body}</p>
          </article>
        ))}
        {posts.length === 0 && <div className={styles.muted}>No entries yet.</div>}
      </div>
      <div className={styles.hiddenAnchor} data-viewing={viewing} />
    </div>
  )
}

function EditProfile({ me, onDone }: { me: Profile; onDone: () => void }) {
  const s = useSocial()
  const all = Object.values(s.profiles).filter((p) => p.id !== me.id)
  const [f, setF] = useState<Profile>({ ...me })
  const set = (k: keyof Profile, v: unknown) => setF((p) => ({ ...p, [k]: v }))
  const toggleTop8 = (id: string) =>
    setF((p) => {
      const has = p.top8.includes(id)
      if (has) return { ...p, top8: p.top8.filter((x) => x !== id) }
      if (p.top8.length >= 8) return p
      return { ...p, top8: [...p.top8, id] }
    })
  const save = () => { s.saveProfile(f); onDone() }

  return (
    <div className={styles.scroll}>
      <div className={styles.card}>
        <h2 className={styles.feedHead}>Edit Profile</h2>
        <div className={styles.form}>
          <label>Display name<input value={f.name} onChange={(e) => set('name', e.target.value)} /></label>
          <label>Headline / tagline<input value={f.tagline} onChange={(e) => set('tagline', e.target.value)} /></label>
          <label>Mood<input value={f.mood ?? ''} onChange={(e) => set('mood', e.target.value)} /></label>
          <label>About me<textarea rows={3} value={f.about} onChange={(e) => set('about', e.target.value)} /></label>
          <label>Who I’d like to meet<textarea rows={2} value={f.meet ?? ''} onChange={(e) => set('meet', e.target.value)} /></label>
          <label>Interests<input value={f.interests} onChange={(e) => set('interests', e.target.value)} /></label>
          <label>Profile picture URL<input value={f.pic ?? ''} onChange={(e) => set('pic', e.target.value)} placeholder="https://…" /></label>
          <label>Background image URL<input value={f.background ?? ''} onChange={(e) => set('background', e.target.value)} placeholder="https://…" /></label>
          <label>Profile song URL<input value={f.song ?? ''} onChange={(e) => set('song', e.target.value)} placeholder="https://…/track.mp3 (foobar/Wavlake/R2)" /></label>
          <label>Profile song title<input value={f.songTitle ?? ''} onChange={(e) => set('songTitle', e.target.value)} /></label>
          <label>Custom CSS (SpaceHey-style — scoped to your page)
            <textarea className={styles.css} rows={5} value={f.css ?? ''} onChange={(e) => set('css', e.target.value)} placeholder="body{background:#0a0010;color:#ffb3f0}" spellCheck={false} />
          </label>
          <div className={styles.top8Edit}>
            <div>Top 8 ({f.top8.length}/8)</div>
            <div className={styles.top8Pick}>
              {all.map((p) => (
                <label key={p.id} className={`${styles.pick} ${f.top8.includes(p.id) ? styles.pickOn : ''}`}>
                  <input type="checkbox" checked={f.top8.includes(p.id)} onChange={() => toggleTop8(p.id)} /> {p.name}
                </label>
              ))}
            </div>
          </div>
          <div className={styles.formBtns}>
            <button type="button" className={styles.postBtn} onClick={save}>Save</button>
            <button type="button" className={styles.cancelBtn} onClick={onDone}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
