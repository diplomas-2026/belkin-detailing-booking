/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#05060a',
        surface: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.10)',
        text: 'rgba(255,255,255,0.92)',
        muted: 'rgba(255,255,255,0.62)',
        accent: '#7c3aed',
        accent2: '#0ea5e9',
        danger: '#ff453a',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.60)',
        soft: '0 0 0 1px rgba(255,255,255,0.06), 0 18px 50px rgba(0,0,0,0.50)',
      },
      borderRadius: {
        xl: '18px',
      },
    },
  },
  plugins: [],
}

