/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,jsx,tsx,ts}"],
  theme: {
    screens: {
        'xsm': '320px',
        'sm': '425px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      },
    extend: {
      animation: {
        fadeIn: 'fadeIn 200ms ease-in-out',
        scaleIn: 'scaleIn 200ms ease-out',
        slideUp: 'slideUp 500ms ease-out',
        slideInLeft: 'slideInLeft 400ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        }
      }
    },
  },
  plugins: [],
}
