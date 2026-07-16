module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        charcoal: '#0F172A',
        slateBody: '#475569',
        accent: '#2563EB',
      },
    },
  },
  plugins: [],
}