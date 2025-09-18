import React from 'react';
import { getCardStyle, CardVariant } from '../../utils/designSystem';

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
    transition-all
    duration-300
    ${hover ? 'hover:shadow-lg' : ''}
    ${className}
  `.trim();

  return (
    <Component
      className={baseClasses}
      style={getCardStyle(variant)}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;