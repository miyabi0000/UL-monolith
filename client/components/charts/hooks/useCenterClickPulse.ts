import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 中央クリック時のパルスアニメーション状態。
 *
 * `trigger()` を呼ぶと `active=true` になり、指定 ms 後に自動で `false` に戻る。
 * unmount 時のタイマーリークを防ぐため cleanup あり。
 */
export const useCenterClickPulse = (durationMs = 600) => {
  const [active, setActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = useCallback(() => {
    setActive(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setActive(false), durationMs)
  }, [durationMs])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return [active, trigger] as const
}
