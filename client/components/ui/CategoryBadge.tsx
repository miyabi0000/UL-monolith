import React from 'react';
import { getCategoryColor, BORDERS } from '../../utils/designSystem';
import { alpha } from '../../styles/tokens';

interface CategoryBadgeProps {
  name: string;
  /** @deprecated Mondrian Matte では client が name から決定論的に色を決める */
  color?: string;
  className?: string;
  onClick?: () => void;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ name, className = '', onClick }) => {
  const accent = getCategoryColor(name);
  // BORDERS.default で width/style を継承し、color のみカテゴリ固有 accent で上書き
  const style: React.CSSProperties = {
    backgroundColor: alpha(accent, 0.12),
    color: accent,
    border: BORDERS.default,
    borderColor: alpha(accent, 0.5),
    height: 'var(--badge-h)',
    lineHeight: 1,
  };

  const classes = `inline-flex w-[100px] items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-2 text-xs font-medium ${className}`.trim();

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
