module.exports = {
  pages: {
    "index": {
      entry: "./src/pages/index/main.js",
      template: "public/index.html",
    },
    "reset-password": {
      entry: "./src/pages/reset-password/main.js",
      template: "public/reset-password.html",
    }
  },
  chainWebpack: config => config.optimization.minimize(false)
};
