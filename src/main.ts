import path from "node:path";
import { fileURLToPath } from "node:url";
import { executeVisualSearch } from "./services/execute-visual-search.js";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

for (const filename of await glob(
  path.resolve(__dirname, "..", "tgpt", "*.png")
)) {
  executeVisualSearch(filename).then(console.log);
}
