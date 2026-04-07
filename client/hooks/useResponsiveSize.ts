import { useSyncExternalStore } from 'react'

export type ScreenSize = 'mobile' | 'tablet' | 'desktop'

const getScreenSize = (): ScreenSize => {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// シングルトン: 何個のコンポーネントが使っても resize リスナーは1つだけ
let currentSize = getScreenSize()
const listeners = new Set<() => void>()

const handleResize = () => {
  const next = getScreenSize()
  if (next !== currentSize) {
    currentSize = next
    listeners.forEach(cb => cb())
  }
}

const subscribe = (cb: () => void) => {
  if (listeners.size === 0) {
    window.addEventListener('resize', handleResize)
  }
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
    if (listeners.size === 0) {
      window.removeEventListener('resize', handleResize)
    }
  }
}

const getSnapshot = () => currentSize

export const useResponsiveSize = (): ScreenSize => {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export const useIsMobile = (): boolean => useResponsiveSize() === 'mobile'
