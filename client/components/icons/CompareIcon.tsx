import React from 'react'

const CompareIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3"  y="5" width="7" height="14" rx="1" />
    <rect x="14" y="5" width="7" height="14" rx="1" />
    <path d="M12 3V21" strokeDasharray="2 2" />
  </svg>
)

export default CompareIcon
