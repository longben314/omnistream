import { Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MovieItem } from '@/store/useStore'

interface Props {
  movie: MovieItem
}

export default function MovieCard({ movie }: Props) {
  const navigate = useNavigate()

  return (
    <div
      className="group glass-card card-hover cursor-pointer overflow-hidden"
      onClick={() => navigate(`/movie/${movie.id}`)}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover img-hover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-dark-900/80 backdrop-blur-sm border border-gold-500/30">
          <Star size={12} className="text-gold-500 fill-gold-500" />
          <span className="text-xs font-bold text-gold-400">{movie.rating?.toFixed(1)}</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex flex-wrap gap-1">
            {movie.genres?.slice(0, 2).map((g) => (
              <span key={g} className="px-2 py-0.5 rounded-full text-xs bg-gold-500/20 text-gold-400 border border-gold-500/30">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-white truncate mb-1">{movie.title}</h3>
        <p className="text-xs text-gray-500">
          {movie.releaseDate?.split('-')[0]}
          {movie.region && ` · ${movie.region}`}
        </p>
      </div>
    </div>
  )
}
