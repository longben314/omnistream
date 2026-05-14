import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[data-focusable]',
].join(', ')

function getFocusableElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => {
      const html = el as HTMLElement
      return html.offsetParent !== null && !html.hasAttribute('disabled')
    }
  ) as HTMLElement[]
}

function getCurrentIndex(elements: HTMLElement[]): number {
  const active = document.activeElement
  return elements.findIndex((el) => el === active)
}

function isTV(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return (
    ua.includes('tv') ||
    ua.includes('smart-tv') ||
    ua.includes('netcast') ||
    ua.includes('tizen') ||
    ua.includes('webos') ||
    ua.includes('android tv') ||
    (window.innerWidth >= 1920 && 'gamepad' in navigator)
  )
}

export function useTVNavigation() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isTV()) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const elements = getFocusableElements()
      if (elements.length === 0) return

      const currentIndex = getCurrentIndex(elements)
      let handled = false

      switch (e.key) {
        case 'ArrowUp':
        case 'Up': {
          const prev = currentIndex > 0 ? currentIndex - 1 : elements.length - 1
          elements[prev]?.focus()
          handled = true
          break
        }
        case 'ArrowDown':
        case 'Down': {
          const next = currentIndex < elements.length - 1 ? currentIndex + 1 : 0
          elements[next]?.focus()
          handled = true
          break
        }
        case 'ArrowLeft':
        case 'Left': {
          if (currentIndex > 0) {
            elements[currentIndex - 1]?.focus()
          }
          handled = true
          break
        }
        case 'ArrowRight':
        case 'Right': {
          if (currentIndex < elements.length - 1) {
            elements[currentIndex + 1]?.focus()
          }
          handled = true
          break
        }
        case 'Backspace':
        case 'Escape': {
          navigate(-1)
          handled = true
          break
        }
        case 'Enter': {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.click()
          }
          handled = true
          break
        }
      }

      if (handled) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [navigate])
}

export function TVNavigationProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTV()) return

      const elements = getFocusableElements()
      if (elements.length === 0) return

      const currentIndex = getCurrentIndex(elements)
      let handled = false

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight': {
          const isVertical = e.key === 'ArrowUp' || e.key === 'ArrowDown'
          const direction = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1

          if (isVertical || elements.length <= 8) {
            const next = currentIndex + direction
            if (next >= 0 && next < elements.length) {
              elements[next]?.focus()
            } else if (next >= elements.length) {
              elements[0]?.focus()
            } else {
              elements[elements.length - 1]?.focus()
            }
          } else {
            const next = currentIndex + direction
            if (next >= 0 && next < elements.length) {
              elements[next]?.focus()
            }
          }
          handled = true
          break
        }
        case 'Backspace':
        case 'Escape': {
          navigate(-1)
          handled = true
          break
        }
        case 'Enter': {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.click()
          }
          handled = true
          break
        }
      }

      if (handled) {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [navigate])

  return <>{children}</>
}
