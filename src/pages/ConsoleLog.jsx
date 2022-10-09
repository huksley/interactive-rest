import React, { forwardRef, useImperativeHandle, useState } from "react";

/**
 *
 * @param {string[] | undefined} items
 */
export const ConsoleLog = forwardRef(({ items: initialItems }, ref) => {
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
