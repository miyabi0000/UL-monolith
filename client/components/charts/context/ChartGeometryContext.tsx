import React, { createContext, useContext, useMemo } from 'react'
import { CHART_CONFIG } from '../../../utils/chartConfig'

/**
 * チャートジオメトリ (画面サイズ依存の寸法) を配る Context。
 *
 * 責務: screenSize から CHART_CONFIG の値を引き出し、ChartBody 配下の全コンポーネントで
 *       同じ値を参照できるようにする (radius / height / centerMaxWidth の props drilling 解消)。
 */

export type ScreenSize = 'mobile' | 'tablet' | 'desktop'

export interface ChartGeometry {
  screenSize:        ScreenSize
  chartHeight:       number
  outerRadiusConfig: { outer: number; inner: number }
  innerRadiusConfig: { outer: number; inner: number }
  centerMaxWidth:    number
}

const ChartGeometryContext = createContext<ChartGeometry | null>(null)

interface ProviderProps {
  screenSize: ScreenSize
  children:   React.ReactNode
}

export const ChartGeometryProvider: React.FC<ProviderProps> = ({ screenSize, children }) => {
  const value = useMemo<ChartGeometry>(
    () => ({
      screenSize,
      chartHeight:       CHART_CONFIG.height[screenSize],
      outerRadiusConfig: CHART_CONFIG.outerRadius[screenSize],
      innerRadiusConfig: CHART_CONFIG.innerRadius[screenSize],
      centerMaxWidth:    CHART_CONFIG.centerMaxWidth[screenSize],
    }),
    [screenSize],
  )
  return <ChartGeometryContext.Provider value={value}>{children}</ChartGeometryContext.Provider>
}

export const useChartGeometry = (): ChartGeometry => {
  const ctx = useContext(ChartGeometryContext)
  if (!ctx) throw new Error('useChartGeometry must be used within ChartGeometryProvider')
  return ctx
}
