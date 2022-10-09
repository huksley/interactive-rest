import React from "react";
import { logger } from "../logger";

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  logger.warn("Error", error);
  return (
    <div>
      <h2>React Error</h2>
      <pre>{error?.message || String(error)}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
};
