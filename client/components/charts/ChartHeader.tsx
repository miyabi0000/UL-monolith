import React from 'react'

interface ChartHeaderProps {
  isCollapsed: boolean
  onToggleCollapsed: (collapsed: boolean) => void
  chartDisplayMode: 'pie' | 'bar'
  onChartDisplayModeChange: (mode: 'pie' | 'bar') => void
  screenSize: 'mobile' | 'tablet' | 'desktop'
}

const displayModeButtonClass = (active: boolean) =>
  `h-5 px-1.5 rounded text-2xs font-medium transition-all duration-150 inline-flex items-center gap-1 ${
    active
      ? 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-sm'
      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
  }`

/**
 * チャートパネルのヘッダー: 折りたたみトグル + Pie/Bar 表示切替
 */
const ChartHeader: React.FC<ChartHeaderProps> = ({
  isCollapsed,
  onToggleCollapsed,
  chartDisplayMode,
  onChartDisplayModeChange,
  screenSize,
}) => {
  if (isCollapsed) {
    return (
      <div
        className="flex items-center justify-between px-2 sm:px-3 py-2 flex-shrink-0"
        style={{ borderBottom: 'var(--border-divider)' }}
      >
        <div className="flex items-center justify-center w-full">
          <button
            onClick={() => onToggleCollapsed(false)}
            className={`w-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded transition-colors ${
              screenSize === 'mobile' ? 'flex-row gap-2 py-2 px-3' : 'flex-col py-2'
            }`}
            aria-label="Expand chart"
          >
            <svg
              className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${screenSize === 'mobile' ? '' : 'mb-2'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8M12 8l4 4-4 4" />
            </svg>
            <span
              className="text-xs text-gray-600 dark:text-gray-300 font-medium"
              style={screenSize === 'mobile' ? undefined : { writingMode: 'vertical-rl' }}
            >
              Chart
            </span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-between px-2 sm:px-3 py-1 flex-shrink-0 h-control"
      style={{ borderBottom: 'var(--border-divider)' }}
    >
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Chart</h3>
        <div className="inline-flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
          <button
            type="button"
            onClick={() => onChartDisplayModeChange('pie')}
            className={displayModeButtonClass(chartDisplayMode === 'pie')}
            aria-label="Pie chart"
            title="Donut chart"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 7 7A7 7 0 0 0 8 1zm0 12A5 5 0 1 1 13 8 5 5 0 0 1 8 13zm0-8a3 3 0 1 0 3 3A3 3 0 0 0 8 5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onChartDisplayModeChange('bar')}
            className={displayModeButtonClass(chartDisplayMode === 'bar')}
            aria-label="Bar chart"
            title="Horizontal bar chart"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="10" height="3" rx="1" />
              <rect x="1" y="6.5" width="14" height="3" rx="1" />
              <rect x="1" y="11" width="7" height="3" rx="1" />
            </svg>
          </button>
        </div>
      </div>
      <button
        onClick={() => onToggleCollapsed(true)}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded transition-colors"
        aria-label="Collapse chart"
      >
        <svg
          className="w-4 h-4 text-gray-600 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>
  )
}

export default ChartHeader
