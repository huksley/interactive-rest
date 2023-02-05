import http from "http";
import path from "path";
import fs from "fs";
import { logger } from "./logger.js";
import { build } from "./build.js";
import mimeTypes from "mime-types";
import { config } from "dotenv";

const mime = (file) => (file.endsWith(".jsx") ? "application/javascript" : mimeTypes.lookup(file));

/** Write static file, or 404 if not exists */
const writeStatic = (res, file, notFound) => {
  let exists = fs.existsSync(file);
  if (exists) {
    logger.verbose("Sending", file);
    res.setHeader("Content-Type", mime(file) || "application/octet-stream");
    res.writeHead(200);
    res.end(fs.readFileSync(file, { encoding: "utf-8" }));
  } else if (notFound) {
    return notFound();
  } else {
    logger.warn("Not found", file);
    res.setHeader("Content-Type", "text/plain");
    res.writeHead(404);
    res.end("Not found");
  }
};

const writePage = (res, file, module) => {
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  let html = fs.readFileSync(file, { encoding: "utf-8" });

  if (process.env.NODE_ENV !== "production") {
    html = html.replace("</head>", '<script async defer src="http://localhost:35729/livereload.js"></script></head>');
  }

  if (module) {
    html = html.replace("index.jsx", module);
  }

  res.end(html);
};

/** Builds or sends prebuild file */
const write = (res, file, builder) => {
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Content-Type", mime(file) || "application/octet-stream");
    res.writeHead(200);
    logger.verbose("Sending static build", file);
    res.end(fs.readFileSync(".build/" + file, { encoding: "utf-8" }));
  } else {
    (builder ? Promise.resolve(builder(file)) : Promise.resolve(fs.readFileSync(file, { encoding: "utf-8" })))
      .then((output) => {
        res.setHeader("Content-Type", mime(file) || "application/octet-stream");
        res.writeHead(200);
        res.end(output);
      })
      .catch((e) => {
        logger.warn("Failed to compile", file, "error", e?.message || String(e));
        res.setHeader("Content-Type", "text/plain");
        res.writeHead(500);
        res.end("Internal server error");
      });
  }
};

export const handler = async (req, res) => {
  if (req.url != "/api/health" && req.url != "/c" && !req.url.endsWith(".svg")) {
    const requestMs = Date.now();
    logger.info("HTTP ==> " + req.url);
    const __end = res.end;
    res.end = (...args) => {
      logger.info("HTTP <== " + req.url, "<" + res.statusCode + ">", Date.now() - requestMs, "ms");
      __end.apply(res, args);
    };
  }

  if (req.method === "POST" || req.method === "PATCH") {
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }

    let data = Buffer.concat(buffers).toString();
    if (req.headers["content-type"] === "application/json") {
      data = JSON.parse(data);
    }
    logger.verbose("Incoming body", data.length, "byte");
    req.body = data;
  }

  const url = new URL(req.url, "http://localhost");

  if (url.pathname.startsWith("/api")) {
    const page = url.pathname.substring(url.pathname.indexOf("/", 1) + 1);
    const packageName = "./api/" + page + ".js";
    try {
      const ee = await import(packageName);
      if (ee && ee.default) {
        await ee.default(req, res);
      } else {
        throw Error("No default export in", fileName, Object.keys(ee));
      }
    } catch (err) {
      logger.warn("Failed to compile", packageName, err?.message || String(err));
      res.setHeader("Content-Type", "text/plain");
      res.writeHead(500);
      res.end("Internal server error");
    }
  } else if (url.pathname === "/") {
    writePage(res, "src/pages/index.html");
  } else {
    const file = "src/pages/" + url.pathname.substring(1);
    if (url.pathname === "/favicon.ico") {
      res.setHeader("Location", "/favicon.svg");
      res.writeHead(302);
      res.end("OK");
    } else if (url.pathname.endsWith(".jsx")) {
      const file = "src/pages/" + url.pathname.substring(1);
      write(
        res,
        file,
        (file) => {
          return build(file, undefined, true, false);
        },
        "application/javascript"
      );
    } else if (url.pathname.endsWith(".css")) {
      const file = "src/pages/" + url.pathname.substring(1);
      if (fs.existsSync(file)) {
        write(res, file, (file) => build(file), "text/css");
      } else {
        const staticFile = path.resolve("static", url.pathname.substring(1));
        writeStatic(res, staticFile);
      }
    } else if (fs.existsSync(file + ".jsx")) {
      // Serve as static html with replacement
      writePage(res, "src/pages/index.html", path.basename(file) + ".jsx");
    } else {
      const file = path.resolve("static", url.pathname.substring(1));
      writeStatic(res, file);
    }
  }
};

if (import.meta.url == "file://" + process.argv[1] + ".js" || import.meta.url == "file://" + process.argv[1]) {
  config();
  const server = http.createServer(handler);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  logger.info("Starting server on", port);
  server.listen(port);

  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === undefined) {
    import("./livereload.js");
  }

  process.on("SIGINT", (signal) => {
    logger.info("Caught interrupt signal", signal);
    if (server) {
      server.close();
    }
    process.exit(1);
  });
}
