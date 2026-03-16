/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        knowledge: '#FCD34D',
        evaluation: '#3B82F6',
        bulk: '#10B981',
      },
    },
  },
  plugins: [],
}
