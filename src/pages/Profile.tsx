import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Clock, Trash2, Music2, Film, Settings, User } from 'lucide-react'
import { useStore } from '@/store/useStore'

export default function Profile() {
  const { favorites, history, toggleFavorite } = useStore()
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites')

  const musicFavorites = favorites.filter((f) => f.resourceType === 'music')
  const movieFavorites = favorites.filter((f) => f.resourceType === 'movie')

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="glass-card p-6 md:p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-500 via-gold-600 to-dark-700 flex items-center justify-center flex-shrink-0">
            <User size={32} className="text-dark-900" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">声影汇用户</h1>
            <p className="text-sm text-gray-400">发现、收藏、享受</p>
          </div>
        </div>

        <div className="flex gap-8 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gold-500">{favorites.length}</p>
            <p className="text-xs text-gray-400 mt-1">收藏</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gold-500">{history.length}</p>
            <p className="text-xs text-gray-400 mt-1">播放历史</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === 'favorites'
              ? 'gold-gradient-bg text-dark-900'
              : 'glass text-gray-400 hover:text-white'
          }`}
        >
          <Heart size={16} />
          收藏
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'gold-gradient-bg text-dark-900'
              : 'glass text-gray-400 hover:text-white'
          }`}
        >
          <Clock size={16} />
          历史
        </button>
      </div>

      {activeTab === 'favorites' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {musicFavorites.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-medium text-white mb-4">
                <Music2 size={18} className="text-gold-500" />
                音乐收藏 ({musicFavorites.length})
              </h3>
              <div className="space-y-2">
                {musicFavorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="flex items-center justify-between glass-card p-3 card-hover"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
                        <Music2 size={16} className="text-gold-500" />
                      </div>
                      <span className="text-sm text-gray-300 truncate">{fav.resourceId}</span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(fav.id, fav.resourceId, fav.resourceType)}
                      className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 ml-3"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {movieFavorites.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-medium text-white mb-4">
                <Film size={18} className="text-gold-500" />
                影视收藏 ({movieFavorites.length})
              </h3>
              <div className="space-y-2">
                {movieFavorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="flex items-center justify-between glass-card p-3 card-hover"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
                        <Film size={16} className="text-gold-500" />
                      </div>
                      <span className="text-sm text-gray-300 truncate">{fav.resourceId}</span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(fav.id, fav.resourceId, fav.resourceType)}
                      className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 ml-3"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {favorites.length === 0 && (
            <div className="text-center py-16">
              <Heart size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">还没有收藏内容</p>
              <p className="text-sm text-gray-500 mt-1">浏览音乐或影视，点击收藏按钮添加</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 glass-card p-3 card-hover"
                >
                  <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
                    {item.resourceType === 'music' ? (
                      <Music2 size={16} className="text-gold-500" />
                    ) : (
                      <Film size={16} className="text-gold-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{item.resourceId}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.playedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {item.resourceType === 'music' ? '音乐' : '影视'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Clock size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">暂无播放历史</p>
              <p className="text-sm text-gray-500 mt-1">播放音乐或查看影视后会自动记录</p>
            </div>
          )}
        </motion.div>
      )}

      <section className="mt-12">
        <h2 className="section-title flex items-center gap-2">
          <Settings size={20} className="text-gold-500" />
          设置
        </h2>
        <div className="glass-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">深色模式</span>
            <div className="w-10 h-6 rounded-full bg-gold-500 flex items-center justify-end px-0.5">
              <div className="w-5 h-5 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
