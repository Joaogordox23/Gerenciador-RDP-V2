/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: ['class', '[data-color-scheme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Cores Primárias (Teal/Verde)
        primary: {
          DEFAULT: '#00AF74',
          hover: '#008C5D',
          light: '#00FCA8',
          dark: '#006946'
        },
        // Cores de Background
        dark: {
          bg: '#1F2121',
          surface: '#262828',
          card: '#2A2C2C',
          elevated: '#333535',
          border: '#3D4040'
        },
        // Cores de Texto
        text: {
          primary: '#FFFFFF',
          secondary: '#777C7C',
          muted: '#A7A9A9'
        },
        // Cores de Estado
        success: '#00AF74',
        error: '#C0152F',
        warning: '#A84B2F',
        info: '#3B82F6',
        // Cores Light Mode
        cream: {
          50: '#FCFCF9',
          100: '#FFFFFD'
        },
        charcoal: {
          700: '#1F2121',
          800: '#262828'
        }
      },
      fontFamily: {
        sans: ['FKGroteskNeue', 'Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Berkeley Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px'
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(0, 175, 116, 0.3)'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 175, 116, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 175, 116, 0.5)' }
        }
      }
    },
  },
  plugins: [],
}
