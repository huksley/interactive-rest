import { next } from "@vercel/edge";

export default middleware = (req) => {
  console.info("Request", req.query, req.url, req.path);
  return next();
};
