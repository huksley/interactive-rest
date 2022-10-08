import Pusher from "pusher";
import { logger } from "../logger.js";

const push = (channelName, eventName, data) => {
  if (process.env.PUBLIC_PUSHER_API_KEY && process.env.PUSHER_SECRET_KEY) {
    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUBLIC_PUSHER_API_KEY,
      secret: process.env.PUSHER_SECRET_KEY,
      cluster: "eu",
      useTLS: true,
    });

    logger.info("Sending message to Pusher", data?.message);
    return pusher.trigger(channelName, eventName, data);
  } else {
    return Promise.resolve();
  }
};

/**
 * @param {IncomingMessage} res
 * @param {ServerResponse} res
 */
export default async (req, res) => {
  const id = req.headers["x-request-id"] || "ping:" + Date.now();
  await push("fetch-notify", "request", { type: "request", id, message: "Started processing ping" });
  await new Promise((resolve) => setTimeout(() => resolve(), 300));
  await push("fetch-notify", "request", { type: "request", id, message: "Still processing..." });
  await new Promise((resolve) => setTimeout(() => resolve(), 300));
  await push("fetch-notify", "request", { type: "request", id, message: "Almost done..." });
  await new Promise((resolve) => setTimeout(() => resolve(), 300));
  await push("fetch-notify", "request", { type: "request", id, message: "Sending now" });
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("X-Request-Id", id);
  res.end(JSON.stringify({ pong: "pong" }));
};
