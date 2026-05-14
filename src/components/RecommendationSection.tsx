import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchRecommendations } from '@/utils/api'
import MovieCard from '@/components/MovieCard'
import MusicCard from '@/components/MusicCard'

export default function RecommendationSection() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isColdStart, setIsColdStart] = useState(true)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchRecommendations()
      .then(res => {
        setRecommendations(res.recommendations || [])
        setIsColdStart(res.isColdStart)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || recommendations.length === 0) return null

  const musicRecs = recommendations.filter((r: any) => r.resourceType === 'music')
  const movieRecs = recommendations.filter((r: any) => r.resourceType === 'movie')

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={20} className="text-gold-500" />
        <h2 className="section-title mb-0">
          {isColdStart ? '为你精选' : '猜你喜欢'}
        </h2>
        {!isColdStart && (
          <span className="text-xs text-gray-500 bg-dark-700/50 px-2 py-0.5 rounded-full">智能推荐</span>
        )}
      </div>

      {movieRecs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3">影视推荐</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {movieRecs.slice(0, 10).map((rec: any) => (
              <motion.div
                key={rec.resourceId || rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0 w-36 md:w-44"
              >
                <div
                  onClick={() => navigate(`/movie/${rec.resourceId || rec.id}`)}
                  className="cursor-pointer"
                >
                  <MovieCard movie={{
                    id: rec.resourceId || rec.id,
                    title: rec.title || '未知',
                    originalTitle: '',
                    overview: '',
                    posterUrl: rec.imageUrl || rec.posterUrl || '',
                    backdropUrl: '',
                    rating: typeof rec.subtitle === 'number' ? rec.subtitle : 0,
                    releaseDate: '',
                    genres: [],
                    language: '',
                    region: '',
                    runtime: 0,
                    cast: [],
                    director: '',
                    downloadLinks: [],
                    source: '',
                    createdAt: '',
                  }} />
                </div>
                {rec.reason && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{rec.reason}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {musicRecs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">音乐推荐</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {musicRecs.slice(0, 10).map((rec: any) => (
              <motion.div
                key={rec.resourceId || rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0 w-40 md:w-48"
              >
                <MusicCard track={{
                  id: rec.resourceId || rec.id,
                  title: rec.title || '未知',
                  artist: rec.subtitle || '',
                  album: '',
                  coverUrl: rec.imageUrl || rec.coverUrl || '',
                  audioUrl: '',
                  downloadUrl: '',
                  duration: 0,
                  genre: '',
                  language: '',
                  year: 0,
                  playCount: 0,
                  source: '',
                  createdAt: '',
                }} />
                {rec.reason && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{rec.reason}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
