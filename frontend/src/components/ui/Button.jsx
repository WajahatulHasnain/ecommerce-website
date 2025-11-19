import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-etsy-orange hover:bg-etsy-orange-dark text-white shadow-soft hover:shadow-medium transform hover:-translate-y-0.5 focus:ring-etsy-orange focus:ring-opacity-30',
    secondary: 'bg-warm-gray-100 hover:bg-warm-gray-200 text-warm-gray-700 hover:text-warm-gray-800 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5 focus:ring-warm-gray-300',
    outline: 'border-2 border-etsy-orange text-etsy-orange hover:bg-etsy-orange hover:text-white focus:ring-etsy-orange focus:ring-opacity-30',
    ghost: 'text-warm-gray-600 hover:text-etsy-orange hover:bg-warm-gray-50 focus:ring-etsy-orange focus:ring-opacity-30',
    success: 'bg-sage hover:bg-success text-white shadow-soft hover:shadow-medium focus:ring-sage focus:ring-opacity-30',
    warning: 'bg-warning hover:bg-yellow-600 text-white shadow-soft hover:shadow-medium focus:ring-warning focus:ring-opacity-30',
    danger: 'bg-error hover:bg-red-600 text-white shadow-soft hover:shadow-medium focus:ring-error focus:ring-opacity-30',
    soft: 'bg-warm-cream hover:bg-warm-gray-100 text-warm-gray-700 hover:text-warm-gray-800 focus:ring-warm-gray-300'
  };
  
  const sizes = {
    xs: 'px-3 py-1.5 text-xs rounded-lg',
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
    xl: 'px-10 py-5 text-xl rounded-2xl'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
