import { useEffect, useRef, useState } from 'react'
import GlassFrame from './GlassFrame'
import './surfaces.css'

type Props = {
  title?: string
  mode?: string
  onClose?: () => void
}

export default function MediaSurface({
  title = 'Media Player',
  mode,
  onClose
}: Props): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [name, setName] = useState('No media')
  const [rate, setRate] = useState(1)
  const [loop, setLoop] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = rate
    v.loop = loop
  }, [rate, loop])

  const pick = async (): Promise<void> => {
    if (!window.desk?.pickMediaFile) {
      // Fallback: file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'audio/*,video/*'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return
        if (src) URL.revokeObjectURL(src)
        const url = URL.createObjectURL(file)
        setSrc(url)
        setName(file.name)
      }
      input.click()
      return
    }
    const picked = await window.desk.pickMediaFile()
    if (!picked) return
    setSrc(picked.url)
    setName(picked.name)
  }

  return (
    <GlassFrame
      title={title}
      subtitle={mode || name}
      onClose={onClose}
      actions={
        <button type="button" className="btn" onClick={() => void pick()}>
          Open
        </button>
      }
    >
      <div className="media-stage">
        <video ref={videoRef} src={src ?? undefined} controls={false} />
      </div>
      <div className="media-controls">
        <button
          type="button"
          className="btn"
          onClick={() => {
            const v = videoRef.current
            if (!v) return
            if (v.paused) void v.play()
            else v.pause()
          }}
        >
          Play / Pause
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            const v = videoRef.current
            if (v) v.currentTime = Math.max(0, v.currentTime - 10)
          }}
        >
          -10s
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            const v = videoRef.current
            if (v) v.currentTime += 10
          }}
        >
          +10s
        </button>
        <label className="status-line">
          Speed
          <select
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            style={{ marginLeft: 6 }}
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
              <option key={r} value={r}>
                {r}x
              </option>
            ))}
          </select>
        </label>
        <label className="status-line">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Loop
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          defaultValue={0.85}
          onChange={(e) => {
            if (videoRef.current) videoRef.current.volume = Number(e.target.value)
          }}
          aria-label="Volume"
        />
      </div>
    </GlassFrame>
  )
}
