import http from "http";
import path from "path";
import fs from "fs";
import { logger } from "./logger.js";
import { build } from "./build.js";
import mime from "mime-types";
import { config } from "dotenv";

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
  } else if (url.pathname === "/" || url.pathname.endsWith(".html")) {
    const file = url.pathname.substring(1) ? "src/pages/" + url.pathname.substring(1) : "src/pages/index.html";
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    const html = fs.readFileSync(file, { encoding: "utf-8" });
    if (process.env.NODE_ENV === "production") {
      res.end(html);
    } else {
      res.end(
        html.replace("</head>", '<script async defer src="http://localhost:35729/livereload.js"></script></head>')
      );
    }
  } else {
    if (url.pathname === "/favicon.ico") {
      res.setHeader("Location", "/favicon.svg");
      res.writeHead(302);
      res.end("OK");
    } else if (url.pathname.endsWith(".jsx")) {
      const file = "src/pages/" + url.pathname.substring(1);
      if (process.env.NODE_ENV === "production") {
        res.setHeader("Content-Type", "application/javascript");
        res.writeHead(200);
        logger.verbose("Sending static build .build/index.js");
        res.end(fs.readFileSync(".build/" + file, { encoding: "utf-8" }));
      } else {
        build(file, true)
          .then((output) => {
            res.setHeader("Content-Type", "application/javascript");
            res.writeHead(200);
            res.end(output);
          })
          .catch((e) => {
            logger.warn("Failed to compile", e?.message || String(e));
            res.setHeader("Content-Type", "text/plain");
            res.writeHead(500);
            res.end("Internal server error");
          });
      }
    } else {
      const file = path.resolve("static", url.pathname.substring(1));
      let stat = undefined;
      try {
        stat = fs.statSync(file);
      } catch (e) {
        // Ignore
      }
      if (stat) {
        logger.verbose("Sending", file);
        res.setHeader("Content-Type", mime.lookup(file) || "application/octet-stream");
        res.writeHead(200);
        res.end(fs.readFileSync(file, { encoding: "utf-8" }));
      } else {
        logger.warn("Not found", file);
        res.setHeader("Content-Type", "text/html");
        res.writeHead(404);
        res.end("Not found");
      }
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
