import { useEffect } from "react";
import { logger } from "../logger";
import Pusher from "pusher-js";
import jsmd5 from "js-md5";
import { LRUMap } from "../LRU";

const md5 = (str) => {
  const hash = jsmd5.create();
  hash.update(str);
  return hash.hex();
};

const singleton = {
  pusher: undefined,
  channel: undefined,
  // Deduplicate last events
  lastEvents: new LRUMap(),
};

const deduplicate = (handler) => (event) => {
  const hash = md5(JSON.stringify(event));
  if (!singleton.lastEvents.has(hash)) {
    try {
      handler(event);
    } finally {
      singleton.lastEvents.set(hash, event);
    }
  } else if (logger.isVerbose) {
    logger.verbose("Deduplicated", event);
  }
};

export const onPusher = (id, eventName, handler) => {
  useEffect(() => {
    EventBus.start();
    const channel = EventBus.listen(id, eventName, handler);
    return () => {
      EventBus.close(channel);
    };
  }, [handler]);
};

export const EventBus = {
  start: () => {
    if (!singleton.pusher && process.env.PUBLIC_PUSHER_API_KEY) {
      singleton.pusher = new Pusher(process.env.PUBLIC_PUSHER_API_KEY, {
        cluster: "eu",
      });

      singleton.pusher.connection.bind("connected", () => {
        logger.info("Pusher connected.");
      });

      singleton.pusher.connection.bind("error", (err) => {
        logger.info("Pusher connection failed", err);
      });
    }
  },

  listen: (id, handler) => {
    if (singleton.pusher) {
      const channelName = "fetch-notify";
      if (!singleton.channel) {
        logger.info("Connecting to Pusher channel", channelName);
        singleton.channel = singleton.pusher.subscribe(channelName);
      }

      const eventName = "request:" + md5(id);
      logger.info("Listening to", eventName, "on channel", channelName);
      singleton.channel.bind(eventName, (data) => {
        logger.isVerbose && logger.verbose("Channel", channelName, "event", eventName, "received", data);
        handler && handler(data);
      });
      return singleton.channel;
    } else {
      return undefined;
    }
  },

  close: (id) => {
    if (singleton.channel) {
      const eventName = "request-" + md5(id);
      singleton.channel.unbind(eventName);
    }
  },
};

/** SWR middleware to receive events, sends events to the onEvent handler in SWR config. */
export const eventBusMiddleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    if (key) {
      const requestId = new URL(key, "http://localhost").searchParams.get("requestId");
      if (requestId) {
        EventBus.start();
        EventBus.listen(requestId, deduplicate(config.onEvent));
      }

      const swr = useSWRNext(key, fetcher, config);

      if (requestId) {
        EventBus.close(requestId);
      }
      return swr;
    } else {
      return useSWRNext(key, fetcher, config);
    }
  };
};
