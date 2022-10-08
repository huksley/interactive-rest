import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import useSWR, { SWRConfig } from "swr";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter } from "react-router-dom";
import { logger } from "../logger";

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

  const addConsoleLog = useCallback(
    (item) => {
      logger.info(item);
      consoleRef?.current.log(item);
    },
    [consoleRef]
  );

  const { data: response } = useSWR(
    "/api/ping",
    (key) =>
      fetch(key, {
        headers: {
          "X-Request-Id": "ping:test1:" + Date.now(),
        },
      }).then((response) => {
        addConsoleLog("Ping response received " + response.status + ", id " + response.headers.get("x-request-id"));
        return response.json();
      }),
    {
      onSuccess: () => {
        addConsoleLog("SWR onSuccess");
      },
      onError: () => {
        addConsoleLog("SWR onError");
      },
    }
  );

  useEffect(() => {
    addConsoleLog("Started");
  }, [addConsoleLog]);

  return (
    <div>
      <h2>Check pusher + REST</h2>
      Ping? {response?.pong}
      <p>Initiates long HTTP request and receives progress over pusher.</p>
      <button>Receive</button>
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
