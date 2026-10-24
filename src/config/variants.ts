import { DEMO_TIMELINE } from "./demo.ts";

const originalStreamMp4Url =
  "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9741a9cf044d648f924291e94598083c/downloads/default.mp4";

const radialTimeline = {
  ...DEMO_TIMELINE,
  titleIn: [0, 3250],
  menuItemIn: [
    [6190, 6990],
    [6815, 7615],
    [7440, 8240],
    [8065, 8865],
  ],
} as const;

const radialMenuItems = [
  { label: "Découvrir", direction: "top" },
  { label: "Déguster", direction: "bottom" },
  { label: "Réserver", direction: "left" },
  { label: "Offrir", direction: "right" },
] as const;

const v7Timeline = {
  ...DEMO_TIMELINE,
  titleIn: [0, 3250],
  menuItemIn: [
    [6990, 7790],
    [7790, 8590],
    [8590, 9390],
    [9390, 10190],
  ],
} as const;

const v7MenuItems = [
  { label: "Découvrir", direction: "top" },
  { label: "Offrir", direction: "right" },
  { label: "Déguster", direction: "bottom" },
  { label: "Réserver", direction: "left" },
] as const;

export type LandingVariant =
  | "v1"
  | "v2"
  | "v3"
  | "v4"
  | "v5"
  | "v6"
  | "v7"
  | "v8";

export const LANDING_VARIANTS = {
  v1: {
    id: "v1",
    title: "L'Ouvriere — v1",
    timeline: DEMO_TIMELINE,
    mediaMode: "single",
    poster: "ocean",
    backgroundBlurPx: 3,
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
    poster: "ocean",
    backgroundBlurPx: 3,
    streamMp4Url:
      "https://customer-spsh21dx72idjxm3.cloudflarestream.com/de890dcbcc7871e1b2114cf1f88f80e1/downloads/default.mp4",
  },
  v3: {
    id: "v3",
    title: "L'Ouvriere — v3",
    timeline: {
      ...DEMO_TIMELINE,
      titleIn: [0, 2500],
    },
    mediaMode: "single",
    poster: "green",
    backgroundBlurPx: 3,
    streamMp4Url:
      "https://customer-spsh21dx72idjxm3.cloudflarestream.com/bdcacf524d311c58a8a92f9f70ae34d4/downloads/default.mp4",
  },
  v4: {
    id: "v4",
    title: "L'Ouvriere — v4",
    timeline: {
      ...DEMO_TIMELINE,
      titleIn: [0, 2500],
    },
    mediaMode: "single",
    poster: "green",
    backgroundBlurPx: 0,
    streamMp4Url:
      "https://customer-spsh21dx72idjxm3.cloudflarestream.com/bdcacf524d311c58a8a92f9f70ae34d4/downloads/default.mp4",
  },
  v5: {
    id: "v5",
    title: "L'Ouvriere — v5",
    timeline: {
      ...DEMO_TIMELINE,
      titleIn: [0, 2500],
    },
    mediaMode: "single",
    poster: "ocean-v5",
    backgroundBlurPx: 0,
    streamMp4Url:
      "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9f1cb85817b73966e4732bee3e14edcc/downloads/default.mp4",
  },
  v6: {
    id: "v6",
    title: "L'Ouvriere — v6",
    timeline: radialTimeline,
    menuItems: radialMenuItems,
    mediaMode: "single",
    poster: "ocean-v5",
    backgroundBlurPx: 0,
    streamMp4Url:
      "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9f1cb85817b73966e4732bee3e14edcc/downloads/default.mp4",
  },
  v7: {
    id: "v7",
    title: "L'Ouvriere — v7",
    timeline: v7Timeline,
    windRoseIn: [6190, 6990],
    menuItems: v7MenuItems,
    mediaMode: "single",
    poster: "ocean-v5",
    backgroundBlurPx: 0,
    streamMp4Url:
      "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9f1cb85817b73966e4732bee3e14edcc/downloads/default.mp4",
  },
  v8: {
    id: "v8",
    title: "L'Ouvriere — v8",
    timeline: v7Timeline,
    windRoseIn: [6190, 6990],
    menuItems: v7MenuItems,
    mediaMode: "single",
    poster: "ocean-v5",
    backgroundBlurPx: 0,
    streamMp4Url:
      "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9f1cb85817b73966e4732bee3e14edcc/downloads/default.mp4",
  },
} as const;
