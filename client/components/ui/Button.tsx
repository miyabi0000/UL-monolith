import React from 'react';
import { getButtonStyle, ButtonVariant, getLiquidGlassStyle } from '../../utils/designSystem';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isGlass?: boolean;
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1.5 text-xs',
  lg: 'px-4 py-2 text-sm',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isGlass = false,
  children,
  className = '',
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...props
}) => {
  const baseClasses = `
    ${sizeClasses[size]}
    font-medium
    rounded-md
    transition-all
    duration-200
    hover:scale-105
    ${className}
  `.trim();

  if (isGlass) {
    return (
      <button
        className={baseClasses}
        style={getLiquidGlassStyle()}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, getLiquidGlassStyle('hover'));
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, getLiquidGlassStyle());
          onMouseLeave?.(e);
        }}
        onMouseDown={(e) => {
          Object.assign(e.currentTarget.style, getLiquidGlassStyle('active'));
          onMouseDown?.(e);
        }}
        onMouseUp={(e) => {
          Object.assign(e.currentTarget.style, getLiquidGlassStyle('hover'));
          onMouseUp?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      className={baseClasses}
      style={getButtonStyle(variant)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;