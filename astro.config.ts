import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://forgottenbeast.github.io",
  base: "/ouvriere",
  output: "static",
  scopedStyleStrategy: "where",
});
