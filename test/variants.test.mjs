import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { LANDING_VARIANTS } from "../src/config/variants.ts";

test("the nature comparison lengthens only the title entrance by 25 percent", () => {
  assert.deepEqual(LANDING_VARIANTS.v1.timeline.titleIn, [0, 2000]);
  assert.deepEqual(LANDING_VARIANTS.v2.timeline.titleIn, [0, 2500]);
  assert.deepEqual(
    LANDING_VARIANTS.v2.timeline.quoteIn,
    LANDING_VARIANTS.v1.timeline.quoteIn
  );
  assert.deepEqual(
    LANDING_VARIANTS.v2.timeline.sharedFadeOut,
    LANDING_VARIANTS.v1.timeline.sharedFadeOut
  );
  assert.deepEqual(
    LANDING_VARIANTS.v2.timeline.menuItemIn,
    LANDING_VARIANTS.v1.timeline.menuItemIn
  );
});

test("each variant selects one explicit Stream MP4 source", () => {
  assert.equal(LANDING_VARIANTS.v1.mediaMode, "single");
  assert.equal(LANDING_VARIANTS.v2.mediaMode, "single");
  assert.equal(
    LANDING_VARIANTS.v1.streamMp4Url,
    "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9741a9cf044d648f924291e94598083c/downloads/default.mp4"
  );
  assert.equal(
    LANDING_VARIANTS.v2.streamMp4Url,
    "https://customer-spsh21dx72idjxm3.cloudflarestream.com/de890dcbcc7871e1b2114cf1f88f80e1/downloads/default.mp4"
  );
  assert.equal(LANDING_VARIANTS.v3.mediaMode, "single");
  assert.equal(LANDING_VARIANTS.v3.poster, "green");
  assert.equal(
    LANDING_VARIANTS.v3.streamMp4Url,
    "https://customer-spsh21dx72idjxm3.cloudflarestream.com/bdcacf524d311c58a8a92f9f70ae34d4/downloads/default.mp4"
  );
  assert.equal(LANDING_VARIANTS.v4.poster, "green");
  assert.equal(LANDING_VARIANTS.v4.backgroundBlurPx, 0);
  assert.equal(
    LANDING_VARIANTS.v4.streamMp4Url,
    LANDING_VARIANTS.v3.streamMp4Url
  );
});

test("HeroVideo receives the selected poster instead of importing the ocean poster", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(hero, /calm-sea-waves-poster/);
  assert.match(hero, /posterImage: ImageMetadata/);
  assert.match(hero, /src=\{posterImage\}/);
});

test("v4 disables both background blur mechanisms without changing text animation", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );

  assert.match(hero, /"no-blur": variantConfig\.backgroundBlurPx === 0/);
  assert.match(hero, /\.landing\.no-blur\.is-enhanced \.poster,/);
  assert.match(hero, /animation: none;/);
  assert.match(hero, /\[data-demo-root\]\.is-enhanced h1/);
});
