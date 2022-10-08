import livereload from "livereload";
import { logger } from "./logger.js";

logger.info("Starting livereload server");

const server = livereload.createServer(
  {
    extraExts: ["jsx", "html"],
    exclusions: ["api/"],
    delay: 1000,
  },
  () => {}
);

server.watch(["./", "./static"]);

server.server.once("connection", () => {
  setTimeout(() => {
    logger.verbose("Reloading page");
    server.refresh("/");
  }, 100);
});
