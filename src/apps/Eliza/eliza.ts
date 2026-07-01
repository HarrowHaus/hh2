// ELIZA — an ORIGINAL implementation of Weizenbaum's 1966 keyword/reflection
// approach (the method is unencumbered; no upstream code copied, no LLM). The
// named non-AI substitute for the AI Chat Agent (docs/08).

const REFLECTIONS: [RegExp, string][] = [
  [/\bi am\b/gi, 'you are'], [/\bi'm\b/gi, 'you are'], [/\bi\b/gi, 'you'],
  [/\bmy\b/gi, 'your'], [/\bmine\b/gi, 'yours'], [/\bme\b/gi, 'you'],
  [/\byou are\b/gi, 'I am'], [/\byour\b/gi, 'my'], [/\byours\b/gi, 'mine'],
  [/\byou\b/gi, 'I'], [/\bam\b/gi, 'are'],
]

function reflect(s: string): string {
  let out = ` ${s.trim()} `
  for (const [re, w] of REFLECTIONS) out = out.replace(re, ` ${w} `)
  return out.replace(/\s+/g, ' ').trim()
}

interface Rule { re: RegExp; res: string[] }
// Higher rules match first (keyword priority). $1 is reflected.
const RULES: Rule[] = [
  { re: /\b(hello|hi|hey)\b/i, res: ['Hello. How are you feeling today?', 'Hi. What is on your mind?'] },
  { re: /\bi need (.+)/i, res: ['Why do you need $1?', 'Would it really help to get $1?', 'Are you sure you need $1?'] },
  { re: /\bi(?:'m| am) (?:feeling )?(sad|unhappy|depressed|down)\b.*/i, res: ['I am sorry to hear you are $1. Do you think talking helps?', 'Why do you think you are $1?'] },
  { re: /\bi(?:'m| am) (.+)/i, res: ['How long have you been $1?', 'Why do you say you are $1?', 'Do you enjoy being $1?'] },
  { re: /\bi can'?t (.+)/i, res: ['What makes you think you cannot $1?', 'Have you tried to $1?', 'Perhaps you could $1 if you wanted to.'] },
  { re: /\bi (?:want|wish) (?:to )?(.+)/i, res: ['Why do you want $1?', 'What would it mean to you to $1?', 'Suppose you got $1 — then what?'] },
  { re: /\bwhy don'?t you (.+)/i, res: ['Do you really think I do not $1?', 'Perhaps eventually I will $1.', 'Should you $1 yourself?'] },
  { re: /\bbecause\b.*/i, res: ['Is that the real reason?', 'What other reasons come to mind?', 'Does that reason explain anything else?'] },
  { re: /\b(mother|father|mom|dad|family|brother|sister)\b.*/i, res: ['Tell me more about your family.', 'How do you get along with your family?', 'What was your relationship with them like?'] },
  { re: /\b(dream|dreamt|nightmare)\b.*/i, res: ['What does that dream suggest to you?', 'Do you dream often?', 'What persons appear in your dreams?'] },
  { re: /\b(sorry)\b.*/i, res: ['There is no need to apologize.', 'Apologies are not necessary here.'] },
  { re: /\b(yes|yeah|yep)\b.*/i, res: ['You seem quite sure. Why?', 'I see. Go on.', 'Can you elaborate on that?'] },
  { re: /\b(no|nope)\b.*/i, res: ['Why not?', 'Are you saying no just to be negative?', 'Does anything come to mind that would change your answer?'] },
  { re: /\byou (.+)/i, res: ['We were talking about you, not me.', 'Why do you say that about me?', 'Let us return to you — $1?'] },
  { re: /\b(computer|program|bot|ai)\b.*/i, res: ['Does it bother you that you are talking to a machine?', 'Why do you mention machines?', 'What do you think machines can understand?'] },
  { re: /\?\s*$/i, res: ['Why do you ask that?', 'What do you think?', 'What answer would please you most?'] },
]

const DEFAULTS = [
  'Please, go on.', 'Tell me more.', 'How does that make you feel?',
  'Can you elaborate on that?', 'I see. And what does that suggest to you?',
  "Let's explore that further.", 'Why do you say that?', 'What comes to mind when you say that?',
]

const rotation = new Map<Rule | 'default', number>()
function pick(key: Rule | 'default', arr: string[]): string {
  const i = (rotation.get(key) ?? 0) % arr.length
  rotation.set(key, i + 1)
  return arr[i]
}

export function elizaReply(input: string): string {
  const text = input.trim()
  if (!text) return 'I did not catch that. Please say more.'
  for (const rule of RULES) {
    const m = text.match(rule.re)
    if (m) {
      const cap = m[1] ? reflect(m[1].replace(/[.?!]+$/, '')) : ''
      return pick(rule, rule.res).replace(/\$1/g, cap)
    }
  }
  return pick('default', DEFAULTS)
}

export const ELIZA_GREETING = 'How do you do. Please tell me what is troubling you.'
