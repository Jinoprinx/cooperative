/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'primary-dark': '#1d4ed8',
        'primary-light': '#60a5fa',
        secondary: '#10b981',
        accent: '#f59e0b',
        background: '#050505',
        surface: '#111111',
        'surface-hover': '#1a1a1a',
        border: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        display: ['Outfit', 'System'],
      },
    },
  },
  plugins: [],
};
