import { useState, useEffect } from 'react'

export type ScreenSize = 'mobile' | 'tablet' | 'desktop'

const getScreenSize = (): ScreenSize => {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export const useResponsiveSize = (): ScreenSize => {
  const [screenSize, setScreenSize] = useState<ScreenSize>(getScreenSize)

  useEffect(() => {
    const handleResize = () => setScreenSize(getScreenSize())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return screenSize
}
