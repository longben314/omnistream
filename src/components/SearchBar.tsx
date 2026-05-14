import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  onSearch: (query: string) => void
  category?: 'music' | 'movie'
  onCategoryChange?: (cat: 'music' | 'movie') => void
  placeholder?: string
}

export default function SearchBar({ onSearch, category, onCategoryChange, placeholder = '搜索音乐或影视...' }: Props) {
  const [query, setQuery] = useState('')
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>>()

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (timer) clearTimeout(timer)
      const t = setTimeout(() => onSearch(value), 300)
      setTimer(t)
    },
    [onSearch, timer]
  )

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {category && onCategoryChange && (
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => onCategoryChange('music')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              category === 'music'
                ? 'gold-gradient-bg text-dark-900'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            音乐
          </button>
          <button
            onClick={() => onCategoryChange('movie')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              category === 'movie'
                ? 'gold-gradient-bg text-dark-900'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            影视
          </button>
        </div>
      )}

      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-4 rounded-2xl bg-dark-800/80 border border-dark-600/50 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all text-base"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
