import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Download, Clock, Calendar, Globe, Film, User, Play, SkipForward } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { fetchMovieById, trackEvent, fetchSkipTimestamps, submitSkipTimestamp } from '@/utils/api'
import RatingCircle from '@/components/RatingCircle'
import MovieCard from '@/components/MovieCard'
import VideoPlayer from '@/components/VideoPlayer'
import type { MovieItem } from '@/store/useStore'

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toggleFavorite, favorites, addHistory, addPendingEvent } = useStore()
  const [movie, setMovie] = useState<MovieItem | null>(null)
  const [related] = useState<MovieItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showPlayer, setShowPlayer] = useState(false)
  const [playerUrl, setPlayerUrl] = useState('')
  const [skipInfo, setSkipInfo] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setShowPlayer(false)
    fetchMovieById(id)
      .then((res) => {
        const data = res.movie
        setMovie({ ...data, downloadLinks: res.downloadLinks || [] })
        addHistory(data.id, data.id, 'movie')
        addPendingEvent('play_start', data.id, 'movie')

        fetchSkipTimestamps(data.id).then(skipRes => {
          if (skipRes.timestamps && skipRes.timestamps.length > 0) {
            setSkipInfo(skipRes.timestamps)
          }
        }).catch(() => {})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, addHistory, addPendingEvent])

  const isFavorited = favorites.some((f) => f.resourceId === id && f.resourceType === 'movie')

  const handlePlay = (url: string) => {
    setPlayerUrl(url)
    setShowPlayer(true)
    if (id) {
      trackEvent('play_start', id, 'movie').catch(() => {})
    }
  }

  const handlePlayerEnded = () => {
    if (id) {
      trackEvent('play_complete', id, 'movie').catch(() => {})
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-64 md:h-96 skeleton" />
        <div className="container px-4 md:px-6 py-8">
          <div className="h-8 w-1/3 rounded skeleton mb-4" />
          <div className="h-6 w-1/4 rounded skeleton" />
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="container px-4 md:px-6 py-8 text-center">
        <p className="text-gray-400">未找到该影视</p>
        <button onClick={() => navigate('/movie')} className="mt-4 text-gold-500 hover:text-gold-400">
          返回影视列表
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {showPlayer && playerUrl ? (
        <div className="container px-4 md:px-6 py-4">
          <VideoPlayer
            url={playerUrl}
            resourceId={movie.id}
            poster={movie.backdropUrl || movie.posterUrl}
            onEnded={handlePlayerEnded}
          />
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setShowPlayer(false)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              返回详情
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative h-64 md:h-[500px] overflow-hidden">
            <img
              src={movie.backdropUrl || movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-900/60 via-transparent to-transparent" />
            <button
              onClick={() => {
                const firstLink = movie.downloadLinks?.[0]
                if (firstLink?.url) {
                  handlePlay(firstLink.url)
                } else {
                  handlePlay(`https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`)
                }
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full gold-gradient-bg flex items-center justify-center text-dark-900 hover:scale-110 transition-transform shadow-lg shadow-gold-500/30"
            >
              <Play size={32} className="ml-1" />
            </button>
          </div>
        </>
      )}

      <div className="container px-4 md:px-6 -mt-40 md:-mt-60 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-40 md:w-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
          >
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-auto object-cover" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-1">{movie.title}</h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-base text-gray-400 mb-4">{movie.originalTitle}</p>
            )}

            <div className="flex items-center gap-4 mb-6">
              <RatingCircle rating={movie.rating} size={56} />
              <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                {movie.releaseDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gold-500" />
                    {movie.releaseDate.split('-')[0]}
                  </div>
                )}
                {movie.runtime > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gold-500" />
                    {movie.runtime}分钟
                  </div>
                )}
                {movie.region && (
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} className="text-gold-500" />
                    {movie.region}
                  </div>
                )}
                {movie.language && (
                  <div className="flex items-center gap-1.5">
                    <Film size={14} className="text-gold-500" />
                    {movie.language}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres?.map((g) => (
                <span key={g} className="px-3 py-1 rounded-full text-xs bg-dark-600/80 text-gold-400 border border-dark-500/50">
                  {g}
                </span>
              ))}
            </div>

            {movie.overview && (
              <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">{movie.overview}</p>
            )}

            <div className="flex gap-3 mb-8">
              <button
                onClick={() => {
                  const firstLink = movie.downloadLinks?.[0]
                  if (firstLink?.url) {
                    handlePlay(firstLink.url)
                  } else {
                    handlePlay(`https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`)
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium gold-gradient-bg text-dark-900 hover:opacity-90 transition-opacity"
              >
                <Play size={18} />
                立即播放
              </button>
              <button
                onClick={() => toggleFavorite(movie.id, movie.id, 'movie')}
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

        {skipInfo && skipInfo.length > 0 && (
          <section className="mt-8">
            <h2 className="section-title">智能跳过</h2>
            <div className="flex gap-3">
              {skipInfo.map((ts: any) => (
                <div key={ts.id} className="flex items-center gap-2 px-4 py-2 rounded-lg glass">
                  <SkipForward size={16} className="text-gold-500" />
                  <span className="text-sm text-gray-300">
                    {ts.skipType === 'intro' ? '片头' : '片尾'}: {Math.floor(ts.startTime / 60)}:{String(Math.floor(ts.startTime % 60)).padStart(2, '0')} - {Math.floor(ts.endTime / 60)}:{String(Math.floor(ts.endTime % 60)).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.cast && movie.cast.length > 0 && (
          <section className="mt-10">
            <h2 className="section-title">演职人员</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {movie.cast.map((person, i) => (
                <div key={i} className="flex-shrink-0 w-24 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-dark-700 flex items-center justify-center mb-2">
                    <User size={24} className="text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-300 truncate">{person}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.director && (
          <section className="mt-8">
            <h2 className="section-title">导演</h2>
            <p className="text-gray-300">{movie.director}</p>
          </section>
        )}

        {movie.downloadLinks && movie.downloadLinks.length > 0 && (
          <section className="mt-8">
            <h2 className="section-title">播放源</h2>
            <div className="flex flex-wrap gap-3">
              {movie.downloadLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={() => link.url && handlePlay(link.url)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl glass card-hover ${
                    link.url ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Play size={16} className="text-gold-500" />
                  <span className="text-sm font-medium text-white">{link.quality}</span>
                  {link.size && <span className="text-xs text-gray-400">({link.size})</span>}
                </button>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="section-title">相关推荐</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {related.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
