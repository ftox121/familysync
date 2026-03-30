/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: 'hsl(262, 60%, 55%)', foreground: 'hsl(0,0%,100%)' },
        accent:  { DEFAULT: 'hsl(38, 85%, 52%)',  foreground: 'hsl(0,0%,100%)' },
        success: { DEFAULT: 'hsl(142, 50%, 40%)', foreground: 'hsl(0,0%,100%)' },
        warning: { DEFAULT: 'hsl(38, 85%, 52%)',  foreground: 'hsl(0,0%,100%)' },
        destructive: { DEFAULT: 'hsl(0, 72%, 55%)', foreground: 'hsl(0,0%,100%)' },
      },
    },
  },
  plugins: [],
}
