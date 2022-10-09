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
        Initiates a long-running HTTP request and receives progress events before response are completed.{" "}
        <a href="https://github.com/huksley/interactive-rest#readme">More information</a>
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
