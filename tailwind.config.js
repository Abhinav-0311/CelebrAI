/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        stone: {
          50: '#fcf8f4', 100: '#f5ece5', 200: '#e8dacf', 300: '#cfbeb1',
          400: '#9a8273', 500: '#6f594a', 600: '#645044', 700: '#4c3b31',
          800: '#33271f', 900: '#211914', 950: '#14110e',
        },
        brand: {
          50: '#fff4ee', 100: '#ffe4d6', 200: '#ffc6ac', 300: '#ffa77f',
          400: '#f48b62', 500: '#ec7048', 600: '#d5532b', 700: '#b64020',
          800: '#91341f', 900: '#742d1f', 950: '#3e140d',
        },
        celebration: {
          gold: '#f59e0b',
          amber: '#d97706',
          emerald: '#10b981',
          rose: '#f43f5e',
          indigo: '#6366f1',
          slate: '#0f172a',
        }
      },
      fontSize: {
        xs: ['0.75rem', '1.125rem'], sm: ['0.875rem', '1.375rem'],
        base: ['0.9375rem', '1.5rem'], lg: ['1.125rem', '1.65rem'],
        xl: ['1.375rem', '1.8rem'], '2xl': ['1.75rem', '2.15rem'],
        '3xl': ['2rem', '2.375rem'], '4xl': ['2.5rem', '2.75rem'],
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Manrope', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
