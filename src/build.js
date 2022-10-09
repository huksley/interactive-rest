import fs from "fs";
import { exec } from "child_process";
import { logger } from "./logger.js";
import path from "path";

export const build = (file, analyze, options) =>
  new Promise((resolve, reject) => {
    const st = Date.now();
    const env = Object.keys(process.env)
      .filter((key) => key.startsWith("PUBLIC_"))
      .map((key) => `--define:process.env.${key}=\\"${process.env[key]}\\"`)
      .join(" ");
    const command = `./node_modules/.bin/esbuild ${file} --bundle ${env} \
--define:process.env.LOG_VERBOSE=\\"${process.env.LOG_VERBOSE || "0"}\\" \
--define:process.env.NODE_ENV=\\"${process.env.NODE_ENV || "development"}\\" \
--sourcemap ${process.env.NODE_ENV === "production" ? "--minify " : ""}\
--jsx=automatic ${analyze ? "--analyze" : ""} ${options || ""}`;
    logger.info("Compiling", file, "command", command);
    exec(command, { maxBuffer: 16 * 1024 * 1024, timeout: 10000 }, (err, stdout, stderr) => {
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
    });
  });

export const buildDir = (srcDir, outDir, filter, options) =>
  Promise.all(
    fs
      .readdirSync(srcDir)
      .filter(filter)
      .map((file) =>
        build(path.resolve(srcDir, file), undefined, options).then((code) => {
          const dir = path.resolve(outDir, srcDir);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          const dstFile = path.resolve(dir, file);
          logger.info("Writing file", dstFile, "code", code);
          fs.writeFileSync(dstFile, code);
        })
      )
  );

if (import.meta.url == "file://" + process.argv[1] + ".js" || import.meta.url == "file://" + process.argv[1]) {
  await buildDir("src/pages", ".build", (file) => file.endsWith(".jsx"));
  await buildDir(
    "src/api",
    ".build",
    (file) => file.endsWith(".js"),
    // https://github.com/evanw/esbuild/issues/1921
    "--platform=node --target=node16 --format=esm --banner:js=\"import {createRequire} from 'module';const require=createRequire(import.meta.url);\""
  );
}
