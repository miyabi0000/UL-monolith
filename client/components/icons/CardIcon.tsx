import React from 'react'

const CardIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3"  y="4"  width="8" height="7" rx="1" />
    <rect x="13" y="4"  width="8" height="7" rx="1" />
    <rect x="3"  y="13" width="8" height="7" rx="1" />
    <rect x="13" y="13" width="8" height="7" rx="1" />
  </svg>
)

export default CardIcon
