import { Play, Pause } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { MusicTrack } from '@/store/useStore'

interface Props {
  track: MusicTrack
}

export default function MusicCard({ track }: Props) {
  const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying, setPlaylist, addHistory } = useStore()

  const isCurrent = currentTrack?.id === track.id

  const handlePlay = () => {
    if (isCurrent) {
      setIsPlaying(!isPlaying)
    } else {
      setCurrentTrack(track)
      setIsPlaying(true)
      setPlaylist([track])
      addHistory(track.id, track.id, 'music')
    }
  }

  return (
    <div
      className={`group glass-card card-hover p-3 cursor-pointer ${
        isCurrent ? 'border-gold-500/50 shadow-lg shadow-gold-500/10' : ''
      }`}
      onClick={handlePlay}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover img-hover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button className="w-12 h-12 rounded-full gold-gradient-bg flex items-center justify-center text-dark-900 shadow-lg">
            {isCurrent && isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
        </div>
        {isCurrent && isPlaying && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 text-xs font-medium">
            正在播放
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-white truncate mb-1">{track.title}</h3>
      <p className="text-xs text-gray-400 truncate mb-2">{track.artist}</p>

      {track.genre && (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-dark-600/80 text-gold-400 border border-dark-500/50">
          {track.genre}
        </span>
      )}
    </div>
  )
}
