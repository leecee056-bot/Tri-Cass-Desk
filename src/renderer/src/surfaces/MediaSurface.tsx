import { useEffect, useRef, useState } from 'react'
import GlassFrame from './GlassFrame'
import './surfaces.css'

type Track = { name: string; url: string }

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
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [index, setIndex] = useState(0)
  const [rate, setRate] = useState(1)
  const [loop, setLoop] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const current = playlist[index]

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = rate
    v.loop = loop
  }, [rate, loop, current])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onEnded = (): void => {
      if (loop) return
      if (shuffle && playlist.length) {
        setIndex(Math.floor(Math.random() * playlist.length))
        return
      }
      setIndex((i) => (i + 1 < playlist.length ? i + 1 : i))
    }
    v.addEventListener('ended', onEnded)
    return () => v.removeEventListener('ended', onEnded)
  }, [playlist, loop, shuffle])

  const pick = async (): Promise<void> => {
    if (window.desk?.pickMediaFile) {
      const picked = await window.desk.pickMediaFile()
      if (!picked) return
      setPlaylist((p) => {
        const next = [...p, { name: picked.name, url: picked.url }]
        setIndex(next.length - 1)
        return next
      })
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*,video/*'
    input.multiple = true
    input.onchange = () => {
      const files = Array.from(input.files || [])
      const tracks = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))
      setPlaylist((p) => {
        const next = [...p, ...tracks]
        setIndex(p.length)
        return next
      })
    }
    input.click()
  }

  return (
    <GlassFrame
      title={title}
      subtitle={mode || current?.name || 'No media — open local files'}
      onClose={onClose}
      actions={
        <button type="button" className="btn" onClick={() => void pick()}>
          Open
        </button>
      }
    >
      <div className="media-stage">
        <video ref={videoRef} src={current?.url} controls={false} key={current?.url} />
      </div>
      <div className="media-controls">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          ⏮
        </button>
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
          onClick={() => setIndex((i) => Math.min(playlist.length - 1, i + 1))}
        >
          ⏭
        </button>
        <label className="status-line">
          Speed
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))} style={{ marginLeft: 6 }}>
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
        <label className="status-line">
          <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />{' '}
          Shuffle
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
      <div className="file-list" style={{ maxHeight: 100 }}>
        {playlist.map((t, i) => (
          <div
            key={`${t.url}-${i}`}
            className={`file-row ${i === index ? 'on' : ''}`}
            onClick={() => setIndex(i)}
          >
            <span>{t.name}</span>
            <span>{i === index ? '▶' : ''}</span>
          </div>
        ))}
        {playlist.length === 0 ? <p className="status-line">Playlist empty — Open local audio/video.</p> : null}
      </div>
    </GlassFrame>
  )
}
