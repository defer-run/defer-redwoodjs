import { fileURLToPath } from "node:url";
import path from "node:path";

globalThis.__dirname =
  (typeof __dirname === "string") === false
    ? path.dirname(fileURLToPath(import.meta.url))
    : __dirname;
