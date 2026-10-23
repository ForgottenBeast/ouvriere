import { DEMO_TIMELINE } from "./demo.ts";

const originalStreamMp4Url =
  "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9741a9cf044d648f924291e94598083c/downloads/default.mp4";

export type LandingVariant = "v1" | "v2";

export const LANDING_VARIANTS = {
  v1: {
    id: "v1",
    title: "L'Ouvriere — v1",
    timeline: DEMO_TIMELINE,
    mediaMode: "single",
    streamMp4Url: originalStreamMp4Url,
  },
  v2: {
    id: "v2",
    title: "L'Ouvriere — v2",
    timeline: {
      ...DEMO_TIMELINE,
      titleIn: [0, 2500],
    },
    mediaMode: "single",
    streamMp4Url:
      "https://customer-spsh21dx72idjxm3.cloudflarestream.com/de890dcbcc7871e1b2114cf1f88f80e1/downloads/default.mp4",
  },
} as const;
