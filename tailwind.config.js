/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#05070a',
          900: '#0a0e14',
          800: '#10151d',
        },
        ivory: '#f4f2ec',
        mist: 'rgba(255,255,255,0.6)',
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
