export const DEMO_TIMELINE = {
  titleIn: [0, 2000],
  quoteIn: [1000, 3000],
  sharedFadeOut: [5000, 6400],
  menuItemIn: [
    [6400, 7200],
    [7025, 7825],
    [7650, 8450],
  ],
} as const;

// Public Cloudflare Stream MP4 used by the landing-page background player.
export const streamMp4Url =
  "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9741a9cf044d648f924291e94598083c/downloads/default.mp4";

export const canAttachVideo = (url: string, mediaAllowed: boolean) =>
  Boolean(url) && mediaAllowed;
