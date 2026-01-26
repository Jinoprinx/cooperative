/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color, #3b82f6)', // Dynamic with Fallback
          dark: 'var(--primary-dark-color, #1d4ed8)',
          light: 'var(--primary-light-color, #60a5fa)',
        },
        secondary: {
          DEFAULT: '#10b981', // Emerald
          dark: '#047857',
          light: '#34d399',
        },
        accent: '#f59e0b', // Amber
        background: '#0a0a0b',
        surface: '#161618',
        'surface-lighter': '#232326',
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
        'mesh-gradient': 'radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(245, 158, 11, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(37, 99, 235, 0.1) 0px, transparent 50%)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["dark"],
  },
};
