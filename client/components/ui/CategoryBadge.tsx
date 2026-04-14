import React from 'react';
import { COLORS, getCategoryBadgeShade, mondrian } from '../../utils/designSystem';

interface CategoryBadgeProps {
  name: string;
  /** @deprecated Mondrian Matte ではカテゴリ色を使わずグレー2階調で描画 */
  color?: string;
  className?: string;
  onClick?: () => void;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ name, className = '', onClick }) => {
  const style = {
    backgroundColor: getCategoryBadgeShade(name),
    color: COLORS.text.primary,
    border: `1px solid ${mondrian.black}`,
  };

  const classes = `inline-flex w-[100px] items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${className}`.trim();

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
