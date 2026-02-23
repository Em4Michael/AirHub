/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    // Optional – many people also add autoprefixer in v4 projects
     autoprefixer: {},
  },
};