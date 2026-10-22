import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DEMO_TIMELINE, canAttachVideo } from "../src/config/demo.ts";

test("the intro uses the approved finite timing contract", () => {
  assert.deepEqual(DEMO_TIMELINE, {
    titleIn: [0, 2000],
    quoteIn: [1000, 3000],
    sharedFadeOut: [5000, 6190],
    menuItemIn: [
      [6190, 6990],
      [6815, 7615],
      [7440, 8240],
    ],
  });
});

test("the display-only menu uses the approved cuisine label", async () => {
  const component = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );
  assert.match(component, />La cuisine<\/li>/);
  assert.doesNotMatch(component, />La maison<\/li>/);
});

test("video sources require both a URL and permission to use media", () => {
  assert.equal(canAttachVideo("", false), false);
  assert.equal(canAttachVideo("", true), false);
  assert.equal(canAttachVideo("https://example.test/video.mp4", false), false);
  assert.equal(canAttachVideo("https://example.test/video.mp4", true), true);
});

test("the legal disclosure retains the approved interim source snapshot", async () => {
  const [fixture, component] = await Promise.all([
    readFile(new URL("./legal-notice.fixture.txt", import.meta.url), "utf8"),
    readFile(new URL("../src/components/HeroVideo.astro", import.meta.url), "utf8"),
  ]);
  const normalizedComponent = component.replace(/\s+/g, " ");
  for (const paragraph of fixture.trim().split("\n\n")) {
    const normalizedParagraph = paragraph.replace(/\s+/g, " ");
    assert.ok(
      normalizedComponent.includes(normalizedParagraph),
      `missing legal text: ${paragraph}`
    );
  }
});

test("display-only menu items remain hit-testable for their pointer affordance", async () => {
  const component = await readFile(
    new URL("../src/components/HeroVideo.astro", import.meta.url),
    "utf8"
  );
  assert.match(
    component,
    /\.menu li\s*\{[^}]*cursor:\s*pointer;[^}]*pointer-events:\s*auto;/s
  );
});
