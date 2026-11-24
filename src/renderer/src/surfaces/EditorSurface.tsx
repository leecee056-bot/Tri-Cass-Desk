import { useCallback, useEffect, useRef, useState } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import GlassFrame from './GlassFrame'
import './surfaces.css'

type Props = {
  title?: string
  initial?: string
  /** Absolute path to open (agent / Files hand-off). */
  filePath?: string
  onClose?: () => void
}

type TabDoc = {
  id: string
  title: string
  path: string | null
  language: string
  value: string
  dirty: boolean
}

const LANGS = [
  'typescript',
  'javascript',
  'json',
  'css',
  'html',
  'markdown',
  'python',
  'yaml',
  'xml',
  'sql',
  'shell',
  'rust',
  'go',
  'plaintext'
] as const

const EXT_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  json: 'json',
  css: 'css',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  py: 'python',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  rs: 'rust',
  go: 'go'
}

function uid(): string {
  return `ed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function basename(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || p
}

function langFromPath(p: string): string {
  const ext = p.split('.').pop()?.toLowerCase() || ''
  return EXT_LANG[ext] || 'plaintext'
}

function blankTab(partial?: Partial<TabDoc>): TabDoc {
  return {
    id: uid(),
    title: 'Untitled',
    path: null,
    language: 'typescript',
    value: '// Tri-Cass Desk\nconst hello = "glass"\n',
    dirty: false,
    ...partial
  }
}

/** VS Code–class local Monaco editor — tabs, status bar, open/save, wrap/minimap. */
export default function EditorSurface({
  title = 'Code Editor',
  initial,
  filePath,
  onClose
}: Props): React.JSX.Element {
  const [tabs, setTabs] = useState<TabDoc[]>(() => [
    blankTab(
      filePath
        ? {
            title: basename(filePath),
            path: filePath,
            language: langFromPath(filePath),
            value: initial ?? '// loading…\n',
            dirty: false
          }
        : initial != null
          ? { value: initial, dirty: false }
          : undefined
    )
  ])
  const [activeId, setActiveId] = useState(() => tabs[0]!.id)
  const [status, setStatus] = useState(
    filePath ? `Opened from agent · ${basename(filePath)}` : 'VS Code–class local editor'
  )
  const [cursor, setCursor] = useState({ line: 1, col: 1 })
  const [wordWrap, setWordWrap] = useState(true)
  const [minimap, setMinimap] = useState(true)
  const [dialog, setDialog] = useState<null | {
    kind: 'open' | 'saveas' | 'goto'
    value: string
  }>(null)

  const monacoBox = useRef<HTMLDivElement>(null)
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const activeIdRef = useRef(activeId)
  const skipDirtyRef = useRef(false)
  activeIdRef.current = activeId

  const active = tabs.find((t) => t.id === activeId) || tabs[0]!

  const patchActive = useCallback((partial: Partial<TabDoc>): void => {
    setTabs((list) =>
      list.map((t) => (t.id === activeIdRef.current ? { ...t, ...partial } : t))
    )
  }, [])

  // Load path from agent hand-off when content was not inlined
  useEffect(() => {
    if (!filePath || initial != null || !window.desk?.readTextFile) return
    void window.desk.readTextFile(filePath).then(
      (text) => {
        skipDirtyRef.current = true
        patchActive({ value: text, dirty: false, path: filePath, title: basename(filePath) })
        setStatus(`Loaded ${basename(filePath)}`)
      },
      (err: unknown) => {
        setStatus(err instanceof Error ? err.message : 'Failed to open file')
      }
    )
  }, [filePath, initial, patchActive])

  // Create Monaco once
  useEffect(() => {
    if (!monacoBox.current) return
    let disposed = false
    void (async () => {
      try {
        const monaco = await import('monaco-editor')
        if (disposed || !monacoBox.current) return
        const ed = monaco.editor.create(monacoBox.current, {
          value: active.value,
          language: active.language,
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: minimap },
          fontFamily: 'ui-monospace, Cascadia Code, monospace',
          fontSize: 13,
          roundedSelection: true,
          padding: { top: 12 },
          wordWrap: wordWrap ? 'on' : 'off',
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          scrollBeyondLastLine: false
        })
        editorRef.current = ed
        ed.onDidChangeModelContent(() => {
          const v = ed.getValue()
          const markDirty = !skipDirtyRef.current
          skipDirtyRef.current = false
          setTabs((list) =>
            list.map((t) =>
              t.id === activeIdRef.current
                ? { ...t, value: v, dirty: markDirty ? true : t.dirty }
                : t
            )
          )
        })
        ed.onDidChangeCursorPosition((e) => {
          setCursor({ line: e.position.lineNumber, col: e.position.column })
        })
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'Monaco failed to load')
      }
    })()
    return () => {
      disposed = true
      editorRef.current?.dispose()
      editorRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync editor when switching tabs
  useEffect(() => {
    const ed = editorRef.current
    if (!ed) return
    const model = ed.getModel()
    if (!model) return
    if (ed.getValue() !== active.value) {
      skipDirtyRef.current = true
      ed.setValue(active.value)
    }
    void import('monaco-editor').then((monaco) => {
      monaco.editor.setModelLanguage(model, active.language)
    })
  }, [active.id])

  useEffect(() => {
    editorRef.current?.updateOptions({
      wordWrap: wordWrap ? 'on' : 'off',
      minimap: { enabled: minimap }
    })
  }, [wordWrap, minimap])

  const newTab = (): void => {
    const t = blankTab({ value: '', title: 'Untitled', dirty: true })
    setTabs((list) => [...list, t])
    setActiveId(t.id)
    setStatus('New untitled buffer')
  }

  const closeTab = (id: string): void => {
    setTabs((list) => {
      if (list.length <= 1) {
        const t = blankTab({ value: '', dirty: false })
        setActiveId(t.id)
        return [t]
      }
      const next = list.filter((t) => t.id !== id)
      if (id === activeId) setActiveId(next[0]!.id)
      return next
    })
  }

  const openPath = async (ask: string): Promise<void> => {
    if (!window.desk) {
      setStatus('Open needs Desk Electron APIs')
      return
    }
    const body = await window.desk.readTextFile(ask)
    const lang = langFromPath(ask)
    const t = blankTab({
      title: basename(ask),
      path: ask,
      language: lang,
      value: body,
      dirty: false
    })
    setTabs((list) => [...list, t])
    setActiveId(t.id)
    setStatus(`Opened ${ask}`)
  }

  const saveTo = async (target: string): Promise<void> => {
    if (!window.desk) return
    const value = editorRef.current?.getValue() ?? active.value
    await window.desk.writeTextFile(target, value)
    patchActive({
      path: target,
      title: basename(target),
      language: langFromPath(target),
      value,
      dirty: false
    })
    setStatus(`Saved ${target}`)
  }

  const submitDialog = async (): Promise<void> => {
    if (!dialog) return
    const v = dialog.value.trim()
    if (dialog.kind === 'goto') {
      const line = Math.max(1, Number(v) || 1)
      editorRef.current?.revealLineInCenter(line)
      editorRef.current?.setPosition({ lineNumber: line, column: 1 })
      editorRef.current?.focus()
      setDialog(null)
      return
    }
    if (!v) {
      setDialog(null)
      return
    }
    try {
      if (dialog.kind === 'open') await openPath(v)
      else await saveTo(v)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err))
    }
    setDialog(null)
  }

  const formatJson = (): void => {
    if (active.language !== 'json') {
      setStatus('Format works on JSON language')
      return
    }
    try {
      const raw = editorRef.current?.getValue() ?? active.value
      const pretty = JSON.stringify(JSON.parse(raw), null, 2)
      editorRef.current?.setValue(pretty)
      patchActive({ value: pretty, dirty: true })
      setStatus('Formatted JSON')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err))
    }
  }

  const startOpen = async (): Promise<void> => {
    const home = (await window.desk?.homeDir()) || ''
    setDialog({ kind: 'open', value: home ? `${home}/` : '' })
  }

  const startSaveAs = async (): Promise<void> => {
    const home = (await window.desk?.homeDir()) || ''
    const def = active.path || `${home}/untitled.ts`
    setDialog({ kind: 'saveas', value: def })
  }

  const save = async (): Promise<void> => {
    if (active.path) await saveTo(active.path)
    else await startSaveAs()
  }

  return (
    <GlassFrame
      title={title}
      subtitle={active.path || (active.dirty ? 'unsaved' : 'monaco')}
      onClose={onClose}
      embedded
      className="editor-vscode"
      actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={newTab}>
            New
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void startOpen()}>
            Open…
          </button>
          <button type="button" className="btn" onClick={() => void save()}>
            Save
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void startSaveAs()}>
            Save As…
          </button>
          <select
            value={active.language}
            aria-label="Language"
            onChange={(e) => {
              const next = e.target.value
              patchActive({ language: next, dirty: true })
              const model = editorRef.current?.getModel()
              if (model) {
                void import('monaco-editor').then((monaco) => {
                  monaco.editor.setModelLanguage(model, next)
                })
              }
            }}
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`btn btn-ghost ${wordWrap ? 'on' : ''}`}
            onClick={() => setWordWrap((w) => !w)}
          >
            Wrap
          </button>
          <button
            type="button"
            className={`btn btn-ghost ${minimap ? 'on' : ''}`}
            onClick={() => setMinimap((m) => !m)}
          >
            Minimap
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setDialog({ kind: 'goto', value: String(cursor.line) })}
          >
            Go to…
          </button>
          <button type="button" className="btn btn-ghost" onClick={formatJson}>
            Format
          </button>
        </>
      }
    >
      {dialog ? (
        <div className="editor-dialog" role="dialog">
          <label className="status-line">
            {dialog.kind === 'open'
              ? 'Open file path'
              : dialog.kind === 'saveas'
                ? 'Save as path'
                : 'Go to line'}
            <input
              autoFocus
              value={dialog.value}
              onChange={(e) => setDialog({ ...dialog, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitDialog()
                if (e.key === 'Escape') setDialog(null)
              }}
            />
          </label>
          <div className="feature-toolbar">
            <button type="button" className="btn" onClick={() => void submitDialog()}>
              OK
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="editor-tabs" role="tablist">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`editor-tab ${t.id === active.id ? 'on' : ''}`}
            role="tab"
            aria-selected={t.id === active.id}
          >
            <button type="button" className="editor-tab-label" onClick={() => setActiveId(t.id)}>
              {t.dirty ? '● ' : ''}
              {t.title}
            </button>
            <button
              type="button"
              className="editor-tab-close"
              aria-label={`Close ${t.title}`}
              onClick={() => closeTab(t.id)}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="editor-tab-add" aria-label="New tab" onClick={newTab}>
          +
        </button>
      </div>

      <div className="editor-host" ref={monacoBox} />

      <div className="editor-statusbar">
        <span>
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <span>{active.language}</span>
        <span>{active.dirty ? 'Modified' : 'Saved'}</span>
        <span className="editor-statusbar-path">{active.path || 'Untitled'}</span>
        <span>{status}</span>
      </div>
    </GlassFrame>
  )
}
