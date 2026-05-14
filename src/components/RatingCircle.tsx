import { useEffect, useState } from 'react'

interface Props {
  rating: number
  size?: number
}

export default function RatingCircle({ rating, size = 48 }: Props) {
  const [offset, setOffset] = useState(0)
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const isHigh = rating >= 7

  useEffect(() => {
    const progress = (rating / 10) * circumference
    const timer = setTimeout(() => setOffset(circumference - progress), 100)
    return () => clearTimeout(timer)
  }, [rating, circumference])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="rating-circle" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(42, 48, 64, 0.8)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={isHigh ? '#D4A853' : '#6B7280'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span className={`absolute text-xs font-bold ${isHigh ? 'text-gold-400' : 'text-gray-400'}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  )
}
