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
    extend: {},
  },
  plugins: [],
}

