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
        logger.info("Copy", currentSource, "to", currentTarget);
        copyFolderRecursiveSync(currentSource, currentTarget, reader);
      } else {
        logger.info("Write", currentSource, "to", currentTarget);
        fs.writeFileSync(currentTarget, reader ? reader(currentSource, currentTarget) : fs.readFileSync(currentSource));
      }
    });
  } else {
    throw new Error("Not a folder: " + source);
  }
};

/**
 * Pre-populate api/ folder during Vercel build, because I like my apis in src/api
 * @see ENABLE_VC_BUILD=1 in https://github.com/vercel/vercel/issues/8063
 */
if (process.env.VERCEL === "1") {
  process.env.NODE_OPTIONS = "";
  // node vercel build ....
  if (process.argv[2] === "build") {
    if (process.cwd() === "/vercel/path0") {
      copyFolderRecursiveSync("/vercel/path0/src/api", "/vercel/path0/api");
    } else {
      copyFolderRecursiveSync("src/api", "api");
    }
  }
}
