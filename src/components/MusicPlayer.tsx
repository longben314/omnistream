import { useRef, useState, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, ListMusic } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { trackEvent } from '@/utils/api'

export default function MusicPlayer() {
  const { currentTrack, isPlaying, setIsPlaying, playlist, setCurrentTrack, repeatMode, shuffleMode, setRepeatMode, setShuffleMode } = useStore()
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [muted, setMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const playTrackedRef = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    audio.src = currentTrack.audioUrl
    audio.volume = muted ? 0 : volume
    if (isPlaying) {
      audio.play().catch(() => {})
    }
    playTrackedRef.current = false
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = muted ? 0 : volume
  }, [volume, muted])

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setProgress(audio.currentTime)
    if (audio.duration) setDuration(audio.duration)

    if (!playTrackedRef.current && audio.currentTime > 5 && currentTrack) {
      playTrackedRef.current = true
      trackEvent('play_start', currentTrack.id, 'music').catch(() => {})
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const bar = progressRef.current
    if (!audio || !bar) return
    const rect = bar.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * audio.duration
  }

  const handleEnded = () => {
    if (!currentTrack) return

    trackEvent('play_complete', currentTrack.id, 'music').catch(() => {})

    if (repeatMode === 'one') {
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      }
      return
    }

    const idx = playlist.findIndex((t) => t.id === currentTrack.id)

    if (shuffleMode) {
      const nextIdx = Math.floor(Math.random() * playlist.length)
      setCurrentTrack(playlist[nextIdx])
      return
    }

    if (idx < playlist.length - 1) {
      setCurrentTrack(playlist[idx + 1])
    } else if (repeatMode === 'all' && playlist.length > 0) {
      setCurrentTrack(playlist[0])
    } else {
      setIsPlaying(false)
      setProgress(0)
    }
  }

  const handlePrev = () => {
    if (!currentTrack) return
    const idx = playlist.findIndex((t) => t.id === currentTrack.id)
    if (idx > 0) setCurrentTrack(playlist[idx - 1])
  }

  const handleNext = () => {
    if (!currentTrack) return
    const idx = playlist.findIndex((t) => t.id === currentTrack.id)
    if (shuffleMode) {
      const nextIdx = Math.floor(Math.random() * playlist.length)
      setCurrentTrack(playlist[nextIdx])
    } else if (idx < playlist.length - 1) {
      setCurrentTrack(playlist[idx + 1])
    } else if (repeatMode === 'all' && playlist.length > 0) {
      setCurrentTrack(playlist[0])
    }
  }

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 md:bottom-0 left-0 right-0 md:left-20 lg:left-64 glass z-50 md:z-40">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
      />

      <div className="h-1 bg-dark-700 cursor-pointer" ref={progressRef} onClick={handleProgressClick}>
        <div
          className="h-full gold-gradient-bg transition-all duration-100"
          style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-2 md:py-3">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0 ${isPlaying ? 'vinyl-spinning' : 'vinyl-paused'}`}>
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0 hidden sm:block">
          <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
          <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShuffleMode(!shuffleMode)}
            className={`transition-colors hidden sm:block ${shuffleMode ? 'text-gold-500' : 'text-gray-400 hover:text-white'}`}
          >
            <Shuffle size={16} />
          </button>

          <button onClick={handlePrev} className="text-gray-400 hover:text-white transition-colors hidden sm:block">
            <SkipBack size={18} />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 rounded-full gold-gradient-bg flex items-center justify-center text-dark-900 hover:opacity-90 transition-opacity"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>

          <button onClick={handleNext} className="text-gray-400 hover:text-white transition-colors hidden sm:block">
            <SkipForward size={18} />
          </button>

          <button
            onClick={() => {
              const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one']
              const currentIdx = modes.indexOf(repeatMode)
              setRepeatMode(modes[(currentIdx + 1) % modes.length])
            }}
            className={`transition-colors hidden sm:block ${repeatMode !== 'none' ? 'text-gold-500' : 'text-gray-400 hover:text-white'}`}
          >
            <Repeat size={16} />
            {repeatMode === 'one' && <span className="text-[8px] absolute">1</span>}
          </button>

          <span className="text-xs text-gray-500 hidden md:block">
            {formatTime(progress)} / {formatTime(duration)}
          </span>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => setMuted(!muted)} className="text-gray-400 hover:text-white transition-colors">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false) }}
              className="w-20 accent-gold-500"
            />
          </div>

          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`transition-colors hidden sm:block ${showPlaylist ? 'text-gold-500' : 'text-gray-400 hover:text-white'}`}
          >
            <ListMusic size={16} />
          </button>
        </div>
      </div>

      {showPlaylist && playlist.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-t border-dark-600/50 px-4 py-2">
          {playlist.map((track, idx) => (
            <button
              key={track.id}
              onClick={() => { setCurrentTrack(track); setIsPlaying(true) }}
              className={`w-full flex items-center gap-3 py-2 text-left hover:bg-dark-700/50 rounded-lg px-2 transition-colors ${
                currentTrack.id === track.id ? 'text-gold-400' : 'text-gray-400'
              }`}
            >
              <span className="text-xs w-5 text-right flex-shrink-0">{idx + 1}</span>
              <img src={track.coverUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{track.title}</p>
                <p className="text-xs text-gray-500 truncate">{track.artist}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
