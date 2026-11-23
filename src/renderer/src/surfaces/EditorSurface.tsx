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
  const monacoBox = useRef<HTMLDivElement>(null)
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const [useMonaco, setUseMonaco] = useState(false)

  useEffect(() => {
    if (!useMonaco || !monacoBox.current) return
    let disposed = false
    void (async () => {
      try {
        const monaco = await import('monaco-editor')
        if (disposed || !monacoBox.current) return
        const ed = monaco.editor.create(monacoBox.current, {
          value: text,
          language: 'typescript',
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: false },
          fontFamily: 'ui-monospace, Cascadia Code, monospace',
          fontSize: 13,
          roundedSelection: true,
          padding: { top: 12 }
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
          <button type="button" className="btn btn-ghost" onClick={() => setUseMonaco((v) => !v)}>
            {useMonaco ? 'Simple' : 'Monaco'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              void (async () => {
                if (!window.desk) return
                const home = await window.desk.homeDir()
                const { entries } = await window.desk.listDir(home)
                const file = entries.find(
                  (e) => !e.isDirectory && /\.(txt|md|ts|js|json|css)$/i.test(e.name)
                )
                if (!file) return
                const body = await window.desk.readTextFile(file.path)
                setText(body)
                setPath(file.path)
                editorRef.current?.setValue(body)
              })()
            }
          >
            Open sample
          </button>
          <button
            type="button"
            className="btn"
            disabled={!path}
            onClick={() =>
              void (async () => {
                if (!window.desk || !path) return
                await window.desk.writeTextFile(path, text)
              })()
            }
          >
            Save
          </button>
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
