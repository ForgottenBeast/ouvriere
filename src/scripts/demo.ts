import { DEMO_TIMELINE, canAttachVideo, streamMp4Url } from "../config/demo";

interface NavigatorConnection {
  saveData?: boolean;
  addEventListener?: (event: "change", listener: () => void) => void;
}

const initialise = () => {
  const root = document.querySelector<HTMLElement>("[data-demo-root]");
  if (!root) return;

  const video = root.querySelector<HTMLVideoElement>("[data-demo-video]");
  const toggle = root.querySelector<HTMLButtonElement>("[data-video-toggle]");
  const skip = root.querySelector<HTMLButtonElement>("[data-intro-skip]");
  const menu = root.querySelector<HTMLElement>("[data-demo-menu]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = (
    navigator as Navigator & { connection?: NavigatorConnection }
  ).connection;
  let mediaGeneration = 0;
  let finishTimer: number | undefined;

  const setPlaybackControl = () => {
    if (!video || !toggle) return;
    const paused = video.paused;
    toggle.textContent = paused ? "Lire la vidéo" : "Mettre la vidéo en pause";
    toggle.setAttribute("aria-pressed", String(!paused));
  };

  const mediaAllowed = () =>
    !reducedMotion.matches && connection?.saveData !== true;
  const detachVideo = () => {
    mediaGeneration += 1;
    if (!video) return;
    video.pause();
    const sources = video.querySelectorAll("source");
    if (sources.length === 0) {
      toggle?.setAttribute("hidden", "");
      return;
    }
    sources.forEach(source => source.remove());
    video.load();
    toggle?.setAttribute("hidden", "");
  };

  const setFinalState = (moveFocus = false) => {
    window.clearTimeout(finishTimer);
    const skipWasFocused = skip === document.activeElement;
    root.classList.add("is-complete");
    skip?.removeAttribute("hidden");
    skip?.setAttribute("aria-hidden", "true");
    if (skip) skip.tabIndex = -1;
    if (moveFocus || skipWasFocused) menu?.focus();
  };

  const setStaticState = () => {
    window.clearTimeout(finishTimer);
    root.classList.remove("is-enhanced", "is-complete");
    skip?.setAttribute("aria-hidden", "true");
    if (skip) skip.tabIndex = -1;
  };

  const startIntro = () => {
    root.classList.remove("is-complete");
    root.classList.add("is-enhanced");
    skip?.removeAttribute("aria-hidden");
    if (skip) skip.tabIndex = 0;
    finishTimer = window.setTimeout(
      () => setFinalState(),
      DEMO_TIMELINE.listIn[1]
    );
  };

  const attachVideo = () => {
    if (
      !video ||
      !canAttachVideo(streamMp4Url, mediaAllowed()) ||
      video.querySelector("source")
    )
      return;
    const generation = ++mediaGeneration;
    const source = document.createElement("source");
    source.src = streamMp4Url;
    source.type = "video/mp4";
    video.append(source);
    video.load();
    video
      .play()
      .then(() => {
        if (
          generation !== mediaGeneration ||
          !mediaAllowed() ||
          !source.isConnected
        )
          return;
        toggle?.removeAttribute("hidden");
        setPlaybackControl();
      })
      .catch(() => {
        if (generation === mediaGeneration) detachVideo();
      });
  };

  if (reducedMotion.matches) setStaticState();
  else startIntro();
  attachVideo();
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      detachVideo();
      setStaticState();
    } else {
      startIntro();
      attachVideo();
    }
  });
  connection?.addEventListener?.("change", () => {
    if (mediaAllowed()) attachVideo();
    else detachVideo();
  });
  skip?.addEventListener("click", () => setFinalState(true));
  toggle?.addEventListener("click", () => {
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  });
  video?.addEventListener("play", setPlaybackControl);
  video?.addEventListener("pause", setPlaybackControl);
  video?.addEventListener("error", detachVideo);
};

initialise();
