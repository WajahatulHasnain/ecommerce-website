import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  variant = 'primary',
  padding = 'p-3 sm:p-4 md:p-6', // Mobile-first responsive padding
  hover = false,
  elevated = false,
  ...props 
}) => {
  const baseClasses = 'bg-white border border-warm-gray-100 overflow-hidden';
  
  const variants = {
    primary: 'rounded-lg sm:rounded-xl md:rounded-2xl shadow-soft',
    elevated: 'rounded-lg sm:rounded-xl md:rounded-2xl shadow-medium transform hover:-translate-y-1',
    soft: 'rounded-lg sm:rounded-xl shadow-soft bg-warm-gray-50',
    product: 'rounded-lg sm:rounded-xl md:rounded-2xl shadow-soft group cursor-pointer transform hover:-translate-y-2',
    admin: 'rounded-lg sm:rounded-xl shadow-soft',
    dashboard: 'rounded-lg sm:rounded-xl md:rounded-2xl shadow-soft bg-gradient-to-br from-white to-warm-gray-50'
  };
  
  const hoverEffect = hover ? 'hover:shadow-medium transition-all duration-300' : '';
  const elevatedEffect = elevated ? 'hover:shadow-large transition-all duration-300 hover:border-etsy-orange-light' : '';
  
  return (
    <div
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${hoverEffect}
        ${elevatedEffect}
        ${padding} 
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
