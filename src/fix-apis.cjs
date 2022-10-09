const fs = require("fs");
const path = require("path");

const logger = console;
exports.logger = logger;
/* eslint-disable @typescript-eslint/no-empty-function */
logger.verbose = process.env.LOG_VERBOSE === "1" ? logger.info : () => {};

/**
 * Copy folder recursively.
 *
 * @param {string} source - Source path-like
 * @param {string} target - Target path-like
 * @param {Function} reader - Optional file reader, for transformation
 * @param {number} level - How dee in the folder
 */
const copyFolderRecursiveSync = (source, target, reader) => {
  if (!fs.existsSync(source)) {
    throw new Error("Not found: " + source);
  }

  const stat = fs.lstatSync(source);
  if (stat.isDirectory()) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);
    files.forEach((file) => {
      const currentSource = path.join(source, file);
      const currentTarget = path.join(target, file);
      if (fs.lstatSync(currentSource).isDirectory()) {
        logger.verbose("Copy", currentSource);
        copyFolderRecursiveSync(currentSource, currentTarget, reader);
      } else {
        logger.verbose("Write", currentSource);
        fs.writeFileSync(currentTarget, reader ? reader(currentSource, currentTarget) : fs.readFileSync(currentSource));
      }
    });
  }
};

if (process.env.VERCEL === "1") {
  copyFolderRecursiveSync("src/api", "api");
}
