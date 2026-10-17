/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#edf8ff',
          100: '#dfefff',
          200: '#cfeafe',
          300: '#a7d8ff',
          400: '#7ebdff',
          500: '#5aa8ff',
          600: '#427fe5',
        },
        mint: {
          50: '#eefdf5',
          100: '#d9f8e8',
          200: '#baf0d1',
          500: '#5bc88a',
        },
        peach: {
          50: '#fff4ea',
          100: '#ffe8d0',
          200: '#ffd7ad',
          500: '#f2b66d',
        },
        rose: {
          50: '#fff0f4',
          100: '#ffe1ea',
          500: '#f2728e',
        },
      },
      boxShadow: {
        soft: '0 20px 45px rgba(105, 120, 160, 0.15)',
      },
      backgroundImage: {
        'sunset-glow': 'radial-gradient(circle at top, rgba(255,242,185,0.95), rgba(255,255,255,0) 55%)',
      },
    },
  },
  plugins: [],
};
