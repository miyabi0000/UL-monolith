import React from 'react'

const ScaleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4V19" />
    <path d="M6.5 7.5H17.5" />
    <path d="M4.5 20H19.5" />
    <path d="M7.5 7.5L4.5 12.5H10.5L7.5 7.5Z" />
    <path d="M16.5 7.5L13.5 12.5H19.5L16.5 7.5Z" />
  </svg>
)

export default ScaleIcon
