import './surfaces.css'

type Props = {
  title: string
  subtitle?: string
  onClose?: () => void
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** When hosted inside FloatingWindow — no nested chrome. */
  embedded?: boolean
}

/** Rounded frosted frame — no sharp OS chrome. */
export default function GlassFrame({
  title,
  subtitle,
  onClose,
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
        <div className="glass-frame-traffic" aria-hidden>
          <span className="tf close" onClick={onClose} />
          <span className="tf dim" />
          <span className="tf dim" />
        </div>
        <div className="glass-frame-titles">
          <strong>{title}</strong>
          {subtitle ? <em>{subtitle}</em> : null}
        </div>
        <div className="glass-frame-actions">{actions}</div>
      </header>
      <div className="glass-frame-body">{children}</div>
    </section>
  )
}
