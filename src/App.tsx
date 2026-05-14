import { Component, type ReactNode } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import MusicPlayer from '@/components/MusicPlayer'
import ParticleBackground from '@/components/ParticleBackground'
import { TVNavigationProvider } from '@/hooks/useTVNavigation.tsx'
import Home from '@/pages/Home'
import Music from '@/pages/Music'
import MusicDetail from '@/pages/MusicDetail'
import Movie from '@/pages/Movie'
import MovieDetail from '@/pages/MovieDetail'
import Search from '@/pages/Search'
import Profile from '@/pages/Profile'
import Sources from '@/pages/Sources'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  state = { hasError: false, error: undefined as Error | undefined }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-4">页面加载出错</h2>
            <p className="text-gray-400 mb-6 text-sm">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: undefined }); window.location.reload() }}
              className="px-6 py-3 rounded-full gold-gradient-bg text-dark-900 font-medium"
            >
              重新加载
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/music" element={<Music />} />
          <Route path="/music/:id" element={<MusicDetail />} />
          <Route path="/movie" element={<Movie />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/sources" element={<Sources />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <TVNavigationProvider>
          <div className="min-h-screen bg-dark-900">
            <ParticleBackground />
            <Sidebar />
            <main className="md:ml-20 lg:ml-64 pb-20 md:pb-24 relative z-10">
              <AnimatedRoutes />
            </main>
            <MusicPlayer />
            <MobileNav />
          </div>
        </TVNavigationProvider>
      </Router>
    </ErrorBoundary>
  )
}
