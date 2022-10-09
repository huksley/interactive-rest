export default (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  return response.end(
    JSON.stringify({
      path: req.path,
      query: req.query,
      message: "Not found",
    })
  );
};
