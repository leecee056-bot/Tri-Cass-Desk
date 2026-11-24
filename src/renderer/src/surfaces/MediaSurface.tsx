import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GlassFrame from './GlassFrame'
import './surfaces.css'

type Track = {
  id: string
  name: string
  url: string
  path?: string
  kind: 'audio' | 'video' | 'unknown'
}

type Props = {
  title?: string
  mode?: string
  onClose?: () => void
}

const PLAYLIST_KEY = 'tricass-desk-media-playlist-v1'
const AUDIO_EXT = /\.(mp3|wav|flac|ogg|m4a|aac|opus)$/i
const VIDEO_EXT = /\.(mp4|webm|mkv|mov|avi|m4v)$/i

function uid(): string {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function kindFromName(name: string): Track['kind'] {
  if (AUDIO_EXT.test(name)) return 'audio'
  if (VIDEO_EXT.test(name)) return 'video'
  return 'unknown'
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec % 60)
  const m = Math.floor(sec / 60) % 60
  const h = Math.floor(sec / 3600)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

function loadPlaylist(): Track[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || '[]') as Track[]
    if (!Array.isArray(raw)) return []
    return raw
      .filter((t) => t?.url && t?.name)
      .map((t) => ({
        id: t.id || uid(),
        name: t.name,
        url: t.url,
        path: t.path,
        kind: t.kind || kindFromName(t.name)
      }))
  } catch {
    return []
  }
}

export default function MediaSurface({
  title = 'Media',
  mode,
  onClose
}: Props): React.JSX.Element {
  const mediaRef = useRef<HTMLVideoElement>(null)
  const [playlist, setPlaylist] = useState<Track[]>(() => loadPlaylist())
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [loopMode, setLoopMode] = useState<'off' | 'one' | 'all'>('off')
  const [shuffle, setShuffle] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.9)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [status, setStatus] = useState('Open files to build a playlist')
  const [showList, setShowList] = useState(true)

  const current = playlist[index]
  const progress = duration > 0 ? currentTime / duration : 0

  useEffect(() => {
    localStorage.setItem(
      PLAYLIST_KEY,
      JSON.stringify(
        playlist.map(({ id, name, url, path, kind }) => ({ id, name, url, path, kind }))
      )
    )
  }, [playlist])

  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    el.playbackRate = rate
    el.loop = loopMode === 'one'
    el.muted = muted
    el.volume = volume
  }, [rate, loopMode, muted, volume, current])

  useEffect(() => {
    const el = mediaRef.current
    if (!el || !current) return
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    const play = async (): Promise<void> => {
      try {
        await el.play()
        setPlaying(true)
        setStatus(`Playing · ${current.name}`)
      } catch {
        setStatus(`Ready · ${current.name}`)
      }
    }
    void play()
  }, [current?.id])

  const advance = useCallback(
    (dir: 1 | -1): void => {
      if (!playlist.length) return
      if (shuffle && playlist.length > 1) {
        let next = index
        while (next === index) next = Math.floor(Math.random() * playlist.length)
        setIndex(next)
        return
      }
      if (dir === 1 && index + 1 >= playlist.length) {
        if (loopMode === 'all') setIndex(0)
        return
      }
      if (dir === -1 && index <= 0) {
        if (loopMode === 'all') setIndex(playlist.length - 1)
        return
      }
      setIndex((i) => Math.min(playlist.length - 1, Math.max(0, i + dir)))
    },
    [playlist.length, shuffle, index, loopMode]
  )

  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    const onTime = (): void => setCurrentTime(el.currentTime || 0)
    const onMeta = (): void => setDuration(el.duration || 0)
    const onPlay = (): void => setPlaying(true)
    const onPause = (): void => setPlaying(false)
    const onEnded = (): void => {
      if (loopMode === 'one') return
      if (shuffle && playlist.length) {
        advance(1)
        return
      }
      if (index + 1 < playlist.length) setIndex(index + 1)
      else if (loopMode === 'all' && playlist.length) setIndex(0)
      else {
        setPlaying(false)
        setStatus('Playlist finished')
      }
    }
    const onErr = (): void => setStatus(`Couldn’t play ${current?.name || 'file'}`)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    el.addEventListener('error', onErr)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('error', onErr)
    }
  }, [advance, current?.name, index, loopMode, playlist.length, shuffle])

  const togglePlay = (): void => {
    const el = mediaRef.current
    if (!el || !current) return
    if (el.paused) void el.play()
    else el.pause()
  }

  const seekRatio = (ratio: number): void => {
    const el = mediaRef.current
    if (!el || !el.duration) return
    el.currentTime = Math.min(1, Math.max(0, ratio)) * el.duration
  }

  const addTracks = (tracks: Omit<Track, 'id' | 'kind'>[]): void => {
    if (!tracks.length) return
    setPlaylist((p) => {
      const mapped = tracks.map((t) => ({
        id: uid(),
        name: t.name,
        url: t.url,
        path: t.path,
        kind: kindFromName(t.name)
      }))
      const next = [...p, ...mapped]
      setIndex(p.length)
      return next
    })
    setStatus(`Added ${tracks.length} item${tracks.length === 1 ? '' : 's'}`)
    void window.desk?.noteActivity()
  }

  const openFiles = async (): Promise<void> => {
    if (window.desk?.pickMediaFile) {
      const picked = await window.desk.pickMediaFile()
      // Compat: older preload returned a single object or null
      const list = Array.isArray(picked)
        ? picked
        : picked
          ? [picked as { url: string; name: string; path: string }]
          : []
      addTracks(list)
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*,video/*'
    input.multiple = true
    input.onchange = () => {
      const files = Array.from(input.files || [])
      addTracks(files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })))
    }
    input.click()
  }

  const removeAt = (i: number): void => {
    setPlaylist((p) => {
      const next = p.filter((_, idx) => idx !== i)
      if (!next.length) {
        setIndex(0)
        setPlaying(false)
        setStatus('Playlist empty')
        return next
      }
      setIndex((cur) => {
        if (i < cur) return cur - 1
        if (i === cur) return Math.min(cur, next.length - 1)
        return cur
      })
      return next
    })
  }

  const clearPlaylist = (): void => {
    setPlaylist([])
    setIndex(0)
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setStatus('Playlist cleared')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const el = mediaRef.current
        if (el) el.currentTime = Math.min(el.duration || 0, (el.currentTime || 0) + 5)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const el = mediaRef.current
        if (el) el.currentTime = Math.max(0, (el.currentTime || 0) - 5)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setVolume((v) => Math.min(1, v + 0.05))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setVolume((v) => Math.max(0, v - 0.05))
      } else if (e.key.toLowerCase() === 'm') {
        setMuted((m) => !m)
      } else if (e.key.toLowerCase() === 'n') {
        advance(1)
      } else if (e.key.toLowerCase() === 'p') {
        advance(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  const subtitle = useMemo(() => {
    if (!playlist.length) return mode || 'No media'
    return `${index + 1}/${playlist.length} · ${status}`
  }, [playlist.length, index, status, mode])

  const cycleLoop = (): void => {
    setLoopMode((m) => (m === 'off' ? 'one' : m === 'one' ? 'all' : 'off'))
  }

  return (
    <GlassFrame
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      embedded
      actions={
        <>
          <button
            type="button"
            className={`btn btn-ghost ${showList ? 'on' : ''}`}
            onClick={() => setShowList((v) => !v)}
          >
            Playlist
          </button>
          <button type="button" className="btn" onClick={() => void openFiles()}>
            Open
          </button>
        </>
      }
    >
      <div
        className={`media-layout ${showList ? 'with-list' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDrop={(e) => {
          e.preventDefault()
          const files = Array.from(e.dataTransfer.files || []).filter(
            (f) => f.type.startsWith('audio/') || f.type.startsWith('video/') || kindFromName(f.name) !== 'unknown'
          )
          if (!files.length) return
          addTracks(files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })))
        }}
      >
        <div className="media-card">
          <div
            className={`media-art ${current?.kind === 'audio' ? 'audio' : ''} ${
              !current ? 'empty' : ''
            }`}
          >
            <video
              ref={mediaRef}
              src={current?.url}
              controls={false}
              playsInline
              key={current?.id || 'empty'}
              className={current?.kind === 'audio' ? 'media-audio-el' : undefined}
            />
            {!current ? <div className="media-art-fallback" /> : null}
            {current?.kind === 'audio' ? (
              <div className="media-audio-badge" aria-hidden>
                ♫
              </div>
            ) : null}
          </div>

          <div className="media-meta">
            <strong>
              {current ? current.name.replace(/\.[^.]+$/, '') : 'Nothing playing'}
            </strong>
            <em>
              {current
                ? current.kind === 'video'
                  ? 'Video'
                  : current.kind === 'audio'
                    ? 'Audio'
                    : 'Media'
                : 'Open files to start a playlist'}
            </em>
          </div>

          <div className="media-transport" role="group" aria-label="Transport">
            <button
              type="button"
              className="btn btn-ghost"
              aria-label="Previous"
              disabled={!playlist.length}
              onClick={() => advance(-1)}
            >
              ⏮
            </button>
            <button
              type="button"
              className="btn media-play"
              aria-label={playing ? 'Pause' : 'Play'}
              disabled={!current}
              onClick={togglePlay}
            >
              {playing ? '❚❚' : '▶'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              aria-label="Next"
              disabled={!playlist.length}
              onClick={() => advance(1)}
            >
              ⏭
            </button>
            <button
              type="button"
              className={`btn btn-ghost ${loopMode !== 'off' ? 'on' : ''}`}
              aria-label={`Loop ${loopMode}`}
              title={`Loop: ${loopMode}`}
              onClick={cycleLoop}
            >
              {loopMode === 'one' ? '🔂' : '🔁'}
            </button>
            <button
              type="button"
              className={`btn btn-ghost ${shuffle ? 'on' : ''}`}
              aria-pressed={shuffle}
              aria-label="Shuffle"
              onClick={() => setShuffle((v) => !v)}
            >
              🔀
            </button>
          </div>

          <div className="media-seek-row">
            <span className="media-time">{formatTime(currentTime)}</span>
            <input
              className="media-scrub"
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={progress}
              disabled={!current}
              onChange={(e) => seekRatio(Number(e.target.value))}
              aria-label="Seek"
            />
            <span className="media-time">{formatTime(duration)}</span>
          </div>

          <div className="media-extra">
            <label className="media-vol">
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={muted ? 'Unmute' : 'Mute'}
                onClick={() => setMuted((m) => !m)}
              >
                {muted || volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : '🔊'}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setVolume(v)
                  if (v > 0) setMuted(false)
                }}
                aria-label="Volume"
              />
            </label>
            <label className="status-line">
              Speed
              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                style={{ marginLeft: 6 }}
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                  <option key={r} value={r}>
                    {r}×
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {showList ? (
          <aside className="media-playlist" aria-label="Playlist">
            <div className="media-playlist-head">
              <strong>Playlist</strong>
              <span className="status-line">{playlist.length}</span>
              <button type="button" className="btn btn-ghost" onClick={() => void openFiles()}>
                + Add
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!playlist.length}
                onClick={clearPlaylist}
              >
                Clear
              </button>
            </div>
            {playlist.length === 0 ? (
              <p className="status-line media-playlist-empty">
                No tracks — Open adds local audio/video (multi-select).
              </p>
            ) : (
              <ul className="media-playlist-items">
                {playlist.map((t, i) => (
                  <li key={t.id} className={i === index ? 'on' : ''}>
                    <button
                      type="button"
                      className="media-playlist-item"
                      onClick={() => setIndex(i)}
                      onDoubleClick={() => {
                        setIndex(i)
                        void mediaRef.current?.play()
                      }}
                    >
                      <span className="media-pl-kind">{t.kind === 'video' ? '▶' : '♪'}</span>
                      <span className="media-pl-name">{t.name}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      aria-label={`Remove ${t.name}`}
                      onClick={() => removeAt(i)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        ) : null}
      </div>
    </GlassFrame>
  )
}
