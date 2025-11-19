import React from 'react';

const Input = ({ 
  label, 
  error, 
  className = '', 
  variant = 'primary',
  icon,
  helpText,
  ...props 
}) => {
  const variants = {
    primary: 'input-primary',
    search: 'input-search',
    soft: 'w-full px-4 py-3 bg-warm-gray-50 border-2 border-warm-gray-200 rounded-xl focus:border-etsy-orange focus:ring-4 focus:ring-etsy-orange focus:ring-opacity-20 transition-all duration-200 placeholder-warm-gray-400 text-warm-gray-800 focus:outline-none focus:bg-white',
    modern: 'w-full px-4 py-4 bg-white border-2 border-warm-gray-200 rounded-2xl focus:border-etsy-orange focus:ring-4 focus:ring-etsy-orange/20 transition-all duration-300 placeholder-warm-gray-400 text-warm-gray-800 focus:outline-none shadow-soft hover:shadow-medium focus:shadow-medium'
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-warm-gray-700 mb-3">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`
            ${variants[variant]}
            ${icon ? 'pl-12' : ''}
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
      </div>
      {helpText && !error && (
        <p className="mt-2 text-sm text-warm-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-error flex items-center font-medium">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
