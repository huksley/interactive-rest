import fs from "fs";
import { logger } from "./logger.js";
import path from "path";
import { analyzeMetafile, build as esbuild } from "esbuild";
import { config } from "dotenv";

const cssImportPlugin = {
  name: "cssImportPlugin",
  setup(build) {
    // Redirect all paths starting with "images/" to "./public/images/"
    build.onResolve({ filter: /.css$/ }, (args) => {
      if (args.path && args.path.startsWith("~")) {
        return { path: path.resolve("node_modules", args.path.substring(1)) };
      } else {
        return undefined;
      }
    });
  },
};

export const build = (inputFile, outputFile, analyze, backend) =>
  new Promise((resolve, reject) => {
    const st = Date.now();
    const prod = process.env.NODE_ENV === "production";
    const env = backend
      ? {}
      : Object.assign(
          {
            "process.env.LOG_VERBOSE": process.env.LOG_VERBOSE || "0",
            "process.env.NODE_ENV": process.env.NODE_ENV ? '"' + process.env.NODE_ENV + '"' : '"development"',
          },
          ...Object.keys(process.env)
            .filter((key) => key.startsWith("PUBLIC_"))
            .map((key) => ({ ["process.env." + key]: '"' + process.env[key] + '"' }))
        );

    if (logger.isVerbose && outputFile) {
      logger.info("Compiling", inputFile, "to", outputFile);
    } else {
      logger.info("Compiling", inputFile, ...(logger.isVerbose ? ["env", env] : []));
    }

    esbuild({
      entryPoints: [inputFile],
      outfile: outputFile,
      write: !!outputFile,
      bundle: true,
      define: env,
      metafile: true,
      sourcemap: true,
      minify: false,
      jsx: "automatic",
      plugins: [cssImportPlugin],
      loader: { ".png": "dataurl", ".svg": "dataurl" },
      ...(backend
        ? {
            platform: "node",
            target: "node16",
            format: "esm",
            banner: {
              // https://github.com/evanw/esbuild/issues/1921
              js: "import {createRequire} from 'module';const require=createRequire(import.meta.url);",
            },
          }
        : {}),
    })
      .then((result) => {
        if (result.errors && result.errors?.length > 0) {
          throw new Error(result.errors.map((m) => m.text).join("; "));
        }

        if (result.warnings && result.warnings?.length > 0) {
          result.warnings.forEach((w) => logger.warn(w.text));
        }

        if (!outputFile && (!result.outputFiles || result.outputFiles.length === 0)) {
          throw new Error("No output files generated");
        }

        return (analyze && result.metafile ? analyzeMetafile(result.metafile) : Promise.resolve()).then((meta) => {
          if (analyze) {
            logger.info("Compiled", inputFile, "in", Date.now() - st, "ms", meta || "");
          } else {
            logger.info("Compiled", inputFile, "in", Date.now() - st, "ms");
          }

          const contents = outputFile ? true : Buffer.from(result.outputFiles[0].contents).toString("utf-8");
          resolve(contents);
        });
      })
      .catch((err) => {
        logger.warn("Compilation failed for", inputFile, "error", err);
        reject(new Error(err?.message || String(err)));
      });
  });

export const buildDir = (srcDir, outDir, filter, api) => {
  const dir = path.resolve(outDir, srcDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return Promise.all(
    fs
      .readdirSync(srcDir)
      .filter(filter)
      .map((file) => build(path.resolve(srcDir, file), path.resolve(dir, file), undefined, api))
  );
};

if (import.meta.url == "file://" + process.argv[1] + ".js" || import.meta.url == "file://" + process.argv[1]) {
  config();
  await buildDir("src/pages", ".build", (file) => file.endsWith(".jsx"));
  await buildDir("src/pages", ".build", (file) => file.endsWith(".css"));
  await buildDir("src/api", ".build", (file) => file.endsWith(".js"), true);
}
