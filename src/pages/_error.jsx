import React from "react";
import { renderPage } from "./_page";

export const Page = () => {
  return <div>Error: {globalThis.ERROR_MESSAGE || "Unknown"}</div>;
};

renderPage(Page);
