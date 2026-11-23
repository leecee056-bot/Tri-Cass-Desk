import { useState } from 'react'
import './features.css'

export default function BrowseView(): React.JSX.Element {
  const [url, setUrl] = useState('https://')

  return (
    <div className="feature">
      <p className="status-line">
        Opens in your system browser. Desk itself stays local — no embedded cloud session required.
      </p>
      <div className="feature-toolbar">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        <button
          type="button"
          className="btn"
          onClick={() => void window.desk?.openExternal(url)}
        >
          Open
        </button>
      </div>
      <div className="tools-grid">
        {['https://ollama.com', 'https://github.com/leecee056-bot/Tri-Cass-Desk'].map((u) => (
          <button
            key={u}
            type="button"
            className="tool-card"
            onClick={() => {
              setUrl(u)
              void window.desk?.openExternal(u)
            }}
          >
            <strong>{u.replace(/^https?:\/\//, '')}</strong>
            <span>shortcut</span>
          </button>
        ))}
      </div>
    </div>
  )
}
