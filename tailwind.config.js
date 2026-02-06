/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color)',
          dark: 'var(--primary-dark-color)',
          light: 'var(--primary-light-color)',
        },
        secondary: {
          DEFAULT: 'var(--secondary-color)',
          dark: '#047857', // You might want to variable-ize these too if they change significantly
          light: '#34d399',
        },
        accent: 'var(--accent-color)',
        background: 'rgb(var(--background-rgb))', // Using the RGB var for compatibility with opacity modifiers if needed, or just standard var
        surface: 'var(--surface-color)',
        'surface-lighter': 'var(--surface-hover)', // Mapping to existing hover or new var
        border: 'var(--border-color)', // Added explicit border color
        neutral: {
          50: '#f8f9fa',
          100: '#e9ecef',
          800: '#343a40',
          900: '#212529',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'var(--mesh-gradient)', // Made dynamic
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["dark"],
  },
};
