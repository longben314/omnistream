import { NavLink } from 'react-router-dom'
import { Home, Music, Film, Search, User, Layers } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/music', icon: Music, label: '音乐' },
  { to: '/movie', icon: Film, label: '影视' },
  { to: '/sources', icon: Layers, label: '源' },
  { to: '/profile', icon: User, label: '我的' },
]

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                isActive ? 'text-gold-500' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
