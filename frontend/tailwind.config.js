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
        darkNavy: {
          500: '#1E293B',
          800: '#111827',
          900: '#0F172A',
          950: '#070B13',
        },
        accentBlue: {
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        accentEmerald: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 30px rgba(0, 0, 0, 0.3)',
        'premium-glow': '0 0 20px rgba(37, 99, 235, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
