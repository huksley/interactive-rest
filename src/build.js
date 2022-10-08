import fs from "fs";
import { exec } from "child_process";
import { logger } from "./logger.js";
import path from "path";

export const build = (file, analyze) =>
  new Promise((resolve, reject) => {
    const st = Date.now();
    logger.info("Compiling", file);
    exec(
      `./node_modules/.bin/esbuild ${file} --bundle \
                  --define:process.env.LOG_VERBOSE=\\"${process.env.LOG_VERBOSE}\\" \
                  --define:process.env.NODE_ENV=\\"${process.env.NODE_ENV || "development"}\\" \
                  --sourcemap ${process.env.NODE_ENV === "production" ? "--minify" : ""}\
                  --loader:.jsx=jsx --jsx=automatic ${analyze ? "--analyze" : ""}`,
      { maxBuffer: 16 * 1024 * 1024, timeout: 10000 },
      (err, stdout, stderr) => {
        if (err) {
          logger.warn(file, "Compilation failed", err?.code, stderr);
          reject(new Error(stderr));
        } else {
          logger.info(file, "Compiled in", Date.now() - st, "ms, size", stdout.length, "bytes");
          if (stderr) {
            logger.info(stderr);
          }
          resolve(stdout);
        }
      }
    );
  });

if (import.meta.url == "file://" + process.argv[1] + ".js" || import.meta.url == "file://" + process.argv[1]) {
  const pages = "src/pages";
  await Promise.all(
    fs
      .readdirSync(pages)
      .filter((file) => file.endsWith(".jsx"))
      .map((file) =>
        build(path.resolve(pages, file)).then((code) => {
          const dir = path.resolve(".build", pages);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(path.resolve(".build", pages, file), code);
        })
      )
  );
}
