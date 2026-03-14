/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        government: {
          blue: "#0c4a6e",
          deep: "#0f172a",
          green: "#166534",
          mist: "#f8fafc",
        },
      },
      boxShadow: {
        portal: "0 24px 60px -30px rgba(15, 23, 42, 0.35)",
      },
      borderRadius: {
        portal: "28px",
      },
    },
  },
  plugins: [],
}
