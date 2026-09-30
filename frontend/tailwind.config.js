/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mil: {
          dark: '#030712',
          base: '#050914',
          panel: '#080E1C',
          panelHover: '#0E172E',
          card: '#0B1325',
          border: '#1E2D4A',
          borderBright: '#2E436E',
          green: '#10B981',
          greenGlow: '#00FF88',
          amber: '#F59E0B',
          amberGlow: '#FBBF24',
          cyan: '#0EA5E9',
          cyanGlow: '#38BDF8',
          red: '#EF4444',
          redGlow: '#F87171',
          slate: '#94A3B8',
          muted: '#64748B',
          text: '#F1F5F9',
        },
        decentra: {
          navy: '#050B17',
          slate: '#0F172A',
          muted: '#64748B',
          border: '#1E2D4A',
          bg: '#030712',
          card: '#080E1C',
          blue: '#1E40AF',
          blueHover: '#1D4ED8',
          accent: '#4F46E5',
          teal: '#0D9488',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        }
      },
      fontFamily: {
        tactical: ['Rajdhani', 'sans-serif'],
        hud: ['Chakra Petch', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '2xs': '0 1px 1px 0 rgba(0, 0, 0, 0.05)',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
