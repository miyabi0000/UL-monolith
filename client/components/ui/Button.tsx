import React from 'react';
import { getButtonStyle, ButtonVariant, FONT_SCALE } from '../../utils/designSystem';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'px-2 py-1',
  md: 'px-3 py-1.5',
  lg: 'px-4 py-2',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = `
    ${sizeClasses[size]}
    font-medium
    rounded-md
    transition-opacity
    hover:opacity-80
    ${className}
  `.trim();

  return (
    <button
      className={baseClasses}
      style={{
        ...getButtonStyle(variant),
        fontSize: `${FONT_SCALE.sm}px`,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;