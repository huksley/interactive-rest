import React, { useMemo } from "react";
import { PingPong } from "./PingPong";
import { renderPage } from "./_page";

export const Page = () => {
  return (
    <div className="my-2 mx-2">
      <h2 className="my-2 font-bold text-xl">Interactive REST</h2>

      <p className="my-4">
        Initiate a long-running HTTP request and receive progress events before the response is completed.{" "}
        <a href="https://github.com/huksley/interactive-rest#readme">More information</a>
      </p>

      <PingPong />
    </div>
  );
};

renderPage(Page);
