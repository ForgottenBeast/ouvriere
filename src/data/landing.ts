import rawLanding from "./landing.json" with { type: "json" };
import { parseLandingContent, streamMp4UrlFor } from "./landing-validation.ts";

export { parseLandingContent, streamMp4UrlFor } from "./landing-validation.ts";

export const landing = parseLandingContent(rawLanding);
export const streamMp4Url = streamMp4UrlFor(landing.video.streamUid);
