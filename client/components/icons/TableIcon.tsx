import React from 'react'

const TableIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="1" />
    <path d="M3 9H21" />
    <path d="M3 14H21" />
    <path d="M9 4V20" />
  </svg>
)

export default TableIcon
