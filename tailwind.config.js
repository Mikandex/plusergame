/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: [
      "./src/app/**/*.{js,jsx,ts,tsx}",
      "./src/components/**/*.{js,jsx,ts,tsx}",
      "./src/screens/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        colors: {
          red: {
            DEFAULT: "#9A2121"
          },
          yellow: {
            DEFAULT: "#D4AF37"
          },
          charcoal: {
            DEFAULT: "#0F1115",
            light: "#1B1F27"
          },
          gray: {
            DEFAULT: "#9CA3AF",
            light: "#F5F7FA",
          },
          green: {
            DEFAULT: "#22C55E"
          }
        },
        fontFamily: {
          mthin: ["Montserrat-Thin", "sans-serif"],
          mlight: ["Montserrat-Light", "sans-serif"],
          mregular: ["Montserrat-Regular", "sans-serif"],
          mmedium: ["Montserrat-Medium", "sans-serif"],
          mbold: ["Montserrat-Bold", "sans-serif"],
          msbold: ["Montserrat-SemiBold", "sans-serif"],
          mblack: ["Montserrat-Black", "sans-serif"],
        },
        animation: {
          'spin-fast': 'spin 0.5s linear infinite',
          none: 'none',
          blink: 'blink 1s ease-in-out infinite',
        },
        keyframes: {
          blink: {
            '0%, 80%, 100%': { opacity: '1' },  // visible most of the time
            '85%, 95%': { opacity: '0' },       // brief hidden moment
          },
        },
      },
    },
    plugins: [],
  }