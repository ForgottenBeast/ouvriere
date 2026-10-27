import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const starterRoutes = [
  "src/pages/about.md",
  "src/pages/og.png.ts",
  "src/pages/posts/[slug]/index.astro",
  "src/pages/posts/[slug]/index.png.ts",
  "src/pages/posts/index.astro",
  "src/pages/robots.txt.ts",
  "src/pages/rss.xml.ts",
  "src/pages/search.astro",
  "src/pages/tags/[tag]/[page].astro",
  "src/pages/tags/[tag]/index.astro",
  "src/pages/tags/index.astro",
];

const starterPublicAssets = [
  "public/assets/dev.svg",
  "public/assets/forrest-gump-quote.webp",
  "public/assets/logo.png",
  "public/assets/logo.svg",
  "public/astropaper-og.jpg",
  "public/toggle-theme.js",
];

test("publishes only the landing page and custom 404 routes", () => {
  for (const route of starterRoutes) {
    assert.equal(existsSync(route), false, `${route} must not be published`);
  }
});

test("provides explicit comparison and chooser routes", () => {
  for (const route of [
    "src/pages/v1/index.astro",
    "src/pages/v2/index.astro",
    "src/pages/v3/index.astro",
    "src/pages/v4/index.astro",
    "src/pages/v5/index.astro",
    "src/pages/v6/index.astro",
    "src/pages/v7/index.astro",
    "src/pages/v8/index.astro",
    "src/pages/v9/index.astro",
    "src/pages/v9a/index.astro",
    "src/pages/v9b/index.astro",
    "src/pages/v9c/index.astro",
    "src/pages/v9d/index.astro",
    "src/pages/v10/index.astro",
    "src/pages/versions/index.astro",
  ]) {
    assert.equal(existsSync(route), true, `${route} must be published`);
  }
});

test("does not run the unused Astro Studio workflow", () => {
  assert.equal(existsSync(".github/workflows/_studio.yml"), false);
});

test("does not publish unused AstroPaper assets", () => {
  for (const asset of starterPublicAssets) {
    assert.equal(existsSync(asset), false, `${asset} must not be published`);
  }

  assert.equal(existsSync("public/favicon.svg"), true);
});

test("uses the static GitHub Pages origin and project base", () => {
  const config = readFileSync("astro.config.ts", "utf8");

  assert.match(config, /site:\s*["']https:\/\/forgottenbeast\.github\.io["']/);
  assert.match(config, /base:\s*["']\/ouvriere["']/);
  assert.match(config, /output:\s*["']static["']/);
  assert.doesNotMatch(config, /sitemap\s*\(/);
  assert.doesNotMatch(config, /@astrojs\/(react|tailwind)/);
  assert.doesNotMatch(config, /remark(Toc|Collapse)/);
});

test("404 is French, excluded from indexing, and links to the project base", () => {
  const page = readFileSync("src/pages/404.astro", "utf8");

  assert.match(page, /<html\s+lang=["']fr["']/);
  assert.match(
    page,
    /name=["']robots["'][^>]+content=["']noindex,\s*nofollow,\s*noarchive["']/
  );
  assert.match(page, /href=\{import\.meta\.env\.BASE_URL\}/);
  assert.match(page, /Retour à l’accueil/);
});

test("404 declares the project SVG favicon under the configured base", () => {
  const page = readFileSync("src/pages/404.astro", "utf8");

  assert.match(page, /import\.meta\.env\.BASE_URL/);
  assert.match(page, /`\$\{baseURL\}favicon\.svg`/);
  assert.match(
    page,
    /<link\s+rel=["']icon["']\s+type=["']image\/svg\+xml["']\s+href=\{faviconURL\}\s*\/?>/
  );
});
