module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Etsy-inspired primary colors
        'etsy': {
          'orange': '#F16623',
          'orange-light': '#FF8C42',
          'orange-dark': '#D14E1A',
          'cream': '#F7F5F3',
        },
        // Warm neutral foundation
        'warm': {
          'white': '#FDFCFB',
          'cream': '#F7F5F3',
          'gray-50': '#F5F4F2',
          'gray-100': '#E8E6E3',
          'gray-200': '#D1CDC7',
          'gray-300': '#B8B5B0',
          'gray-400': '#9B9792',
          'gray-500': '#6B6862',
          'gray-600': '#57544F',
          'gray-700': '#43413C',
          'gray-800': '#3C3A35',
          'gray-900': '#2D2B26',
        },
        // Supporting accent colors
        'sage': {
          DEFAULT: '#9CAF88',
          'light': '#B8C5A8',
          'dark': '#7A9268',
        },
        'dusty-rose': {
          DEFAULT: '#D4A5A5',
          'light': '#E2BFBF',
          'dark': '#C78B8B',
        },
        'warm-blue': {
          DEFAULT: '#7BA7BC',
          'light': '#A5C1D1',
          'dark': '#5A8CA7',
        },
        'lavender': {
          DEFAULT: '#B8A9C9',
          'light': '#CCC1D7',
          'dark': '#9F8AB5',
        },
        // Enhanced semantic colors
        'success': '#86A873',
        'warning': '#E6B35C',
        'error': '#D47373',
        'info': '#7BA7BC',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
