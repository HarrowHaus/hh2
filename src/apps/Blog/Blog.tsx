import { useMemo } from 'react'
import { useFS } from '../../os/fs/store'
import { useOS } from '../../os/store'
import { baseName } from '../../os/fs/path'
import { postTitle } from '../../os/fs/whtml'
import type { AppProps } from '../../os/types'
import styles from './Blog.module.css'

// Blog / writable-HTML viewer (docs/11 §1, daedalOS .whtml parity). Renders a
// post's stored HTML document in a sandboxed iframe (scripts disabled — styles
// and images render, nothing executes). "Edit" opens the raw HTML in Monaco
// (the Code app), which writes back to the FS; the viewer re-renders live. The
// .whtml mechanism is adapted from DustinBrett/daedalOS (MIT, CREDITS.md); all
// seeded post prose is original placeholder content (no upstream text shipped).
export function Blog({ args }: AppProps) {
  const path = args?.path as string | undefined
  const content = useFS((s) => (path ? (s.nodes[path]?.content ?? '') : ''))
  const name = useFS((s) => (path ? (s.nodes[path]?.name ?? 'Untitled') : 'Untitled'))
  const openApp = useOS((s) => s.openApp)

  const title = useMemo(() => postTitle(content) ?? baseName(name), [content, name])

  return (
    <div className={styles.blog}>
      <div className={styles.toolbar}>
        <span className={styles.title}>{title}</span>
        <span className={styles.badge}>.whtml</span>
        {path && (
          <button
            type="button"
            className={styles.edit}
            onClick={() => openApp('code', { path, title: name })}
            title="Edit the raw HTML in the code editor"
          >
            Edit
          </button>
        )}
      </div>
      {content.trim() ? (
        <iframe
          className={styles.frame}
          // sandbox="" gives the document a unique origin with scripts disabled;
          // CSS + images still render. Blog posts are content, never code.
          sandbox=""
          srcDoc={content}
          title={title}
        />
      ) : (
        <div className={styles.empty}>This post is empty. Click Edit to write it.</div>
      )}
    </div>
  )
}
