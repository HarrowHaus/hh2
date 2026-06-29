import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useFS } from '../../os/fs/store'
import type { AppProps } from '../../os/types'
import styles from './Markdown.module.css'

// Markdown reader (Tier 1, docs/08). Renders a .md file's text from the virtual
// FS to sanitized HTML with marked + DOMPurify. Read-only viewer; editing still
// happens in Notepad. marked = MIT, DOMPurify = Apache-2.0/MPL-2.0 (CREDITS.md).
export function Markdown({ args }: AppProps) {
  const path = args?.path as string | undefined
  const content = useFS((s) => (path ? (s.nodes[path]?.content ?? '') : ''))
  const name = useFS((s) => (path ? (s.nodes[path]?.name ?? 'Untitled') : 'Untitled'))

  const html = useMemo(() => {
    const raw = marked.parse(content, { async: false, gfm: true, breaks: false }) as string
    return DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] })
  }, [content])

  return (
    <div className={styles.md}>
      <div className={styles.toolbar}>
        <span className={styles.title}>{name}</span>
        <span className={styles.badge}>Markdown</span>
      </div>
      {content.trim() ? (
        <article className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className={styles.empty}>This document is empty.</div>
      )}
    </div>
  )
}
