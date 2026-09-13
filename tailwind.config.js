/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B1528',
          darkBlue: '#132238',
          card: '#1B2C45',
          gold: '#E5A93C',
          goldLight: '#F5C46B',
          bgLight: '#F4F7FA',
        }
      }
    },
  },
  plugins: [],
}
