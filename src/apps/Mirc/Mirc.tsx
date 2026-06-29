import styles from './Mirc.module.css'

// mIRC — STATIC prop (docs/07: the scene plumbing). Server tree, a scene
// channel mid-conversation, and an XDCC bot list. No real IRC; realtime is
// Phase 6. Servers/channels/bots are fictional; no real invites or transfers.

interface Msg {
  nick: string
  text: string
  kind?: 'sys' | 'me' | 'bot' | 'op'
}

const TREE = [
  { server: 'Undernet · scene.undernet.org', channels: ['#noisetrades', '#tapeswap', '#xdcc-metal'] },
  { server: 'DALnet · irc.dal.net', channels: ['#cassetteculture'] },
]

const TOPIC =
  '#noisetrades :: trades only, no lurkers begging :: !list for bots :: ratios watched'

const LOG: Msg[] = [
  { nick: '*', text: 'Now talking in #noisetrades', kind: 'sys' },
  { nick: '*', text: 'Topic is: ' + TOPIC, kind: 'sys' },
  { nick: '*', text: 'xClawHammerx has joined #noisetrades', kind: 'sys' },
  { nick: '@stitch', text: "anyone got that Dead Snakes basement tape? the 2004 one", kind: 'op' },
  { nick: 'tapehiss', text: 'check [XDCC]vault, pack 12 i think', kind: undefined },
  { nick: '[XDCC]vault', text: '** 14 packs ** 9 of 20 slots open ** /msg [XDCC]vault xdcc send #N **', kind: 'bot' },
  { nick: '[XDCC]vault', text: '#12  1x [412M]  Dead_Snakes-live_basement_2004_[FLAC].zip', kind: 'bot' },
  { nick: '[XDCC]vault', text: '#13  3x [188M]  basement_noise_comp_vol3_[V0].rar', kind: 'bot' },
  { nick: 'moldmouth', text: 'grabbing #12, thanks. uploading a Hung Eyes split if anyone wants', kind: 'me' },
  { nick: '@stitch', text: 'put it on the bot, share the load', kind: 'op' },
  { nick: 'sergeantfeedback', text: 'ratios watched lol the eternal threat', kind: undefined },
]

const NICKS = [
  { n: '@stitch', op: true },
  { n: '@grimwax', op: true },
  { n: '+tapehiss', voice: true },
  { n: '+moldmouth', voice: true },
  { n: '[XDCC]vault', bot: true },
  { n: 'xClawHammerx' },
  { n: 'sergeantfeedback' },
  { n: 'DialUpDoom' },
  { n: 'no_master' },
]

export function Mirc() {
  return (
    <div className={styles.mirc}>
      <div className={styles.toolbar}>
        <span className={styles.tbtn}>Connect</span>
        <span className={styles.tbtn}>Channels</span>
        <span className={styles.tbtn}>DCC</span>
        <span className={styles.tbtn}>Options</span>
      </div>
      <div className={styles.body}>
        <div className={styles.tree}>
          {TREE.map((s) => (
            <div key={s.server}>
              <div className={styles.server}>{s.server}</div>
              {s.channels.map((c) => (
                <div key={c} className={`${styles.chan} ${c === '#noisetrades' ? styles.chanOn : ''}`}>{c}</div>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.main}>
          <div className={styles.topic}>{TOPIC}</div>
          <div className={styles.chat}>
            {LOG.map((m, i) => (
              <div key={i} className={`${styles.line} ${m.kind ? styles[m.kind] : ''}`}>
                {m.kind === 'sys' ? (
                  <span className={styles.sysText}>* {m.text}</span>
                ) : (
                  <>
                    <span className={styles.nick}>&lt;{m.nick}&gt;</span> {m.text}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className={styles.inputRow}>
            <span className={styles.youNick}>[moldmouth]</span>
            <div className={styles.input} />
          </div>
        </div>

        <div className={styles.names}>
          <div className={styles.namesHead}>{NICKS.length}</div>
          {NICKS.map((u) => (
            <div key={u.n} className={`${styles.name} ${u.op ? styles.opName : ''} ${u.bot ? styles.botName : ''}`}>
              {u.n}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
