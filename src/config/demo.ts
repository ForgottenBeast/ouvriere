export const DEMO_TIMELINE = {
  titleIn: [0, 2000],
  quoteIn: [1000, 3000],
  sharedFadeOut: [5000, 6190],
  menuItemIn: [
    [6190, 6990],
    [6815, 7615],
    [7440, 8240],
  ],
} as const;

// Public Cloudflare Stream MP4 used by the landing-page background player.
export const streamMp4Url =
  "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9741a9cf044d648f924291e94598083c/downloads/default.mp4";

export const canAttachVideo = (url: string, mediaAllowed: boolean) =>
  Boolean(url) && mediaAllowed;
