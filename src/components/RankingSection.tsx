import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, Flame, Sparkles, Music, Film } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchRankingSummary } from '@/utils/api'

const RANK_TYPE_CONFIG: { key: string; label: string; icon: any; color: string }[] = [
  { key: 'daily', label: '日榜', icon: Calendar, color: 'text-blue-400' },
  { key: 'weekly', label: '周榜', icon: TrendingUp, color: 'text-green-400' },
  { key: 'trending', label: '飙升榜', icon: Flame, color: 'text-red-400' },
  { key: 'new_release', label: '新片榜', icon: Sparkles, color: 'text-purple-400' },
]

export default function RankingSection() {
  const [summary, setSummary] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'music' | 'movie'>('movie')
  const [activeRankType, setActiveRankType] = useState('daily')
  const navigate = useNavigate()

  useEffect(() => {
    fetchRankingSummary()
      .then(res => setSummary(res.summary))
      .catch(() => {})
  }, [])

  if (!summary) return null

  const currentData = activeTab === 'music'
    ? summary[activeRankType]?.music || []
    : summary[activeRankType]?.movies || []

  return (
    <section className="mt-12">
      <h2 className="section-title">排行榜</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {RANK_TYPE_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setActiveRankType(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeRankType === key
                ? `bg-dark-600 ${color} border border-current/30`
                : 'bg-dark-700/50 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('movie')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'movie' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'bg-dark-700/50 text-gray-400'
          }`}
        >
          <Film size={16} /> 影视
        </button>
        <button
          onClick={() => setActiveTab('music')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'music' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'bg-dark-700/50 text-gray-400'
          }`}
        >
          <Music size={16} /> 音乐
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {currentData.slice(0, 9).map((item: any, idx: number) => (
          <motion.div
            key={item.resource_id || item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(`/${activeTab === 'music' ? 'music' : 'movie'}/${item.resource_id || item.id}`)}
            className="flex items-center gap-3 p-3 rounded-xl glass cursor-pointer card-hover group"
          >
            <span className={`text-lg font-bold w-7 text-center flex-shrink-0 ${
              idx < 3 ? 'gold-gradient-text' : 'text-gray-500'
            }`}>
              {idx + 1}
            </span>
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={item.cover_url || item.poster_url || item.imageUrl || ''}
                alt={item.title || ''}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-gold-400 transition-colors">
                {item.title || '未知'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {item.artist || (item.rating ? `${item.rating}分` : '')}
              </p>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {item.play_count || 0}次播放
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
