import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter } from "react-router-dom";
import { ErrorFallback } from "./ErrorFallback";

export const renderPage = (Page) => {
  const container = document.querySelector("#root");
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SWRConfig>
          <BrowserRouter>{Page && <Page />}</BrowserRouter>
        </SWRConfig>
      </ErrorBoundary>
    );
  }
};
