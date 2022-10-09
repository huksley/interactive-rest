import Pusher from "pusher";
import { logger } from "../logger.js";
import { createHash } from "crypto";
import { nanoid } from "nanoid";

const singleton = { pusher: undefined };

export const md5 = (str) => createHash("md5").update(str).digest("hex");

export const sleep = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

const push = (id, event) => {
  if (!singleton.pusher && process.env.PUBLIC_PUSHER_API_KEY && process.env.PUSHER_SECRET_KEY) {
    singleton.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUBLIC_PUSHER_API_KEY,
      secret: process.env.PUSHER_SECRET_KEY,
      cluster: "eu",
      useTLS: true,
    });
  }

  if (singleton.pusher && id) {
    const channelName = "fetch-notify";
    const eventName = "request:" + md5(id);
    if (!event.id) {
      event.id = nanoid();
    }
    logger.info("Channel", channelName, "event", eventName, "payload", event?.message);
    singleton.pusher.trigger(channelName, eventName, event);
  } else {
    return Promise.resolve();
  }
};

/**
 * Send Pong response.
 *
 * @param {IncomingMessage} res
 * @param {ServerResponse} res
 */
export default async (req, res) => {
  const id = req.headers["x-request-id"];
  await push(id, { progress: 10, message: "Started processing ping" });
  await sleep(300);
  await push(id, { progress: 40, message: "Still processing..." });
  await sleep(300);
  await push(id, { progress: 50, message: "Almost done..." });
  await sleep(300);
  await push(id, { progress: 100, message: "Sending now" });
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("X-Request-Id", id);
  res.end(JSON.stringify({ pong: "Pong" }));
};
