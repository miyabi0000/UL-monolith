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
    ${hover ? 'hover:shadow-md' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const AnyComponent = Component as any;

  return (
    <AnyComponent
      className={classes}
      {...props}
    >
      {children}
    </AnyComponent>
  );
};

export default Card;
