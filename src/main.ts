import executeVisualSearch from "./services/execute-visual-search.js";
import express from "express";
import z from "zod";

const app = express();

const schema = z.object({
  url: z.string().url(),
});

app.get("/search/google-lens", async (req, res) => {
  const query = await schema.safeParseAsync(req.query);
  if (!query.success) {
    res.status(400).send(query.error);
    return;
  }

  const records = await executeVisualSearch({
    url: query.data.url,
  });
  return res.send({ visual_matches: records });
});

const port = process.env.PORT || "8080";
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
