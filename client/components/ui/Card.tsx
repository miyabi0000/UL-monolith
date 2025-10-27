import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

const Card: React.FC<CardProps> = ({
  hover = false,
  children,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  const classes = `
    card
    transition-shadow
    ${hover ? 'hover:shadow-md dark:hover:shadow-dark-md' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <Component
      className={classes}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;