import React from 'react'

interface ChartBreadcrumbProps {
  selectedCategoryName: string | null
  selectedItemName: string | null
  onClearAll: () => void
  onClearItem: () => void
}

/**
 * パネルヘッダーの「All / Category / Item」パンくず表示。
 *
 * All → Category → Item の 3 段まで表示。
 */
const ChartBreadcrumb: React.FC<ChartBreadcrumbProps> = ({
  selectedCategoryName,
  selectedItemName,
  onClearAll,
  onClearItem,
}) => {
  const isRoot = !selectedCategoryName && !selectedItemName

  return (
    <>
      <button
        onClick={onClearAll}
        className={`flex-shrink-0 transition-colors ${
          isRoot
            ? 'text-gray-700 dark:text-gray-200 font-medium'
            : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
        }`}
      >
        All
      </button>
      {selectedCategoryName && (
        <>
          <span className="text-gray-300 dark:text-gray-500 flex-shrink-0">/</span>
          <button
            onClick={onClearItem}
            className={`truncate max-w-[80px] transition-colors flex-shrink-0 ${
              !selectedItemName
                ? 'text-gray-700 dark:text-gray-200 font-medium'
                : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            title={selectedCategoryName}
          >
            {selectedCategoryName}
          </button>
        </>
      )}
      {selectedItemName && (
        <>
          <span className="text-gray-300 dark:text-gray-500 flex-shrink-0">/</span>
          <span
            className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[80px]"
            title={selectedItemName}
          >
            {selectedItemName}
          </span>
        </>
      )}
    </>
  )
}

export default ChartBreadcrumb
