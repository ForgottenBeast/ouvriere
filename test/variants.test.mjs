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

test("v9 preserves v8's presentation contract for the ring compass", () => {
  assert.deepEqual(LANDING_VARIANTS.v9.timeline, LANDING_VARIANTS.v8.timeline);
  assert.deepEqual(LANDING_VARIANTS.v9.windRoseIn, [6190, 6990]);
  assert.deepEqual(LANDING_VARIANTS.v9.menuItems, LANDING_VARIANTS.v8.menuItems);
  assert.equal(LANDING_VARIANTS.v9.poster, LANDING_VARIANTS.v8.poster);
  assert.equal(
    LANDING_VARIANTS.v9.streamMp4Url,
    LANDING_VARIANTS.v8.streamMp4Url
  );
  assert.equal(LANDING_VARIANTS.v9.backgroundBlurPx, 0);
});

test("V9 typography proposals preserve the V9 presentation contract", async () => {
  for (const variant of ["v9a", "v9b", "v9c", "v9d"]) {
    assert.deepEqual(LANDING_VARIANTS[variant].timeline, LANDING_VARIANTS.v9.timeline);
    assert.deepEqual(LANDING_VARIANTS[variant].windRoseIn, [6190, 6990]);
    assert.deepEqual(LANDING_VARIANTS[variant].menuItems, LANDING_VARIANTS.v9.menuItems);
    assert.equal(LANDING_VARIANTS[variant].poster, LANDING_VARIANTS.v9.poster);
    assert.equal(
      LANDING_VARIANTS[variant].streamMp4Url,
      LANDING_VARIANTS.v9.streamMp4Url
    );
  }

  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );
  assert.match(hero, /"font-eb-garamond": variant === "v9a"/);
  assert.match(
    hero,
    /"font-bodoni-moda":\s+variant === "v9b" \|\|\s+variant === "v10" \|\|\s+variant === "v11" \|\|\s+variant === "v12"/
  );
  assert.match(hero, /"font-marcellus": variant === "v9c"/);
  assert.match(
    hero,
    /"font-pinyon-script": variant === "v9d"/
  );
  assert.match(hero, /font-family: "EB Garamond", Georgia, serif;/);
  assert.match(hero, /font-family: "Bodoni Moda", Georgia, serif;/);
  assert.match(hero, /font-family: "Marcellus", Georgia, serif;/);
  assert.match(hero, /font-family: "Pinyon Script", "Cormorant Garamond", cursive;/);
  assert.match(hero, /\.font-marcellus \.quote \{\s+font-family: "Cormorant Garamond"/);
  assert.match(
    hero,
    /\.font-pinyon-script \.quote,[\s\S]*\.font-pinyon-script \.attribution \{\s+font-family: "Cormorant Garamond"/
  );
  assert.match(hero, /\.font-pinyon-script h1,[\s\S]*letter-spacing: normal;/);
  assert.match(
    hero,
    /\.radial-menu\.font-bodoni-moda\.is-enhanced \.menu ul \{\s+font-size: clamp\(1\.35rem, 3vw, 2rem\);/
  );
});

test("V10 adds only an explicit, user-triggered music loop", async () => {
  assert.deepEqual(LANDING_VARIANTS.v10.timeline, LANDING_VARIANTS.v9d.timeline);
  assert.deepEqual(LANDING_VARIANTS.v10.menuItems, LANDING_VARIANTS.v9d.menuItems);
  assert.equal(LANDING_VARIANTS.v10.poster, LANDING_VARIANTS.v9d.poster);
  assert.equal(
    LANDING_VARIANTS.v10.streamMp4Url,
    LANDING_VARIANTS.v9d.streamMp4Url
  );
  assert.equal(LANDING_VARIANTS.v10.backgroundBlurPx, 0);
  assert.equal(LANDING_VARIANTS.v10.audioSrc, "musique");
  assert.equal("audioSrc" in LANDING_VARIANTS.v9d, false);

  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );
  const demo = await readFile(
    new URL("../src/scripts/demo.ts", import.meta.url),
    "utf8"
  );
  assert.match(hero, /data-demo-audio/);
  assert.match(hero, /data-audio-toggle/);
  assert.match(hero, /preload="none"/);
  assert.match(hero, /Activer la musique/);
  assert.match(demo, /audio\.volume = 0\.35/);
  assert.match(demo, /audio\.play\(\)\.catch/);
  assert.match(demo, /if \(audio\.error\) \{/);
  assert.match(demo, /Musique indisponible/);
  assert.doesNotMatch(demo, /localStorage|sessionStorage/);
});

test("v7 through v9 use the requested visible L'Ouvrière hero title only", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );

  assert.match(
    hero,
    /variant === "v9a" \|\|\s+variant === "v9b" \|\|\s+variant === "v9c" \|\|\s+variant === "v9d" \|\|\s+variant === "v10" \|\|\s+variant === "v11" \|\|\s+variant === "v12"\s+\?\s+"L'Ouvrière"\s+:\s+"L'Ouvriere";/
  );
  assert.match(hero, /<h1>\{heroTitle\}<\/h1>/);
  assert.match(hero, /<section class="intro" aria-label=\{heroTitle\}>/);
});

test("v7 through v9 align desktop radial labels on the vertical radius", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );

  assert.match(
    hero,
    /const hasEqualRadialLabelSpacing =[\s\S]*variant === "v9a" \|\|[\s\S]*variant === "v9b" \|\|[\s\S]*variant === "v9c" \|\|[\s\S]*variant === "v9d" \|\|[\s\S]*variant === "v10" \|\|[\s\S]*variant === "v11" \|\|[\s\S]*variant === "v12";/
  );
  assert.match(hero, /"equal-radial-label-spacing": hasEqualRadialLabelSpacing/);
  assert.match(
    hero,
    /\.equal-radial-label-spacing\.is-enhanced \.menu \{\s+--radial-x: var\(--radial-y\);/
  );
  assert.match(
    hero,
    /@media \(min-width: 40\.0625rem\) and \(max-height: 30rem\) \{\s+\.equal-radial-label-spacing\.is-enhanced \.menu \{\s+--radial-y: min\(10rem, calc\(50vh - 2rem\)\);/
  );
  assert.match(
    hero,
    /\.equal-radial-label-spacing\.is-enhanced \.wind-rose \{\s+width: min\(clamp\(11\.25rem, 20vw, 17\.5rem\), calc\(min\(22vh, 15rem\) \* 1\.8\)\);/
  );
});

test("v9 renders the supplied-reference ring compass without changing v8", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );

  assert.match(hero, /variant === "v9" \|\|/);
  assert.match(hero, /class="wind-rose reference-ring-compass"/);
  assert.match(hero, /class="reference-ring-compass-ring"/);
  assert.match(hero, /reference-ring-compass-face-light/);
  assert.match(hero, /reference-ring-compass-face-dark/);
  assert.match(hero, /r="31"/);
  assert.doesNotMatch(hero, /reference-ring-compass-letter/);
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
    /const isRadial =[\s\S]*variant === "v9a" \|\|[\s\S]*variant === "v9b" \|\|[\s\S]*variant === "v9c" \|\|[\s\S]*variant === "v9d" \|\|[\s\S]*variant === "v10" \|\|[\s\S]*variant === "v11" \|\|[\s\S]*variant === "v12";/
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

test("V11 removes the seaweed-paper introductory sentence", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(
    hero,
    /Élaboration du papier de notre menu à base d'algues marines/
  );
});

test("V11 adds a Déguster menu panel that cross-fades over the same media", async () => {
  for (const key of ["timeline", "menuItems", "poster", "streamMp4Url", "audioSrc"]) {
    assert.deepEqual(LANDING_VARIANTS.v11[key], LANDING_VARIANTS.v10[key]);
  }
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );
  const demo = await readFile(
    new URL("../src/scripts/demo.ts", import.meta.url),
    "utf8"
  );
  assert.match(hero, /href="#carte"[\s\S]*data-open-carte/);
  assert.match(hero, /3 Vagues & Mignardises/);
  assert.match(hero, /7 Vagues & Mignardises/);
  assert.match(hero, /Chariot de Fromages Affinés/);
  assert.match(hero, /--carte-step: 625ms/);
  assert.match(demo, /is-carte-open/);
  assert.doesNotMatch(demo, /video\.(pause|load)\(\)[\s\S]{0,40}carte/);
});

test("V11 carte menu items preserve the price-free presentation", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );
  assert.match(hero, /variant === "v12"\s*\? \[\]/);
  assert.match(
    hero,
    /variant === "v12"\s*\?\s*"3 Vagues & Mignardises — 55"/
  );
  assert.match(hero, /Tarif par Personne/);

  assert.match(hero, /3 Vagues & Mignardises/);
  assert.match(hero, /Accord Mets & Vins/);
  assert.match(hero, /Accord Mets & Thés/);
  assert.match(hero, /5 Vagues & Mignardises/);
  assert.match(hero, /7 Vagues & Mignardises/);
  assert.match(hero, /Chariot de Fromages Affinés/);
  assert.match(hero, /Rivage/);
  assert.match(hero, /Grand Large/);
  assert.match(hero, /Pleine Mer/);
  assert.match(hero, /Pâturage/);
});

test("V11 carte footer carries no price disclosure line", async () => {
  const hero = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(hero, /Prix en Euros/);
  assert.doesNotMatch(hero, /Nets TTC/);
  assert.doesNotMatch(hero, /Service Compris/);
});

test("V12 preserves V11's presentation and music while using its own carte and black media transition", async () => {
  assert.deepEqual(LANDING_VARIANTS.v12.timeline, LANDING_VARIANTS.v11.timeline);
  assert.deepEqual(LANDING_VARIANTS.v12.menuItems, LANDING_VARIANTS.v11.menuItems);
  assert.equal(LANDING_VARIANTS.v12.poster, LANDING_VARIANTS.v11.poster);
  assert.equal(LANDING_VARIANTS.v12.backgroundBlurPx, LANDING_VARIANTS.v11.backgroundBlurPx);
  assert.equal(LANDING_VARIANTS.v12.audioSrc, "musique");
  assert.equal(
    LANDING_VARIANTS.v12.streamMp4Url,
    LANDING_VARIANTS.v11.streamMp4Url
  );

  const [hero, demo, route] = await Promise.all([
    readFile(new URL("../src/components/HeroVideo.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/scripts/demo.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/v12/index.astro", import.meta.url), "utf8"),
  ]);

  assert.match(route, /<LandingDemo variant="v12"\s*\/>/);
  assert.match(hero, /variant === "v11" \|\| variant === "v12"/);
  assert.match(hero, /variant === "v11" \|\| variant === "v12";/);
  assert.match(
    hero,
    /"font-bodoni-moda":\s+variant === "v9b" \|\|\s+variant === "v10" \|\|\s+variant === "v11" \|\|\s+variant === "v12"/
  );
  assert.match(hero, /"radial-menu": isRadial/);
  assert.match(hero, /\.landing\.is-black \.transition-overlay/);
  assert.match(hero, /background: #000;/);
  assert.match(hero, /transition: opacity 250ms ease;/);
  assert.match(hero, /3 Vagues & Mignardises — 55/);
  assert.match(hero, /Accord Mets & Vins — 20/);
  assert.match(hero, /Accord Mets & Thés — 14/);
  assert.match(hero, /5 Vagues & Mignardises — 79/);
  assert.match(hero, /Accord Mets & Vins — 48/);
  assert.match(hero, /Accord Mets & Thés — 27/);
  assert.match(hero, /7 Vagues & Mignardises — 110/);
  assert.match(hero, /Accord Mets & Vins — 65/);
  assert.match(hero, /Accord Mets & Thés — 39/);
  assert.doesNotMatch(hero, /Prix original/);
  assert.match(hero, /variant === "v12"\s*\? \[\]\s*:/);

  assert.match(demo, /root\.dataset\.demoVariant/);
  assert.match(demo, /const BLACK_FADE_MS = 250/);
  assert.match(demo, /window\.setTimeout\(swap, BLACK_FADE_MS\)/);
  assert.match(demo, /loadeddata/);
  assert.match(demo, /error/);
  assert.match(
    demo,
    /window\.setTimeout\(\s*\(\) => settle\(false\),\s*VIDEO_LOAD_TIMEOUT_MS\s*\)/
  );
  assert.equal(
    LANDING_VARIANTS.v12.carteStreamMp4Url,
    "https://videos.pexels.com/video-files/30474577/13058534_1080_1920_60fps.mp4"
  );
  assert.match(demo, /carteVideoURL = root\.dataset\.carteVideoSrc/);
});
