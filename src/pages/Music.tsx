import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import MusicCard from '@/components/MusicCard'
import { fetchMusicList } from '@/utils/api'
import type { MusicTrack } from '@/store/useStore'

const genres = ['全部', '流行', '摇滚', '电子', '爵士', '古典', '民谣', 'R&B']
const sortOptions = [
  { value: 'latest', label: '最新' },
  { value: 'popular', label: '最热' },
  { value: 'name', label: '名称' },
]

export default function Music() {
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('全部')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortOpen, setSortOpen] = useState(false)

  useEffect(() => {
    setPage(1)
    setTracks([])
    setLoading(true)
    fetchMusicList({ page: 1, pageSize: 20, genre: genre === '全部' ? undefined : genre, sort })
      .then((res) => {
        setTracks(res.tracks)
        setHasMore(res.tracks.length >= 20)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [genre, sort])

  const loadMore = () => {
    const nextPage = page + 1
    fetchMusicList({ page: nextPage, pageSize: 20, genre: genre === '全部' ? undefined : genre, sort })
      .then((res) => {
        setTracks((prev) => [...prev, ...res.tracks])
        setPage(nextPage)
        setHasMore(res.tracks.length >= 20)
      })
      .catch(() => {})
  }

  const currentSort = sortOptions.find((s) => s.value === sort)

  return (
    <div className="container px-4 md:px-6 py-8">
      <h1 className="section-title">音乐</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2 flex-1">
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

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="glass-card p-3">
              <div className="aspect-square rounded-lg skeleton mb-3" />
              <div className="h-4 w-3/4 rounded skeleton mb-2" />
              <div className="h-3 w-1/2 rounded skeleton" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <MusicCard track={track} />
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
