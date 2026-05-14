import { useState, useEffect, useCallback } from 'react'
import { Play, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { MovieItem } from '@/store/useStore'

interface Props {
  items: MovieItem[]
}

export default function HeroCarousel({ items }: Props) {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % items.length)
  }, [items.length])

  useEffect(() => {
    if (items.length === 0) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, items.length])

  if (items.length === 0) return null

  const item = items[current]

  return (
    <div className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={item.backdropUrl || item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-900/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {item.genres?.slice(0, 3).map((g) => (
                <span key={g} className="px-3 py-1 rounded-full text-xs bg-gold-500/20 text-gold-400 border border-gold-500/30">
                  {g}
                </span>
              ))}
            </div>

            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-2 max-w-2xl">
              {item.title}
            </h2>

            {item.originalTitle && item.originalTitle !== item.title && (
              <p className="text-sm text-gray-400 mb-3">{item.originalTitle}</p>
            )}

            <p className="text-sm md:text-base text-gray-300 max-w-xl mb-6 line-clamp-2">
              {item.overview}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/movie/${item.id}`)}
                className="flex items-center gap-2 px-6 py-3 rounded-full gold-gradient-bg text-dark-900 font-medium hover:opacity-90 transition-opacity"
              >
                <Play size={18} />
                查看详情
              </button>
              <button
                onClick={() => navigate(`/movie/${item.id}`)}
                className="flex items-center gap-2 px-6 py-3 rounded-full glass text-white font-medium hover:bg-dark-700/80 transition-colors"
              >
                <Info size={18} />
                更多信息
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 flex gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-gold-500' : 'bg-gray-500 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
