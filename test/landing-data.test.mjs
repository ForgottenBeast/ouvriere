import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import YAML from "yaml";

import {
  parseLandingContent,
  streamMp4UrlFor,
} from "../src/data/landing.ts";

const fixture = {
  menuLabels: ["Salle", "Cuisine ouverte", "Le midi"],
  video: { streamUid: "dfdd8aa3018f15b13f2a75ec8ad1deae" },
};

test("landing data accepts exactly three nonempty labels and derives the Stream URL", () => {
  const landing = parseLandingContent(fixture);

  assert.deepEqual(landing.menuLabels, fixture.menuLabels);
  assert.equal(
    streamMp4UrlFor(landing.video.streamUid),
    "https://customer-spsh21dx72idjxm3.cloudflarestream.com/dfdd8aa3018f15b13f2a75ec8ad1deae/downloads/default.mp4"
  );
});

test("landing data rejects invalid labels and Stream UIDs", () => {
  assert.throws(() =>
    parseLandingContent({ ...fixture, menuLabels: ["Salle", "", "Le midi"] })
  );
  assert.throws(() =>
    parseLandingContent({ ...fixture, menuLabels: ["Salle", "Cuisine"] })
  );
  assert.throws(() =>
    parseLandingContent({
      ...fixture,
      video: { streamUid: "not-a-stream-uid" },
    })
  );
  assert.throws(() =>
    parseLandingContent({
      ...fixture,
      video: { streamUid: ["dfdd8aa3018f15b13f2a75ec8ad1deae"] },
    })
  );
});

test("duplicate valid menu labels remain valid editorial content", () => {
  assert.deepEqual(
    parseLandingContent({ ...fixture, menuLabels: ["Menu", "Menu", "Menu"] })
      .menuLabels,
    ["Menu", "Menu", "Menu"]
  );
});

test("Pages CMS edits exactly three labels and a constrained Stream UID", async () => {
  const pagesConfig = YAML.parse(
    await readFile(new URL("../.pages.yml", import.meta.url), "utf8")
  );
  const [labels, video] = pagesConfig.content[0].fields;

  assert.deepEqual(labels.list, { min: 3, max: 3 });
  assert.equal(labels.options.minlength, 1);
  assert.equal(labels.options.maxlength, 80);
  assert.deepEqual(video.fields[0].pattern, {
    regex: "^[a-f0-9]{32}$",
    message: "L’identifiant doit contenir 32 caractères hexadécimaux minuscules.",
  });
});
