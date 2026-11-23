import { useEffect, useState } from 'react'
import './features.css'

const KEY = 'tricass-desk-notes'

export default function NotesView(): React.JSX.Element {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(KEY) || 'Keep a thought here…'
    } catch {
      return 'Keep a thought here…'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, text)
    } catch {
      /* ignore */
    }
  }, [text])

  return (
    <div className="notes-view">
      <textarea
        className="notes-area"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Notes"
        spellCheck
      />
      <p className="status-line">Saved on this machine only.</p>
    </div>
  )
}
