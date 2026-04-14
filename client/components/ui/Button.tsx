import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantClasses = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
};

// 高さは globals.css の --control-h-* と整合
const sizeStyles: Record<NonNullable<ButtonProps['size']>, { height: string; padding: string; fontSize: string }> = {
  xs: { height: 'var(--control-h-xs)', padding: '0 8px',  fontSize: 'var(--gear-font-xs)' },
  sm: { height: 'var(--control-h-sm)', padding: '0 12px', fontSize: 'var(--gear-font-sm)' },
  md: { height: 'var(--control-h-md)', padding: '0 16px', fontSize: 'var(--gear-font-md)' },
  lg: { height: 'var(--control-h-lg)', padding: '0 20px', fontSize: 'var(--gear-font-md)' },
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const s = sizeStyles[size];
  const classes = `
    ${variantClasses[variant]}
    inline-flex items-center justify-center
    font-medium
    disabled:opacity-50
    disabled:cursor-not-allowed
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={classes}
      disabled={disabled}
      style={{ minHeight: s.height, padding: s.padding, fontSize: s.fontSize, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;