import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter } from "react-router-dom";
import { ErrorFallback } from "./ErrorFallback";
import { PingPong } from "./PingPong";

const Page = () => {
  return (
    <div>
      <h2>Interactive REST</h2>

      <p>
        Initiates long-running HTTP request and receives progress over Pusher API.{" "}
        <a href="https://github.com/huksley/interactive-rest">More information</a>
      </p>

      <PingPong />
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
