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
          dark: '#047857',
          light: '#34d399',
        },
        accent: 'var(--accent-color)',
        background: 'rgb(var(--background-rgb))',
        foreground: 'var(--text-primary)',
        surface: 'var(--surface-color)',
        'surface-lighter': 'var(--surface-hover)',
        border: 'var(--border-color)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-muted': 'var(--text-muted)',
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
