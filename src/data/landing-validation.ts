const STREAM_UID_PATTERN = /^[a-f0-9]{32}$/;

export interface LandingContent {
  menuLabels: [string, string, string];
  video: { streamUid: string };
}

export const streamMp4UrlFor = (streamUid: string) =>
  `https://customer-spsh21dx72idjxm3.cloudflarestream.com/${streamUid}/downloads/default.mp4`;

export const parseLandingContent = (value: unknown): LandingContent => {
  if (!value || typeof value !== "object") {
    throw new Error("Landing content must be an object.");
  }

  const { menuLabels, video } = value as Record<string, unknown>;
  if (
    !Array.isArray(menuLabels) ||
    menuLabels.length !== 3 ||
    !menuLabels.every(
      label =>
        typeof label === "string" &&
        label.trim().length > 0 &&
        label.trim() === label &&
        label.length <= 80
    )
  ) {
    throw new Error("Landing menu labels must be three trimmed strings.");
  }

  const streamUid =
    video && typeof video === "object"
      ? (video as Record<string, unknown>).streamUid
      : undefined;
  if (typeof streamUid !== "string" || !STREAM_UID_PATTERN.test(streamUid)) {
    throw new Error(
      "Landing video Stream UID must be 32 lowercase hexadecimal characters."
    );
  }

  return {
    menuLabels: menuLabels as [string, string, string],
    video: { streamUid },
  };
};
