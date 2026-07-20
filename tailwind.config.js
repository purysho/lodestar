/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#050713',
          900: '#090d20',
          800: '#101831',
        },
        starlight: '#fff4cf',
        aurora: '#9faeff',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        star: '0 0 24px rgba(255, 244, 207, 0.28)',
      },
    },
  },
  plugins: [],
}
