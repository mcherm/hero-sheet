module.exports = {
  pages: {
    "index": {
      entry: "./src/pages/index/main.js",
      template: "public/base.html",
    },
    "reset-password": {
      entry: "./src/pages/reset-password/main.js",
      template: "public/base.html",
    }
  },
  chainWebpack: config => config.optimization.minimize(false)
};
