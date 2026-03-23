/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'fashion-rose':   '#f43f5e',
        'fashion-pink':   '#ec4899',
        'fashion-sky':    '#38bdf8',
        'fashion-mint':   '#34d399',
        'fashion-gold':   '#f59e0b',
        'fashion-coral':  '#fb7185',
        'fashion-ocean':  '#6366f1',
        'fashion-sunset': '#f97316',
        'fashion-purple': '#a855f7',
        primary: {
          50:  '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3',
          300: '#fda4af', 400: '#fb7185', 500: '#f43f5e',
          600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337',
        },
        secondary: {
          200: '#f5d0fe', 300: '#f0abfc',
          700: '#a21caf', 800: '#86198f',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-fashion':        'linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)',
        'gradient-sunset':         'linear-gradient(135deg, #f97316 0%, #f43f5e 50%, #ec4899 100%)',
        'gradient-ocean':          'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
        'gradient-mint':           'linear-gradient(135deg, #34d399 0%, #38bdf8 100%)',
        'gradient-gold':           'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        'gradient-fashion-rose':   'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
        'gradient-fashion-sky':    'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
        'gradient-fashion-mint':   'linear-gradient(135deg, #34d399 0%, #059669 100%)',
        'gradient-fashion-sunset': 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)',
        'gradient-fashion-ocean':  'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
        'gradient-fashion-gold':   'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      },
      boxShadow: {
        'fashion':    '0 4px 24px -2px rgba(244, 63, 94, 0.15)',
        'fashion-lg': '0 8px 40px -4px rgba(244, 63, 94, 0.25)',
        'fashion-xl': '0 16px 64px -8px rgba(244, 63, 94, 0.35)',
        'neon':       '0 0 20px rgba(244, 63, 94, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)',
        'ocean':      '0 4px 24px -2px rgba(99, 102, 241, 0.2)',
        'mint':       '0 4px 24px -2px rgba(52, 211, 153, 0.2)',
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'fade-in':    'fadeIn 0.8s ease-out forwards',
        'slide-up':   'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
        fadeIn:     { from: { opacity:'0', transform:'translateY(10px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        slideUp:    { from: { opacity:'0', transform:'translateY(20px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        slideDown:  { from: { opacity:'0', transform:'translateY(-10px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        pulseSoft:  { '0%,100%': { opacity:'1' }, '50%': { opacity:'0.7' } },
      },
    },
  },
  plugins: [],
}