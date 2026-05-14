import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import MovieCard from '@/components/MovieCard'
import { fetchMovieList } from '@/utils/api'
import type { MovieItem } from '@/store/useStore'

const genres = ['全部', '动作', '喜剧', '剧情', '科幻', '恐怖', '爱情', '动画']
const regions = ['全部', '美国', '中国', '日本', '韩国', '英国']
const sortOptions = [
  { value: 'latest', label: '最新' },
  { value: 'rating', label: '评分' },
  { value: 'popular', label: '热门' },
]

export default function Movie() {
  const [movies, setMovies] = useState<MovieItem[]>([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('全部')
  const [region, setRegion] = useState('全部')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortOpen, setSortOpen] = useState(false)

  useEffect(() => {
    setPage(1)
    setMovies([])
    setLoading(true)
    fetchMovieList({
      page: 1,
      pageSize: 20,
      genre: genre === '全部' ? undefined : genre,
      region: region === '全部' ? undefined : region,
      sort,
    })
      .then((res) => {
        setMovies(res.movies)
        setHasMore(res.movies.length >= 20)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [genre, region, sort])

  const loadMore = () => {
    const nextPage = page + 1
    fetchMovieList({
      page: nextPage,
      pageSize: 20,
      genre: genre === '全部' ? undefined : genre,
      region: region === '全部' ? undefined : region,
      sort,
    })
      .then((res) => {
        setMovies((prev) => [...prev, ...res.movies])
        setPage(nextPage)
        setHasMore(res.movies.length >= 20)
      })
      .catch(() => {})
  }

  const currentSort = sortOptions.find((s) => s.value === sort)

  return (
    <div className="container px-4 md:px-6 py-8">
      <h1 className="section-title">影视</h1>

      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                genre === g
                  ? 'gold-gradient-bg text-dark-900'
                  : 'glass text-gray-400 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  region === r
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-gray-300 hover:text-white transition-colors"
            >
              {currentSort?.label}
              <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 glass rounded-xl py-2 min-w-[120px] z-10">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setSortOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sort === opt.value ? 'text-gold-500' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <div className="aspect-[2/3] skeleton" />
              <div className="p-3">
                <div className="h-4 w-3/4 rounded skeleton mb-2" />
                <div className="h-3 w-1/2 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie, i) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <MovieCard movie={movie} />
              </motion.div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                className="px-8 py-3 rounded-full glass text-gray-300 hover:text-white hover:border-gold-500/30 transition-all"
              >
                加载更多
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
