import { useEffect, useRef, useState } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import GlassFrame from './GlassFrame'
import './surfaces.css'

type Props = {
  title?: string
  initial?: string
  onClose?: () => void
}

export default function EditorSurface({
  title = 'Code Editor',
  initial = '// Tri-Cass Desk\nconst hello = "glass"\n',
  onClose
}: Props): React.JSX.Element {
  const [text, setText] = useState(initial)
  const [path, setPath] = useState<string | null>(null)
  const [lang, setLang] = useState('typescript')
  const [status, setStatus] = useState('VS Code–class local editor')
  const monacoBox = useRef<HTMLDivElement>(null)
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const [useMonaco, setUseMonaco] = useState(true)

  useEffect(() => {
    if (!useMonaco || !monacoBox.current) return
    let disposed = false
    void (async () => {
      try {
        const monaco = await import('monaco-editor')
        if (disposed || !monacoBox.current) return
        const ed = monaco.editor.create(monacoBox.current, {
          value: text,
          language: lang,
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: true },
          fontFamily: 'ui-monospace, Cascadia Code, monospace',
          fontSize: 13,
          roundedSelection: true,
          padding: { top: 12 },
          wordWrap: 'on'
        })
        editorRef.current = ed
        ed.onDidChangeModelContent(() => setText(ed.getValue()))
      } catch {
        setUseMonaco(false)
      }
    })()
    return () => {
      disposed = true
      editorRef.current?.dispose()
      editorRef.current = null
    }
    // intentionally only when toggling monaco
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useMonaco])

  return (
    <GlassFrame
      title={title}
      subtitle={path || (useMonaco ? 'monaco' : 'glass editor')}
      onClose={onClose}
      embedded
      actions={
        <>
          <select
            value={lang}
            aria-label="Language"
            onChange={(e) => {
              const next = e.target.value
              setLang(next)
              const model = editorRef.current?.getModel()
              if (model) {
                void import('monaco-editor').then((monaco) => {
                  monaco.editor.setModelLanguage(model, next)
                })
              }
            }}
          >
            {['typescript', 'javascript', 'json', 'css', 'html', 'markdown', 'python', 'plaintext'].map(
              (l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              )
            )}
          </select>
          <button type="button" className="btn btn-ghost" onClick={() => setUseMonaco((v) => !v)}>
            {useMonaco ? 'Simple' : 'Monaco'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              void (async () => {
                if (!window.desk) {
                  setStatus('Open needs Desk Electron APIs')
                  return
                }
                const home = await window.desk.homeDir()
                const ask = window.prompt('Open file path', `${home}/`)
                if (!ask) return
                const body = await window.desk.readTextFile(ask)
                setText(body)
                setPath(ask)
                editorRef.current?.setValue(body)
                const ext = ask.split('.').pop()?.toLowerCase()
                const map: Record<string, string> = {
                  ts: 'typescript',
                  tsx: 'typescript',
                  js: 'javascript',
                  json: 'json',
                  css: 'css',
                  html: 'html',
                  md: 'markdown',
                  py: 'python'
                }
                if (ext && map[ext]) setLang(map[ext]!)
                setStatus(`Opened ${ask}`)
              })()
            }
          >
            Open…
          </button>
          <button
            type="button"
            className="btn"
            onClick={() =>
              void (async () => {
                if (!window.desk) return
                let target = path
                if (!target) {
                  const home = await window.desk.homeDir()
                  target = window.prompt('Save as path', `${home}/untitled.ts`) || null
                }
                if (!target) return
                await window.desk.writeTextFile(target, text)
                setPath(target)
                setStatus(`Saved ${target}`)
              })()
            }
          >
            Save
          </button>
          <span className="status-line">{status}</span>
        </>
      }
    >
      {useMonaco ? (
        <div className="editor-host" ref={monacoBox} />
      ) : (
        <div className="editor-host">
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        </div>
      )}
    </GlassFrame>
  )
}
