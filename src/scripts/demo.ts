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
  const audio = root.querySelector<HTMLAudioElement>("[data-demo-audio]");
  const audioToggle = root.querySelector<HTMLButtonElement>(
    "[data-audio-toggle]"
  );
  const skip = root.querySelector<HTMLButtonElement>("[data-intro-skip]");
  const menu = root.querySelector<HTMLElement>("[data-demo-menu]");
  const carte = root.querySelector<HTMLElement>("[data-demo-carte]");
  const openCarte = root.querySelector<HTMLAnchorElement>("[data-open-carte]");
  const closeCarte =
    root.querySelector<HTMLAnchorElement>("[data-close-carte]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = (
    navigator as Navigator & { connection?: NavigatorConnection }
  ).connection;
  const videoSourceURL = root.dataset.videoSrc || streamMp4Url;
  const variant = root.dataset.variant || "v1";
  const pexelsVideoURL =
    "https://videos.pexels.com/video-files/30474577/13058534_1080_1920_60fps.mp4";
  let mediaGeneration = 0;
  let finishTimer: number | undefined;
  const introCompletion =
    Number(root.dataset.introCompletion) ||
    DEMO_TIMELINE.menuItemIn[DEMO_TIMELINE.menuItemIn.length - 1][1];

  const setPlaybackControl = () => {
    if (!video || !toggle) return;
    const paused = video.paused;
    toggle.textContent = paused ? "Lire la vidéo" : "Mettre la vidéo en pause";
    toggle.setAttribute("aria-pressed", String(!paused));
  };
  const initialiseAudio = () => {
    if (!audio || !audioToggle) return;
    const setAudioControl = () => {
      if (audio.error) {
        audioToggle.disabled = true;
        audioToggle.textContent = "Musique indisponible";
        audioToggle.setAttribute("aria-pressed", "false");
        return;
      }
      const playing = !audio.paused;
      audioToggle.textContent = playing
        ? "Couper la musique"
        : "Activer la musique";
      audioToggle.setAttribute("aria-pressed", String(playing));
    };
    audio.volume = 0.35;
    audio.controls = false;
    audio.hidden = true;
    audioToggle.hidden = false;
    audio.addEventListener("play", setAudioControl);
    audio.addEventListener("pause", setAudioControl);
    audio.addEventListener("error", setAudioControl);
    audioToggle.addEventListener("click", () => {
      if (audio.paused) audio.play().catch(() => setAudioControl());
      else audio.pause();
    });
  };

  const mediaAllowed = () =>
    !reducedMotion.matches && connection?.saveData !== true;
  const detachVideo = () => {
    mediaGeneration += 1;
    if (!video) return;
    const toggleWasFocused = toggle === document.activeElement;
    video.pause();
    const sources = video.querySelectorAll("source");
    if (sources.length === 0) {
      root.classList.remove("has-video");
      toggle?.setAttribute("aria-hidden", "true");
      if (toggle) toggle.tabIndex = -1;
      if (toggleWasFocused)
        document.getElementById("mentions-trigger")?.focus();
      return;
    }
    sources.forEach(source => source.remove());
    video.load();
    root.classList.remove("has-video");
    toggle?.setAttribute("aria-hidden", "true");
    if (toggle) toggle.tabIndex = -1;
    if (toggleWasFocused) document.getElementById("mentions-trigger")?.focus();
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
    finishTimer = window.setTimeout(() => setFinalState(), introCompletion);
  };

  const attachVideo = () => {
    if (
      !video ||
      !canAttachVideo(videoSourceURL, mediaAllowed()) ||
      video.querySelector("source")
    )
      return;
    const generation = ++mediaGeneration;
    const source = document.createElement("source");
    source.src = videoSourceURL;
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
        root.classList.add("has-video");
        toggle?.removeAttribute("aria-hidden");
        if (toggle) toggle.tabIndex = 0;
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
  initialiseAudio();
  const setCarte = (open: boolean) => {
    if (!carte) return;
    if (open) setFinalState();
    root.classList.toggle("is-carte-open", open);
    if (open) carte.focus({ preventScroll: true });
    else openCarte?.focus();
  };

  // Video source switching under opaque black.
  // Open carte: fade to black, swap source, play, fade back.
  // Close carte / Escape: fade to black, restore original source, play, fade back.
  let transitionInFlight = false;

  const swapVideoAndWait = (newSrc: string, onReady: () => void) => {
    if (!video) return;
    if (!canAttachVideo(newSrc, mediaAllowed())) {
      onReady();
      return;
    }
    mediaGeneration += 1;
    const generation = mediaGeneration;
    const sources = video.querySelectorAll("source");
    sources.forEach(s => s.remove());
    const newSource = document.createElement("source");
    newSource.src = newSrc;
    newSource.type = "video/mp4";
    video.append(newSource);
    video.load();
    const settle = () => {
      if (generation !== mediaGeneration) return;
      video.removeEventListener("loadedmetadata", settle);
      onReady();
    };
    video.addEventListener("loadedmetadata", settle);
  };

  // Fade to black, swap video, then fade back in and resume playback.
  const switchVideoUnderBlack = (newSrc: string) => {
    if (!video) return;
    // Never fade to black when media is not allowed: the poster stays put.
    if (!mediaAllowed()) return;
    if (transitionInFlight) return;
    transitionInFlight = true;

    // 1. Fade scrim to opaque black while original still plays.
    root.classList.add("is-black");

    // 2. After black is visible, pause and swap.
    video.pause();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(guard);
      video.play().catch(() => undefined);
      root.classList.remove("is-black");
      transitionInFlight = false;
    };
    // Safety net: if the new source never loads, clear the black cover so the
    // UI is never stranded behind an opaque scrim.
    const guard = window.setTimeout(finish, 5000);
    swapVideoAndWait(newSrc, finish);
  };

  const restoreOriginalAndFade = () => {
    switchVideoUnderBlack(videoSourceURL);
  };
  openCarte?.addEventListener("click", event => {
    event.preventDefault();
    setCarte(true);
    if (variant === "v12") switchVideoUnderBlack(pexelsVideoURL);
  });
  closeCarte?.addEventListener("click", event => {
    event.preventDefault();
    setCarte(false);
    if (variant === "v12") restoreOriginalAndFade();
  });
  carte?.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      setCarte(false);
      if (variant === "v12") restoreOriginalAndFade();
    }
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
