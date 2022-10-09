export default (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  return res.end(
    JSON.stringify({
      path: req.path,
      query: req.query,
      message: "Not found",
    })
  );
};
