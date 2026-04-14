import { useCallback, useState } from 'react'
import type { ItemId } from '../../../utils/chart/chartTypes'

/**
 * Chart / Table / Card 間の hover 連動用 state。
 *
 * 同一 id での重複更新を skip する change-detection guard を内蔵し、
 * マウス移動時の高頻度イベントでも React 再レンダリングを最小化する。
 */
export const useChartHover = () => {
  const [hoveredItemId, setRaw] = useState<ItemId | null>(null)

  const setHovered = useCallback((id: ItemId | null) => {
    setRaw((prev) => (prev === id ? prev : id))
  }, [])

  return [hoveredItemId, setHovered] as const
}
