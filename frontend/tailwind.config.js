/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        classroom: {
          bg: '#1a1f2e',
          surface: '#242938',
          border: '#2e3548',
          accent: '#4f8ef7',
        },
        emotion: {
          curious: '#60a5fa',
          confused: '#f59e0b',
          bored: '#6b7280',
          frustrated: '#ef4444',
          engaged: '#22c55e',
        },
      },
    },
  },
  plugins: [],
}