import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'lg';
  children: React.ReactNode;
}

const variantClasses = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
};

// 高さは globals.css の --control-h / --control-h-lg と整合。ティアは 2 段のみ
const sizeStyles: Record<NonNullable<ButtonProps['size']>, { height: string; padding: string; fontSize: string }> = {
  md: { height: 'var(--control-h)',    padding: '0 16px', fontSize: 'var(--gear-font-md)' },
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