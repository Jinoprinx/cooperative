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
        primary: '#1a73e8',
        'primary-dark': '#0f5bbf',
        'primary-light': '#e8f0fe',
        secondary: '#fbbc05',
        'secondary-dark': '#e3a700',
        accent: '#34a853',
        neutral: '#5f6368',
        'base-100': '#ffffff',
        info: '#4285f4',
        success: '#34a853',
        warning: '#fbbc05',
        error: '#ea4335',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["light", "dark"],
  },
};
