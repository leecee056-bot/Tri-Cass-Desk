import { useEffect, useState } from 'react'
import brandLogo from '../assets/brand-logo.png'
import './boot-splash.css'

type Props = {
  onFinished: () => void
}

/**
 * Branded boot splash — Tri-Cass OS logo + wordmark on cold start.
 */
export function BootSplash({ onFinished }: Props): React.JSX.Element {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const hold = window.setTimeout(() => setPhase('hold'), 280)
    const fade = window.setTimeout(() => setPhase('out'), 1900)
    const done = window.setTimeout(() => onFinished(), 2600)
    return () => {
      window.clearTimeout(hold)
      window.clearTimeout(fade)
      window.clearTimeout(done)
    }
  }, [onFinished])

  return (
    <div className={`boot-splash boot-splash-${phase}`} role="status" aria-live="polite">
      <div className="boot-splash-glow" aria-hidden />
      <img className="boot-splash-logo" src={brandLogo} alt="Tri-Cass OS" />
      <div className="boot-splash-copy">
        <p className="boot-splash-brand">Tri-Cass OS</p>
        <p className="boot-splash-product">Desk companion</p>
      </div>
      <div className="boot-splash-bar" aria-hidden>
        <span />
      </div>
    </div>
  )
}
