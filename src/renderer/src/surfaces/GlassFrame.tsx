import './surfaces.css'

type Props = {
  title: string
  subtitle?: string
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** When hosted inside FloatingWindow — no nested chrome. */
  embedded?: boolean
}

/** Concept glass frame — title + − □ × (never Apple traffic lights). */
export default function GlassFrame({
  title,
  subtitle,
  onClose,
  onMinimize,
  onMaximize,
  actions,
  children,
  className = '',
  embedded = false
}: Props): React.JSX.Element {
  if (embedded) {
    return (
      <div className={`glass-frame embedded ${className}`}>
        {(actions || subtitle) && (
          <div className="glass-frame-toolbar">
            {subtitle ? <em>{subtitle}</em> : <span />}
            <div className="glass-frame-actions">{actions}</div>
          </div>
        )}
        <div className="glass-frame-body">{children}</div>
      </div>
    )
  }

  return (
    <section className={`glass-frame ${className}`}>
      <header className="glass-frame-bar">
        <div className="glass-frame-titles">
          <strong>{title}</strong>
          {subtitle ? <em>{subtitle}</em> : null}
        </div>
        <div className="glass-frame-actions">
          {actions}
          {onMinimize ? (
            <button type="button" className="fa" aria-label="Minimize" onClick={onMinimize}>
              −
            </button>
          ) : null}
          {onMaximize ? (
            <button type="button" className="fa" aria-label="Maximize" onClick={onMaximize}>
              □
            </button>
          ) : null}
          {onClose ? (
            <button type="button" className="fa close" aria-label="Close" onClick={onClose}>
              ×
            </button>
          ) : null}
        </div>
      </header>
      <div className="glass-frame-body">{children}</div>
    </section>
  )
}
