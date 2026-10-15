/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Turkish Flat UI Palette
        'light-indigo': '#7158e2',
        'light-slate-blue': '#7d5fff',
        'spiro-disco-ball': '#17c0eb',
        'neon-blue': '#18dcff',
        'hammam-blue': '#67e6dc',
        'electric-blue': '#7efff5',
        'bright-lilac': '#cd84f1',
        'light-purple': '#c56cf0',
        'weird-green': '#3ae374',
        'wintergreen': '#32ff7e',
        'radiant-yellow': '#ff9f1a',
        'mandarin-sorbet': '#ffaf40',
        'dorn-yellow': '#fff200',
        'unmellow-yellow': '#fffa65',
        'light-red': '#ff4d4d',
        'red-orange': '#ff3838',
        'young-salmon': '#ffb8b8',
        'pretty-please': '#ffcccc',
        'baltic-sea': '#3d3d3d',
        'shadowed-steel': '#4b4b4b',
        // App Theme Specific Extensions
        dark: {
          base: '#1e1e24',
          surface: '#2b2b36',
          card: '#3d3d3d',
          border: '#4b4b4b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
