import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import useSWR, { SWRConfig } from "swr";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter } from "react-router-dom";
import { logger } from "../logger";
import Pusher from "pusher-js";

export const onPusher = (channelName, eventName, handler) => {
  useEffect(() => {
    let pusher = undefined;

    if (process.env.PUBLIC_PUSHER_API_KEY) {
      pusher = new Pusher(process.env.PUBLIC_PUSHER_API_KEY, {
        cluster: "eu",
      });

      logger.info("Connecting to Pusher channel", channelName);
      const channel = pusher.subscribe(channelName);
      channel.bind(eventName, (data) => {
        if (handler) {
          handler(data);
        }
      });
    }

    return () => {
      if (pusher) {
        logger.info("Disconnecting from Pusher", pusher);
        pusher.disconnect();
      }
    };
  }, [handler]);
};

/**
 *
 * @param {string[] | undefined} items
 */
const ConsoleLog = forwardRef(({ items: initialItems }, ref) => {
  const [items, setItems] = useState(initialItems);

  useImperativeHandle(
    ref,
    () => ({
      log(item) {
        const now = new Date();
        setItems((items) => [
          ...(items ? items : []),
          now.toLocaleTimeString() + "." + String(now.getMilliseconds()).padStart(3, "0") + ": " + item,
        ]);
      },
      clear: () => {
        setItems([]);
      },
    }),
    [setItems]
  );

  return (
    <div id="consoleLog">
      {items?.map((item, index) => (
        <dt key={index}>{item}</dt>
      ))}
    </div>
  );
});

function ErrorFallback({ error, resetErrorBoundary }) {
  logger.warn("Error", error);
  return (
    <div>
      <h2>React Error</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

const Page = () => {
  const consoleRef = useRef(null);
  const [requestId, setRequestId] = useState("ping:test1:" + Date.now());

  const addConsoleLog = useCallback(
    (item) => {
      logger.info(item);
      consoleRef?.current.log(item);
    },
    [consoleRef]
  );

  const onMessage = useCallback(
    (event) => {
      if (event.id === requestId) {
        addConsoleLog(event.message);
      }
    },
    [requestId, addConsoleLog]
  );

  onPusher("fetch-notify", "request", onMessage);

  const { data: response, mutate } = useSWR(
    requestId ? "/api/ping?requestId=" + requestId : null,
    (key) => {
      const requestId = new URL(key, "http://localhost").searchParams.get("requestId");
      return fetch(key, {
        headers: {
          "X-Request-Id": requestId,
        },
      }).then((response) => {
        addConsoleLog("Ping response received " + response.status + ", id " + response.headers.get("x-request-id"));
        return response.json();
      });
    },
    {
      onSuccess: () => {
        addConsoleLog("SWR onSuccess");
      },
      onError: () => {
        addConsoleLog("SWR onError");
      },
    }
  );

  const ping = useCallback(() => {
    consoleRef.current?.clear();
    setRequestId("ping:test1:" + Date.now());
    mutate();
  }, [consoleRef, mutate]);

  useEffect(() => {
    addConsoleLog("Started");
  }, [addConsoleLog]);

  return (
    <div>
      <h2>Check pusher + REST</h2>
      Ping? {response?.pong}
      <p>
        Initiates long HTTP request and receives progress over Pusher API.{" "}
        <a href="https://github.com/huksley/interactive-rest">More information</a>
      </p>
      <button onClick={(event) => ping()}>Ping</button>
      <ConsoleLog ref={consoleRef} />
    </div>
  );
};

const container = document.querySelector("#root");
const root = ReactDOM.createRoot(container);

root.render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <SWRConfig>
      <BrowserRouter>
        <Page />
      </BrowserRouter>
    </SWRConfig>
  </ErrorBoundary>
);
