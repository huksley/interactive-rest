/**
 * @param {IncomingMessage} res
 * @param {ServerResponse} res
 */
export default (req, res) => {
  const id = req.headers["x-request-id"] || "ping:" + Date.now();
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("X-Request-Id", id);
  res.end(JSON.stringify({ pong: "pong" }));
};
