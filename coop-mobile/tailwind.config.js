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
        primary: 'rgb(var(--primary))',
        secondary: '#10b981',
        accent: '#f59e0b',
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        surface: 'rgb(var(--surface))',
        border: 'rgb(var(--border))',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        display: ['Outfit', 'System'],
      },
    },
  },
  plugins: [],
};
