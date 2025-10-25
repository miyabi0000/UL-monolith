import React from 'react';
import { getCardStyle, CardVariant, RADIUS_SCALE } from '../../utils/designSystem';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  hover = false,
  children,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  const baseClasses = `
    transition-shadow
    ${className}
  `.trim();

  const cardStyle = variant === 'hover' && hover
    ? getCardStyle('hover')
    : getCardStyle(variant);

  return (
    <Component
      className={baseClasses}
      style={{
        ...cardStyle,
        borderRadius: `${RADIUS_SCALE.md}px`,
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;