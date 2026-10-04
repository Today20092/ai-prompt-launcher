/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Material 3 Light Theme
        md: {
          primary: {
            DEFAULT: "#6750A4",
            on: "#FFFFFF",
            container: "#EADDFF",
            "on-container": "#21005D",
          },
          secondary: {
            DEFAULT: "#625B71",
            on: "#FFFFFF",
            container: "#E8DEF8",
            "on-container": "#1D192B",
          },
          tertiary: {
            DEFAULT: "#7D5260",
            on: "#FFFFFF",
            container: "#FFD8E4",
            "on-container": "#31111D",
          },
          error: {
            DEFAULT: "#B3261E",
            on: "#FFFFFF",
            container: "#F9DEDC",
            "on-container": "#410E0B",
          },
          surface: {
            DEFAULT: "#FEF7FF",
            on: "#1D1B20",
            variant: "#E7E0EC",
            "on-variant": "#49454F",
            dim: "#DED8E1",
            bright: "#FEF7FF",
            "container-lowest": "#FFFFFF",
            "container-low": "#F7F2FA",
            container: "#F3EDF7",
            "container-high": "#ECE6F0",
            "container-highest": "#E6E0E9",
          },
          outline: { DEFAULT: "#79747E", variant: "#CAC4D0" },
          inverse: {
            surface: "#322F35",
            "on-surface": "#F5EFF7",
            primary: "#D0BCFF",
          },
          shadow: "#000000",
          scrim: "#000000",
        },
      },
      fontFamily: {
        sans: ["Segoe UI Variable", "Segoe UI", "Aptos", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Material 3 Type Scale
        "display-lg": [
          "57px",
          {
            lineHeight: "64px",
            letterSpacing: "-0.25px",
            fontWeight: "400",
          },
        ],
        "display-md": [
          "45px",
          { lineHeight: "52px", letterSpacing: "0px", fontWeight: "400" },
        ],
        "display-sm": [
          "36px",
          { lineHeight: "44px", letterSpacing: "0px", fontWeight: "400" },
        ],
        "headline-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "0px", fontWeight: "400" },
        ],
        "headline-md": [
          "28px",
          { lineHeight: "36px", letterSpacing: "0px", fontWeight: "400" },
        ],
        "headline-sm": [
          "24px",
          { lineHeight: "32px", letterSpacing: "0px", fontWeight: "400" },
        ],
        "title-lg": [
          "22px",
          { lineHeight: "28px", letterSpacing: "0px", fontWeight: "500" },
        ],
        "title-md": [
          "16px",
          {
            lineHeight: "24px",
            letterSpacing: "0.15px",
            fontWeight: "500",
          },
        ],
        "title-sm": [
          "14px",
          {
            lineHeight: "20px",
            letterSpacing: "0.1px",
            fontWeight: "500",
          },
        ],
        "label-lg": [
          "14px",
          {
            lineHeight: "20px",
            letterSpacing: "0.1px",
            fontWeight: "500",
          },
        ],
        "label-md": [
          "12px",
          {
            lineHeight: "16px",
            letterSpacing: "0.5px",
            fontWeight: "500",
          },
        ],
        "label-sm": [
          "11px",
          {
            lineHeight: "16px",
            letterSpacing: "0.5px",
            fontWeight: "500",
          },
        ],
        "body-lg": [
          "16px",
          {
            lineHeight: "24px",
            letterSpacing: "0.5px",
            fontWeight: "400",
          },
        ],
        "body-md": [
          "14px",
          {
            lineHeight: "20px",
            letterSpacing: "0.25px",
            fontWeight: "400",
          },
        ],
        "body-sm": [
          "12px",
          {
            lineHeight: "16px",
            letterSpacing: "0.4px",
            fontWeight: "400",
          },
        ],
      },
      boxShadow: {
        // Material 3 Elevation
        "elevation-1":
          "0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)",
        "elevation-2":
          "0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)",
        "elevation-3":
          "0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)",
        "elevation-4":
          "0px 2px 3px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)",
        "elevation-5":
          "0px 4px 4px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)",
      },
      borderRadius: {
        // Material 3 Shape
        "xs-md": "4px",
        "sm-md": "8px",
        "md-md": "12px",
        "lg-md": "16px",
        "xl-md": "28px",
      },
      transitionDuration: {
        // Material 3 Motion
        "short-1": "50ms",
        "short-2": "100ms",
        "short-3": "150ms",
        "short-4": "200ms",
        "medium-1": "250ms",
        "medium-2": "300ms",
        "medium-3": "350ms",
        "medium-4": "400ms",
        "long-1": "450ms",
        "long-2": "500ms",
        "long-3": "550ms",
        "long-4": "600ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        "emphasized-decelerate": "cubic-bezier(0.05, 0.7, 0.1, 1)",
        "emphasized-accelerate": "cubic-bezier(0.3, 0, 0.8, 0.15)",
      },
    },
  },
  plugins: [],
};

