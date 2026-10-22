export const DEMO_TIMELINE = {
  titleIn: [0, 1000],
  quoteIn: [500, 1500],
  sharedFadeOut: [2500, 3200],
  listIn: [3200, 4100],
} as const;

// Public Cloudflare Stream MP4 used by the landing-page background player.
export const streamMp4Url =
  "https://customer-spsh21dx72idjxm3.cloudflarestream.com/dfdd8aa3018f15b13f2a75ec8ad1deae/downloads/default.mp4";

export const canAttachVideo = (url: string, mediaAllowed: boolean) =>
  Boolean(url) && mediaAllowed;
