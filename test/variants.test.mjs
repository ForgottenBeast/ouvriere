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
  assert.equal(LANDING_VARIANTS.v5.mediaMode, "single");
  assert.equal(LANDING_VARIANTS.v5.poster, "ocean-v5");
  assert.equal(LANDING_VARIANTS.v5.backgroundBlurPx, 0);
  assert.deepEqual(LANDING_VARIANTS.v5.timeline.titleIn, [0, 2500]);
  assert.equal(
    LANDING_VARIANTS.v5.streamMp4Url,
    "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9f1cb85817b73966e4732bee3e14edcc/downloads/default.mp4"
  );
});

test("v6 preserves v5 media while using a four-direction radial timeline", () => {
  assert.deepEqual(LANDING_VARIANTS.v5.timeline.titleIn, [0, 2500]);
  assert.equal(LANDING_VARIANTS.v6.poster, LANDING_VARIANTS.v5.poster);
  assert.equal(
    LANDING_VARIANTS.v6.streamMp4Url,
    LANDING_VARIANTS.v5.streamMp4Url
  );
  assert.equal(LANDING_VARIANTS.v6.backgroundBlurPx, 0);
  assert.deepEqual(LANDING_VARIANTS.v6.timeline.titleIn, [0, 3250]);
  assert.deepEqual(LANDING_VARIANTS.v6.timeline.sharedFadeOut, [5000, 6190]);
  assert.deepEqual(LANDING_VARIANTS.v6.timeline.menuItemIn, [
    [6190, 6990],
    [6815, 7615],
    [7440, 8240],
    [8065, 8865],
  ]);
  assert.deepEqual(LANDING_VARIANTS.v6.menuItems, [
    { label: "Découvrir", direction: "top" },
    { label: "Déguster", direction: "bottom" },
    { label: "Réserver", direction: "left" },
    { label: "Offrir", direction: "right" },
  ]);
});

test("v7 sequences a wind rose and clockwise labels without changing v6", () => {
  assert.deepEqual(LANDING_VARIANTS.v6.timeline.menuItemIn, [
    [6190, 6990],
    [6815, 7615],
    [7440, 8240],
    [8065, 8865],
  ]);
  assert.deepEqual(LANDING_VARIANTS.v7.windRoseIn, [6190, 6990]);
  assert.deepEqual(LANDING_VARIANTS.v7.timeline.menuItemIn, [
    [6990, 7790],
    [7790, 8590],
    [8590, 9390],
    [9390, 10190],
  ]);
  assert.deepEqual(LANDING_VARIANTS.v7.menuItems, [
    { label: "Découvrir", direction: "top" },
    { label: "Offrir", direction: "right" },
    { label: "Déguster", direction: "bottom" },
    { label: "Réserver", direction: "left" },
  ]);
  assert.equal(LANDING_VARIANTS.v7.poster, LANDING_VARIANTS.v6.poster);
  assert.equal(
    LANDING_VARIANTS.v7.streamMp4Url,
    LANDING_VARIANTS.v6.streamMp4Url
  );
  assert.equal(LANDING_VARIANTS.v7.backgroundBlurPx, 0);
});

test("v8 preserves v7's sequence and media for the reference compass", () => {
  assert.deepEqual(LANDING_VARIANTS.v8.timeline, LANDING_VARIANTS.v7.timeline);
  assert.deepEqual(LANDING_VARIANTS.v8.windRoseIn, [6190, 6990]);
  assert.deepEqual(LANDING_VARIANTS.v8.menuItems, LANDING_VARIANTS.v7.menuItems);
  assert.equal(LANDING_VARIANTS.v8.poster, LANDING_VARIANTS.v7.poster);
  assert.equal(
    LANDING_VARIANTS.v8.streamMp4Url,
    LANDING_VARIANTS.v7.streamMp4Url
  );
  assert.deepEqual(LANDING_VARIANTS.v7.windRoseIn, [6190, 6990]);
});

test("v8 renders a dotted cardinal reference compass without changing v7", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );

  assert.match(hero, /variant === "v8" && \(/);
  assert.match(hero, /class="wind-rose reference-compass"/);
  assert.match(hero, /viewBox="30 30 160 160"/);
  assert.match(hero, /reference-compass-hub/);
  assert.match(hero, /cardinalRotations/);
  assert.match(hero, /diagonalRotations/);
  assert.match(hero, /referenceIntermediateRotations/);
  assert.match(hero, /points="110,60 110,110 103,104"/);
  assert.match(hero, /points="110,60 117,104 110,110"/);
  assert.doesNotMatch(hero, /reference-compass-ring/);
  assert.doesNotMatch(hero, /reference-compass-letter/);
});

test("v7 renders one gated wind rose while v6 retains the curved arrows", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );

  assert.match(hero, /"radial-menu": isRadial/);
  assert.match(hero, /"menuItems" in variantConfig/);
  assert.match(hero, /variant === "v6" && \(/);
  assert.match(hero, /variant === "v7" && \(/);
  assert.match(hero, /class="wind-rose"/);
  assert.match(hero, /viewBox="0 0 120 120"/);
  assert.match(hero, /cardinalRotations/);
  assert.match(hero, /diagonalRotations/);
  assert.match(hero, /wind-rose-face-light/);
  assert.match(hero, /wind-rose-face-dark/);
  assert.match(hero, /aria-hidden="true"/);
  assert.match(hero, /\.radial-menu\.is-enhanced \.wind-rose/);
  assert.match(hero, /\.radial-menu:not\(\.is-enhanced\) \.wind-rose/);
  assert.match(hero, /windRoseIn/);
  assert.match(
    hero,
    /width: min\(clamp\(11\.25rem, 20vw, 17\.5rem\), calc\(var\(--radial-y\) \* 1\.8\)\);/
  );
  assert.match(
    hero,
    /height: min\(clamp\(11\.25rem, 20vw, 17\.5rem\), calc\(var\(--radial-y\) \* 1\.8\)\);/
  );
  assert.match(hero, /stroke-width: 0\.225;/);
  assert.match(hero, /\.wind-rose circle/);
});

test("the radial menu binds each inert label and arrow to one timed item", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );
  const demo = await readFile(
    new URL("../src/scripts/demo.ts", import.meta.url),
    "utf8"
  );

  assert.match(
    hero,
    /const isRadial = variant === "v6" \|\| variant === "v7" \|\| variant === "v8"/
  );
  assert.match(hero, /"radial-menu": isRadial/);
  assert.match(hero, /menuItems\.map\(\(item, index\)/);
  assert.match(hero, /class="menu-arrow"/);
  assert.match(hero, /data-intro-completion=/);
  assert.match(hero, /\.radial-menu\.is-enhanced \.menu-item/);
  assert.match(demo, /root\.dataset\.introCompletion/);
});

test("v5 maps its own poster to the rendered image and metadata", async () => {
  const landingDemo = await readFile(
    new URL("../src/components/LandingDemo.astro", import.meta.url),
    "utf8"
  );

  assert.match(landingDemo, /ocean-v5-poster/);
  assert.match(landingDemo, /"ocean-v5": oceanV5Poster/);
  assert.match(landingDemo, /posterImage=\{poster\}/);
  assert.match(landingDemo, /image=\{\{ src: posterImage\.src/);
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
