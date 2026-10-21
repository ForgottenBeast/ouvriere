export const DEMO_TIMELINE = {
  titleIn: [0, 1000],
  quoteIn: [500, 1500],
  sharedFadeOut: [2500, 3200],
  listIn: [3200, 4100],
} as const;

// Populate only when the publication team supplies an approved Stream MP4 URL.
// No Stream identifier is inferred or committed by this prototype.
export const streamMp4Url = "";

export const canAttachVideo = (url: string, mediaAllowed: boolean) =>
  Boolean(url) && mediaAllowed;
