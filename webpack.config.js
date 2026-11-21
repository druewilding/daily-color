import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const shared = {
  entry: "./index.js",
  mode: "production",
};

export default [
  // An ES module: import { getDailyColor } from ".../dist/daily-color.js"
  {
    ...shared,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "daily-color.js",
      library: { type: "module" },
    },
    experiments: { outputModule: true },
  },
  // A plain script that sets window.DailyColor. Plain scripts in <head> run
  // before the page is drawn, so the demo never shows a placeholder.
  {
    ...shared,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "daily-color.umd.js",
      library: { name: "DailyColor", type: "umd" },
      globalObject: "globalThis",
    },
  },
];
