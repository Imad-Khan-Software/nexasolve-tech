/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: { DEFAULT: '#0b1220', surface: '#111a2e', raised: '#16213a' },
        foreground: { DEFAULT: '#f4f6fb', muted: '#8d97ad', subtle: '#5c6787' },
        border: { DEFAULT: 'rgba(244, 246, 251, 0.09)', strong: 'rgba(244, 246, 251, 0.16)' },
        accent: { DEFAULT: '#4fc3ff', hover: '#7ad4ff', muted: 'rgba(79, 195, 255, 0.12)' },
        danger: { DEFAULT: '#f2545b', muted: 'rgba(242, 84, 91, 0.12)' },
        success: { DEFAULT: '#3ecf8e', muted: 'rgba(62, 207, 142, 0.12)' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { sm: '6px', DEFAULT: '10px', lg: '16px' },
      boxShadow: {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.4)',
        card: '0 8px 30px rgba(0, 0, 0, 0.35)',
        raised: '0 20px 50px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
