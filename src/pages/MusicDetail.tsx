import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Download, Heart, Clock, Music2, Calendar, Disc } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { fetchMusicById } from '@/utils/api'
import MusicCard from '@/components/MusicCard'
import type { MusicTrack } from '@/store/useStore'

export default function MusicDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying, setPlaylist, toggleFavorite, favorites, addHistory } = useStore()
  const [track, setTrack] = useState<MusicTrack | null>(null)
  const [related] = useState<MusicTrack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchMusicById(id)
      .then((res) => {
        const data = res.track
        setTrack(data)
        addHistory(data.id, data.id, 'music')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, addHistory])

  const isFavorited = favorites.some((f) => f.resourceId === id && f.resourceType === 'music')

  const handlePlay = () => {
    if (!track) return
    setCurrentTrack(track)
    setIsPlaying(true)
    setPlaylist([track])
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="container px-4 md:px-6 py-8">
        <div className="h-80 rounded-2xl skeleton mb-8" />
        <div className="h-8 w-1/3 rounded skeleton mb-4" />
        <div className="h-6 w-1/4 rounded skeleton" />
      </div>
    )
  }

  if (!track) {
    return (
      <div className="container px-4 md:px-6 py-8 text-center">
        <p className="text-gray-400">未找到该音乐</p>
        <button onClick={() => navigate('/music')} className="mt-4 text-gold-500 hover:text-gold-400">
          返回音乐列表
        </button>
      </div>
    )
  }

  const isCurrent = currentTrack?.id === track.id

  return (
    <div className="min-h-screen">
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />
      </div>

      <div className="container px-4 md:px-6 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
          >
            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 pt-4"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">{track.title}</h1>
            <p className="text-lg text-gray-400 mb-4">{track.artist}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
              {track.album && (
                <div className="flex items-center gap-1.5">
                  <Disc size={14} className="text-gold-500" />
                  {track.album}
                </div>
              )}
              {track.genre && (
                <div className="flex items-center gap-1.5">
                  <Music2 size={14} className="text-gold-500" />
                  {track.genre}
                </div>
              )}
              {track.year > 0 && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-gold-500" />
                  {track.year}
                </div>
              )}
              {track.duration > 0 && (
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-gold-500" />
                  {formatDuration(track.duration)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-8 py-3 rounded-full gold-gradient-bg text-dark-900 font-medium hover:opacity-90 transition-opacity"
              >
                <Play size={18} />
                {isCurrent && isPlaying ? '正在播放' : '播放'}
              </button>

              {track.downloadUrl && (
                <a
                  href={track.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-full glass text-white font-medium hover:bg-dark-700/80 transition-colors"
                >
                  <Download size={18} />
                  下载
                </a>
              )}

              <button
                onClick={() => toggleFavorite(track.id, track.id, 'music')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  isFavorited
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                    : 'glass text-gray-300 hover:text-white'
                }`}
              >
                <Heart size={18} className={isFavorited ? 'fill-gold-400' : ''} />
                {isFavorited ? '已收藏' : '收藏'}
              </button>
            </div>
          </motion.div>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="section-title">相关推荐</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {related.map((t) => (
                <MusicCard key={t.id} track={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
