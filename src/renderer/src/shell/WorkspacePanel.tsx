type Props = {
  title: string
  subtitle: string
  children?: React.ReactNode
  className?: string
}

export default function WorkspacePanel({
  title,
  subtitle,
  children,
  className = ''
}: Props): React.JSX.Element {
  return (
    <section className={`panel glass workspace-panel ${className}`}>
      <header className="panel-head">
        <div>
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
        </div>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}
