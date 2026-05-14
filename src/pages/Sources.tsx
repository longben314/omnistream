import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, RefreshCw, Link, Download, Upload, Music2, Film, Layers, ToggleLeft, ToggleRight, X, ChevronDown } from 'lucide-react'
import { fetchSources, addSource, updateSource, deleteSource, importSources, exportSources, type SourceItem } from '@/utils/api'

export default function Sources() {
  const [sources, setSources] = useState<SourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newSource, setNewSource] = useState({
    name: '',
    type: 'movie' as 'music' | 'movie' | 'mixed',
    apiType: 'tmdb',
    url: '',
    config: '{}',
  })

  const loadSources = async () => {
    try {
      setLoading(true)
      const res = await fetchSources()
      setSources(res.sources || [])
    } catch {
      showMessage('error', '加载源列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSources()
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleAdd = async () => {
    if (!newSource.name.trim()) {
      showMessage('error', '请输入源名称')
      return
    }

    try {
      await addSource({
        name: newSource.name,
        type: newSource.type,
        apiType: newSource.apiType,
        url: newSource.url,
        config: newSource.config,
      })
      showMessage('success', '添加成功')
      setShowAdd(false)
      setNewSource({ name: '', type: 'movie', apiType: 'tmdb', url: '', config: '{}' })
      loadSources()
    } catch {
      showMessage('error', '添加失败')
    }
  }

  const handleToggle = async (source: SourceItem) => {
    try {
      await updateSource(source.id, { enabled: source.enabled ? 0 : 1 } as any)
      loadSources()
    } catch {
      showMessage('error', '更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSource(id)
      showMessage('success', '删除成功')
      loadSources()
    } catch {
      showMessage('error', '删除失败')
    }
  }

  const handleImport = async () => {
    if (!importUrl.trim()) {
      showMessage('error', '请输入配置地址')
      return
    }

    try {
      const res = await importSources(importUrl)
      showMessage('success', res.message || `成功导入 ${res.imported} 个源`)
      setShowImport(false)
      setImportUrl('')
      loadSources()
    } catch {
      showMessage('error', '导入失败，请检查配置地址')
    }
  }

  const handleExport = async () => {
    try {
      const data = await exportSources()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'soundflix-sources.json'
      a.click()
      URL.revokeObjectURL(url)
      showMessage('success', '导出成功')
    } catch {
      showMessage('error', '导出失败')
    }
  }

  const getTypeIcon = (type: string) => {
    if (type === 'music') return <Music2 size={16} className="text-gold-500" />
    if (type === 'movie') return <Film size={16} className="text-gold-500" />
    return <Layers size={16} className="text-gold-500" />
  }

  const getTypeLabel = (type: string) => {
    if (type === 'music') return '音乐'
    if (type === 'movie') return '影视'
    return '混合'
  }

  const getApiTypeLabel = (apiType: string) => {
    const labels: Record<string, string> = {
      tmdb: 'TMDB',
      jamendo: 'Jamendo',
      custom: '自定义',
    }
    return labels[apiType] || apiType
  }

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">源管理</h1>
          <p className="text-sm text-gray-400 mt-1">管理内容源，类似影视仓的订阅方式更新内容</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm text-gray-300 hover:text-white transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">导入</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm text-gray-300 hover:text-white transition-colors"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">导出</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient-bg text-sm text-dark-900 font-medium"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">添加源</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Link size={14} className="text-gold-500" />
                导入配置地址
              </h3>
              <button onClick={() => setShowImport(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              输入影视仓风格的配置地址，自动导入内容源。配置格式为 JSON，包含 sources 数组。
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://example.com/soundflix-sources.json"
                className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded-lg gold-gradient-bg text-sm text-dark-900 font-medium flex-shrink-0"
              >
                导入
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">添加新源</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">源名称 *</label>
                <input
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="如：TMDB 热门影视"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">类型</label>
                <div className="relative">
                  <select
                    value={newSource.type}
                    onChange={(e) => setNewSource({ ...newSource, type: e.target.value as any })}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500 appearance-none"
                  >
                    <option value="movie">影视</option>
                    <option value="music">音乐</option>
                    <option value="mixed">混合</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">API 类型</label>
                <div className="relative">
                  <select
                    value={newSource.apiType}
                    onChange={(e) => setNewSource({ ...newSource, apiType: e.target.value })}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500 appearance-none"
                  >
                    <option value="tmdb">TMDB</option>
                    <option value="jamendo">Jamendo</option>
                    <option value="custom">自定义</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">API 地址</label>
                <input
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="自定义 API 地址（可选）"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">配置 JSON</label>
                <textarea
                  value={newSource.config}
                  onChange={(e) => setNewSource({ ...newSource, config: e.target.value })}
                  placeholder='{"apiKey": "xxx", "language": "zh-CN"}'
                  rows={3}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg gold-gradient-bg text-sm text-dark-900 font-medium"
              >
                添加
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="text-gold-500 animate-spin" />
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16">
          <Layers size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">暂无内容源</p>
          <p className="text-sm text-gray-500 mt-1">添加源或导入配置地址来获取内容</p>
          <p className="text-xs text-gray-600 mt-4">
            未添加源时，系统将使用默认的 Jamendo 和 TMDB 源
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 card-hover"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
                    {getTypeIcon(source.type)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{source.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-gray-400">
                        {getTypeLabel(source.type)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-gray-400">
                        {getApiTypeLabel(source.apiType)}
                      </span>
                      {source.url && (
                        <span className="text-xs text-gray-500 truncate max-w-[120px]" title={source.url}>
                          {source.url}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button
                    onClick={() => handleToggle(source)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title={source.enabled ? '禁用' : '启用'}
                  >
                    {source.enabled ? (
                      <ToggleRight size={22} className="text-gold-500" />
                    ) : (
                      <ToggleLeft size={22} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <section className="mt-12">
        <h2 className="section-title flex items-center gap-2">
          <Link size={20} className="text-gold-500" />
          配置格式说明
        </h2>
        <div className="glass-card p-4">
          <p className="text-sm text-gray-300 mb-3">
            影视仓风格的配置地址指向一个 JSON 文件，格式如下：
          </p>
          <pre className="bg-dark-900 rounded-lg p-4 text-xs text-gray-400 overflow-x-auto font-mono">
{`{
  "name": "声影汇默认源",
  "version": "1.0",
  "sources": [
    {
      "name": "TMDB 热门影视",
      "type": "movie",
      "apiType": "tmdb",
      "config": {
        "apiKey": "your-api-key",
        "language": "zh-CN",
        "pages": 2
      }
    },
    {
      "name": "Jamendo 音乐",
      "type": "music",
      "apiType": "jamendo",
      "config": {
        "clientId": "your-client-id",
        "genres": ["rock", "pop", "jazz"]
      }
    },
    {
      "name": "自定义源",
      "type": "movie",
      "apiType": "custom",
      "url": "https://api.example.com/movies",
      "config": {
        "resultsKey": "data",
        "titleKey": "name",
        "posterKey": "image"
      }
    }
  ]
}`}
          </pre>
        </div>
      </section>
    </div>
  )
}
