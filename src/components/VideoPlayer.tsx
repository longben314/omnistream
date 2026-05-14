import { useEffect, useRef, useState } from 'react'
import Artplayer from 'artplayer'
import Hls from 'hls.js'
import { trackEvent, fetchSkipTimestamps } from '@/utils/api'

interface VideoPlayerProps {
  url: string
  resourceId: string
  poster?: string
  onEnded?: () => void
}

export default function VideoPlayer({ url, resourceId, poster, onEnded }: VideoPlayerProps) {
  const artRef = useRef<HTMLDivElement>(null)
  const artInstance = useRef<Artplayer | null>(null)
  const [skipData, setSkipData] = useState<{ intro?: { start: number; end: number }; outro?: { start: number; end: number } }>({})
  const skipChecked = useRef(false)

  useEffect(() => {
    if (!skipChecked.current) {
      skipChecked.current = true
      fetchSkipTimestamps(resourceId).then(res => {
        const data: any = {}
        for (const ts of res.timestamps) {
          if (ts.skipType === 'intro') data.intro = { start: ts.startTime, end: ts.endTime }
          if (ts.skipType === 'outro') data.outro = { start: ts.startTime, end: ts.endTime }
        }
        setSkipData(data)
      }).catch(() => {})
    }
  }, [resourceId])

  useEffect(() => {
    if (!artRef.current || !url) return

    const isHls = url.includes('.m3u8')

    const option: any = {
      container: artRef.current,
      url,
      poster: poster || '',
      volume: 0.8,
      autoplay: false,
      autoSize: false,
      autoMini: false,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#D4A843',
      lang: navigator.language.startsWith('zh') ? 'zh-cn' : 'en',
      moreVideoAttr: {
        crossOrigin: 'anonymous',
      },
    }

    if (isHls && Hls.isSupported()) {
      option.customType = {
        m3u8: (video: HTMLVideoElement, src: string) => {
          const hls = new Hls()
          hls.loadSource(src)
          hls.attachMedia(video)
        },
      }
      option.type = 'm3u8'
    }

    const art = new Artplayer(option)
    artInstance.current = art

    art.on('play', () => {
      trackEvent('play_start', resourceId, 'movie').catch(() => {})
    })

    art.on('video:ended', () => {
      trackEvent('play_complete', resourceId, 'movie').catch(() => {})
      onEnded?.()
    })

    art.on('video:timeupdate', () => {
      const currentTime = art.currentTime
      if (skipData.intro && currentTime >= skipData.intro.start && currentTime < skipData.intro.end) {
        art.notice.show = `片头 ${Math.floor(skipData.intro.end - currentTime)}s 后自动跳过`
        if (currentTime >= skipData.intro.end - 0.5) {
          art.currentTime = skipData.intro.end
          art.notice.show = '已跳过片头'
        }
      }
      if (skipData.outro && currentTime >= skipData.outro.start) {
        art.notice.show = '片尾开始，可跳过'
      }
    })

    return () => {
      if (art && !art.destroy) {
        art.destroy(false)
      }
      artInstance.current = null
    }
  }, [url, resourceId, poster, skipData, onEnded])

  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
      <div ref={artRef} className="w-full h-full" />
    </div>
  )
}
