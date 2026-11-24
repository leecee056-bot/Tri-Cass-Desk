type Props = {
  title?: string
}

/** Native-feeling title bar for the frameless desk — drag + close/min/max. */
export function WindowChrome({ title = 'Tri-Cass OS · Desk' }: Props): React.JSX.Element {
  return (
    <header className="window-chrome" aria-label="Window controls">
      <div className="window-chrome-drag" />
      <span className="window-chrome-title">{title}</span>
      <div className="window-chrome-actions">
        <button
          type="button"
          className="window-chrome-btn"
          aria-label="Minimize"
          title="Minimize"
          onClick={() => void window.desk?.windowMinimize()}
        >
          ─
        </button>
        <button
          type="button"
          className="window-chrome-btn"
          aria-label="Maximize"
          title="Maximize"
          onClick={() => void window.desk?.windowMaximize()}
        >
          □
        </button>
        <button
          type="button"
          className="window-chrome-btn window-chrome-close"
          aria-label="Close Tri-Cass Desk"
          title="Close"
          onClick={() => void window.desk?.windowClose()}
        >
          ×
        </button>
      </div>
    </header>
  )
}
