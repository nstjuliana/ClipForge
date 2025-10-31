/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for video editor theme
        timeline: {
          bg: '#1a1a1a',
          track: '#2a2a2a',
          clip: '#3a7bc8',
          playhead: '#ff4444'
        },
        panel: {
          bg: '#1e1e1e',
          border: '#333333'
        }
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      }
    },
  },
  plugins: [],
}

