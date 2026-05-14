import { NavLink } from 'react-router-dom'
import { Home, Music, Film, Search, User, Layers, Trophy, Sparkles } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/music', icon: Music, label: '音乐' },
  { to: '/movie', icon: Film, label: '影视' },
  { to: '/search', icon: Search, label: '搜索' },
  { to: '/sources', icon: Layers, label: '源管理' },
  { to: '/profile', icon: User, label: '我的' },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 lg:w-64 glass flex-col z-40">
      <div className="flex items-center justify-center lg:justify-start h-20 px-4 border-b border-dark-600/50">
        <span className="text-2xl font-display font-bold gold-gradient-text">OmniStream</span>
      </div>

      <nav className="flex-1 py-6 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-gold-500 border-l-3 border-gold-500 bg-gold-500/5'
                  : 'text-gray-400 hover:text-gray-200 border-l-3 border-transparent hover:bg-dark-700/50'
              }`
            }
          >
            <Icon size={20} />
            <span className="hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-600/50">
        <div className="hidden lg:block text-xs text-gray-500 text-center">
          OmniStream v2.0
        </div>
      </div>
    </aside>
  )
}
