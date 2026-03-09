import React from 'react'

const YenIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 4L12 10L17 4" />
    <path d="M8 12H16" />
    <path d="M8 15H16" />
    <path d="M12 10V21" />
  </svg>
)

export default YenIcon
