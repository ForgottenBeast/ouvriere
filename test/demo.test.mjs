import assert from "node:assert/strict";
import test from "node:test";

import { DEMO_TIMELINE, canAttachVideo } from "../src/config/demo.ts";

test("the intro uses the approved finite timing contract", () => {
  assert.deepEqual(DEMO_TIMELINE, { titleIn: [0, 1000], quoteIn: [500, 1500], sharedFadeOut: [2500, 3200], listIn: [3200, 4100] });
});

test("video sources require both a URL and permission to use media", () => {
  assert.equal(canAttachVideo("", false), false);
  assert.equal(canAttachVideo("", true), false);
  assert.equal(canAttachVideo("https://example.test/video.mp4", false), false);
  assert.equal(canAttachVideo("https://example.test/video.mp4", true), true);
});
