import React from 'react';
import { COLORS } from '../../utils/designSystem';

interface CategoryBadgeProps {
  name: string;
  color?: string;
  className?: string;
  onClick?: () => void;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ name, color, className = '', onClick }) => {
  const baseColor = color || COLORS.gray[500];
  const style = {
    backgroundColor: `${baseColor}20`,
    color: baseColor,
    border: `1px solid ${baseColor}40`
  };

  const classes = `inline-flex w-[100px] items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`.trim();

  if (onClick) {
    return (
      <button type="button" className={`${classes} hover:opacity-85 transition-opacity`} style={style} onClick={onClick}>
        {name}
      </button>
    );
  }

  return (
    <span className={classes} style={style}>
      {name}
    </span>
  );
};

export default CategoryBadge;
