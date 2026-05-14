import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import HeroCarousel from '@/components/HeroCarousel'
import MusicCard from '@/components/MusicCard'
import MovieCard from '@/components/MovieCard'
import RankingSection from '@/components/RankingSection'
import RecommendationSection from '@/components/RecommendationSection'
import { fetchHomeData } from '@/utils/api'
import type { MusicTrack, MovieItem } from '@/store/useStore'

function SkeletonCard() {
  return (
    <div className="glass-card p-3">
      <div className="aspect-square rounded-lg skeleton mb-3" />
      <div className="h-4 w-3/4 rounded skeleton mb-2" />
      <div className="h-3 w-1/2 rounded skeleton" />
    </div>
  )
}

function SkeletonMovieCard() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="aspect-[2/3] skeleton" />
      <div className="p-3">
        <div className="h-4 w-3/4 rounded skeleton mb-2" />
        <div className="h-3 w-1/2 rounded skeleton" />
      </div>
    </div>
  )
}

export default function Home() {
  const [data, setData] = useState<{
    featured: any[]
    hotMusic: MusicTrack[]
    hotMovies: MovieItem[]
    latestMusic: MusicTrack[]
    latestMovies: MovieItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchHomeData()
      .then((res) => {
        const featuredMovies = res.hotMovies?.filter((m: MovieItem) => m.backdropUrl) || []
        setData({ ...res, featured: featuredMovies })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      {loading ? (
        <div className="h-[50vh] md:h-[70vh] skeleton" />
      ) : (
        data?.featured && <HeroCarousel items={data.featured} />
      )}

      <div className="container px-4 md:px-6 py-8 space-y-12">
        <RecommendationSection />

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">热门音乐</h2>
            <button
              onClick={() => navigate('/music')}
              className="flex items-center gap-1 text-sm text-gold-500 hover:text-gold-400 transition-colors"
            >
              查看更多 <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-40 md:w-48">
                    <SkeletonCard />
                  </div>
                ))
              : data?.hotMusic.map((track) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-shrink-0 w-40 md:w-48"
                  >
                    <MusicCard track={track} />
                  </motion.div>
                ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">热门影视</h2>
            <button
              onClick={() => navigate('/movie')}
              className="flex items-center gap-1 text-sm text-gold-500 hover:text-gold-400 transition-colors"
            >
              查看更多 <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-36 md:w-44">
                    <SkeletonMovieCard />
                  </div>
                ))
              : data?.hotMovies.map((movie) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-shrink-0 w-36 md:w-44"
                  >
                    <MovieCard movie={movie} />
                  </motion.div>
                ))}
          </div>
        </section>

        <RankingSection />

        <section>
          <h2 className="section-title">最新音乐</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : data?.latestMusic.map((track) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <MusicCard track={track} />
                  </motion.div>
                ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">最新影视</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonMovieCard key={i} />
                ))
              : data?.latestMovies.map((movie) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <MovieCard movie={movie} />
                  </motion.div>
                ))}
          </div>
        </section>
      </div>
    </div>
  )
}
