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
        Initiate a long-running HTTP request and receive progress events before the response is completed.{" "}
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
