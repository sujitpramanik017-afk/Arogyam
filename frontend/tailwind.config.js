/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#38abf8',
          500: '#0e8fe9',
          600: '#0271c7',
          700: '#035ba1',
          800: '#074e85',
          900: '#0c416e',
          950: '#082a4a',
        },
        sanaka: {
          blue: '#16529B',
          dark: '#1E293B',
          light: '#F8FAFC',
          accent: '#0D9488',
        }
      }
    },
  },
  plugins: [],
}
