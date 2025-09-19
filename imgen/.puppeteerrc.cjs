const { join } = require("node:path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = { cacheDirectory: join(__dirname, ".cache", "puppeteer") };
