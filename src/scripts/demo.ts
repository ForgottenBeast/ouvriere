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
  const variant = root.dataset.demoVariant || "v1";
  const carteVideoURL = root.dataset.carteVideoSrc;
  const BLACK_FADE_MS = 250;
  const VIDEO_LOAD_TIMEOUT_MS = 5000;
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

  let transitionInFlight = false;
  let transitionTimer: number | undefined;
  let activeVideoURL = videoSourceURL;

  const cancelMediaTransition = () => {
    window.clearTimeout(transitionTimer);
    root.classList.remove("is-black");
    transitionInFlight = false;
  };

  const loadVideo = (newSrc: string, onSettled: (loaded: boolean) => void) => {
    if (!video || !canAttachVideo(newSrc, mediaAllowed())) {
      onSettled(false);
      return;
    }
    mediaGeneration += 1;
    const generation = mediaGeneration;
    video.querySelectorAll("source").forEach(source => source.remove());
    const source = document.createElement("source");
    source.src = newSrc;
    source.type = "video/mp4";
    video.append(source);
    video.load();

    let settled = false;
    const settle = (loaded: boolean) => {
      if (settled || generation !== mediaGeneration) return;
      settled = true;
      window.clearTimeout(timeout);
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onError);
      onSettled(loaded);
    };
    const onLoaded = () => settle(true);
    const onError = () => settle(false);
    const timeout = window.setTimeout(
      () => settle(false),
      VIDEO_LOAD_TIMEOUT_MS
    );
    video.addEventListener("loadeddata", onLoaded, { once: true });
    video.addEventListener("error", onError, { once: true });
  };

  const switchVideoUnderBlack = (newSrc: string) => {
    if (!video || !newSrc || !mediaAllowed() || transitionInFlight) return;
    transitionInFlight = true;
    root.classList.add("is-black");
    const previousVideoURL = activeVideoURL;
    const finish = () => {
      video.play().catch(() => undefined);
      cancelMediaTransition();
    };
    const swap = () => {
      video.pause();
      loadVideo(newSrc, loaded => {
        if (loaded) {
          activeVideoURL = newSrc;
          finish();
          return;
        }
        if (previousVideoURL === newSrc) {
          detachVideo();
          cancelMediaTransition();
          return;
        }
        loadVideo(previousVideoURL, restored => {
          if (restored) activeVideoURL = previousVideoURL;
          else detachVideo();
          finish();
        });
      });
    };
    transitionTimer = window.setTimeout(swap, BLACK_FADE_MS);
  };

  const restoreOriginalAndFade = () => {
    switchVideoUnderBlack(videoSourceURL);
  };
  openCarte?.addEventListener("click", event => {
    event.preventDefault();
    setCarte(true);
    if (variant === "v12" && carteVideoURL)
      switchVideoUnderBlack(carteVideoURL);
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
