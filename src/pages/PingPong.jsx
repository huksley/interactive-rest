import React, { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { logger } from "../logger";
import { ConsoleLog } from "./ConsoleLog";
import { eventBusMiddleware } from "./EventBus";

export const PingPong = () => {
  const consoleRef = useRef(null);
  const [requestId, setRequestId] = useState("ping:test1:" + Date.now());
  const [done, setDone] = useState(undefined);

  const addConsoleLog = useCallback(
    (item, ...args) => {
      logger.info(item, ...args);
      consoleRef?.current.log(item);
    },
    [consoleRef]
  );

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
      use: [eventBusMiddleware],
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setDone(100);
        addConsoleLog("Success " + JSON.stringify(data));
      },
      onError: (err) => {
        addConsoleLog("Error " + (err?.message || String(err)));
      },
      onEvent: (event) => {
        addConsoleLog("Event " + event?.message);
        if (event.progress) {
          setDone(event.progress);
        }
      },
    }
  );

  const ping = useCallback(() => {
    consoleRef.current?.clear();
    console.clear();
    setDone(undefined);
    const id = "ping:test1:" + Date.now();
    addConsoleLog("Generated new id " + id);
    setRequestId(id);
  }, [consoleRef, mutate, addConsoleLog]);

  useEffect(() => {
    addConsoleLog("Started");
  }, [addConsoleLog]);

  return (
    <div>
      <p>Ping? {response?.pong}</p>
      <progress max="100" value={done} />
      <button
        onClick={(event) => {
          event.preventDefault();
          console.info("CLick!");
          ping();
        }}
      >
        Ping
      </button>
      <ConsoleLog ref={consoleRef} />
    </div>
  );
};
