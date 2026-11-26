import { DEMO_TIMELINE, canAttachVideo, streamMp4Url } from "../config/demo";

interface NavigatorConnection {
  saveData?: boolean;
  addEventListener?: (event: "change", listener: () => void) => void;
}

const initialise = () => {
  const root = document.querySelector<HTMLElement>("[data-demo-root]");
  if (!root) return;

  const video = root.querySelector<HTMLVideoElement>("[data-demo-video]");
  const loopVideo = root.querySelector<HTMLVideoElement>(
    "[data-demo-video-loop]"
  );
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
  const BLACK_FADE_MS = 1000;
  const VIDEO_LOOP_FADE_MS = 1000;
  const VIDEO_LOOP_PREROLL_MS = 1000;
  const VIDEO_LOAD_TIMEOUT_MS = 5000;
  let mediaGeneration = 0;
  let finishTimer: number | undefined;
  let activeVideo = video;
  let loopFadeEnabled = false;
  let loopFadeActive = false;
  let loopPrerollActive = false;
  let loopPrerollVideo: HTMLVideoElement | undefined;
  let loopPrerollLastTime = 0;
  let loopPrerollAdvanced = false;
  let loopMonitorTimer: number | undefined;
  const introCompletion =
    Number(root.dataset.introCompletion) ||
    DEMO_TIMELINE.menuItemIn[DEMO_TIMELINE.menuItemIn.length - 1][1];

  const setPlaybackControl = () => {
    if (!activeVideo || !toggle) return;
    const paused = activeVideo.paused;
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
    clearLoopPreroll();
    clearLoopFade();
    if (!video) return;
    const toggleWasFocused = toggle === document.activeElement;
    [video, loopVideo].filter(Boolean).forEach(player => {
      player?.pause();
      player?.querySelectorAll("source").forEach(source => source.remove());
      player?.load();
    });
    activeVideo = video;
    loopFadeEnabled = false;
    root.classList.remove("is-loop-secondary-active");
    const sources = video.querySelectorAll("source");
    if (sources.length === 0) {
      root.classList.remove("has-video");
      toggle?.setAttribute("aria-hidden", "true");
      if (toggle) toggle.tabIndex = -1;
      if (toggleWasFocused)
        document.getElementById("mentions-trigger")?.focus();
      return;
    }
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
  let queuedVideoURL: string | undefined;

  const clearLoopFade = () => {
    window.clearTimeout(loopMonitorTimer);
    loopMonitorTimer = undefined;
    loopFadeActive = false;
    root.classList.remove("is-video-loop-fading");
  };

  const clearLoopPreroll = (pauseIncoming = true) => {
    const incoming = loopPrerollVideo;
    loopPrerollActive = false;
    loopPrerollVideo = undefined;
    loopPrerollLastTime = 0;
    loopPrerollAdvanced = false;
    root.classList.remove("is-video-loop-prerolling");
    if (pauseIncoming && incoming && incoming !== activeVideo) {
      incoming.pause();
      incoming.currentTime = 0;
    }
  };

  const isLoopVideo = (player: HTMLVideoElement | null) =>
    Boolean(loopVideo && player === loopVideo);

  const settleLoop = () => {
    if (!video || !loopVideo || !activeVideo || !loopFadeActive) return;
    const outgoing = activeVideo;
    const incoming = outgoing === video ? loopVideo : video;
    outgoing.pause();
    outgoing.currentTime = 0;
    activeVideo = incoming;
    clearLoopPreroll(false);
    clearLoopFade();
    root.classList.toggle("is-loop-secondary-active", isLoopVideo(activeVideo));
    setPlaybackControl();
    monitorPexelsLoop();
  };

  const restartActiveLoop = () => {
    if (!activeVideo || activeVideo.paused) return;
    clearLoopPreroll();
    clearLoopFade();
    activeVideo.currentTime = 0;
    activeVideo.play().catch(() => detachVideo());
  };

  const startPexelsPreroll = () => {
    if (
      !video ||
      !loopVideo ||
      !loopFadeEnabled ||
      loopFadeActive ||
      !activeVideo ||
      activeVideo.paused ||
      !Number.isFinite(activeVideo.duration) ||
      activeVideo.duration - activeVideo.currentTime >
        (VIDEO_LOOP_PREROLL_MS + VIDEO_LOOP_FADE_MS) / 1000
    )
      return;
    const incoming = activeVideo === video ? loopVideo : video;
    if (loopPrerollActive && loopPrerollVideo === incoming) return;
    clearLoopPreroll();
    loopPrerollActive = true;
    loopPrerollVideo = incoming;
    root.classList.add("is-video-loop-prerolling");
    const playIncoming = () => {
      incoming
        .play()
        .then(() => {
          if (
            !loopFadeEnabled ||
            incoming !== (activeVideo === video ? loopVideo : video) ||
            incoming !== loopPrerollVideo
          )
            return;
          monitorPexelsLoop();
        })
        .catch(() => detachVideo());
    };
    const playAfterReset = () => {
      if (incoming !== loopPrerollVideo || incoming.currentTime > 0.1) return;
      playIncoming();
    };
    if (incoming.currentTime > 0.1) {
      incoming.addEventListener("seeked", playAfterReset, { once: true });
      incoming.currentTime = 0;
    } else {
      incoming.currentTime = 0;
      playIncoming();
    }
  };

  const prerollIsAdvancing = (incoming: HTMLVideoElement) => {
    const currentTime = incoming.currentTime;
    if (currentTime > loopPrerollLastTime + 0.02) loopPrerollAdvanced = true;
    loopPrerollLastTime = currentTime;
    return (
      loopPrerollActive &&
      loopPrerollVideo === incoming &&
      loopPrerollAdvanced &&
      !incoming.paused &&
      incoming.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      currentTime >= VIDEO_LOOP_PREROLL_MS / 1000 - 0.1
    );
  };

  const fadePexelsLoop = () => {
    if (
      !video ||
      !loopVideo ||
      !loopFadeEnabled ||
      loopFadeActive ||
      !activeVideo ||
      activeVideo.paused ||
      !Number.isFinite(activeVideo.duration)
    )
      return;
    const remaining = activeVideo.duration - activeVideo.currentTime;
    if (remaining > (VIDEO_LOOP_PREROLL_MS + VIDEO_LOOP_FADE_MS) / 1000) return;
    startPexelsPreroll();
    if (remaining > VIDEO_LOOP_FADE_MS / 1000) return;
    const incoming = activeVideo === video ? loopVideo : video;
    if (!prerollIsAdvancing(incoming)) {
      if (remaining <= 0.05) restartActiveLoop();
      return;
    }
    loopFadeActive = true;
    clearLoopPreroll(false);
    root.classList.add("is-video-loop-fading");
  };

  const monitorPexelsLoop = () => {
    if (
      !activeVideo ||
      !loopFadeEnabled ||
      loopFadeActive ||
      activeVideo.paused
    )
      return;
    fadePexelsLoop();
    if (!loopFadeActive && loopMonitorTimer === undefined)
      loopMonitorTimer = window.setTimeout(() => {
        loopMonitorTimer = undefined;
        monitorPexelsLoop();
      }, 50);
  };

  const configureVideoLoop = (sourceURL: string) => {
    if (!video) return;
    clearLoopPreroll();
    clearLoopFade();
    activeVideo = video;
    root.classList.remove("is-loop-secondary-active");
    loopFadeEnabled =
      variant === "v12" && sourceURL === carteVideoURL && Boolean(loopVideo);
    video.loop = !loopFadeEnabled;
    if (loopVideo) loopVideo.loop = false;
  };

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
    configureVideoLoop(newSrc);
    const players = loopFadeEnabled && loopVideo ? [video, loopVideo] : [video];
    if (loopVideo && !loopFadeEnabled) {
      loopVideo.pause();
      loopVideo.querySelectorAll("source").forEach(source => source.remove());
      loopVideo.load();
    }
    players.forEach(player => {
      player.pause();
      player.querySelectorAll("source").forEach(source => source.remove());
      const source = document.createElement("source");
      source.src = newSrc;
      source.type = "video/mp4";
      player.append(source);
      player.load();
    });

    let settled = false;
    let remaining = players.length;
    const listeners = new Map<
      HTMLVideoElement,
      { loaded: () => void; error: () => void }
    >();
    const settle = (loaded: boolean) => {
      if (settled || generation !== mediaGeneration) return;
      settled = true;
      window.clearTimeout(timeout);
      listeners.forEach(({ loaded: onLoaded, error: onError }, player) => {
        player.removeEventListener("loadeddata", onLoaded);
        player.removeEventListener("error", onError);
      });
      onSettled(loaded);
    };
    const timeout = window.setTimeout(
      () => settle(false),
      VIDEO_LOAD_TIMEOUT_MS
    );
    players.forEach(player => {
      const onLoaded = () => {
        remaining -= 1;
        if (remaining === 0) settle(true);
      };
      const onError = () => settle(false);
      listeners.set(player, { loaded: onLoaded, error: onError });
      player.addEventListener("loadeddata", onLoaded, { once: true });
      player.addEventListener("error", onError, { once: true });
    });
  };

  const switchVideoUnderBlack = (newSrc: string) => {
    if (!video || !newSrc || !mediaAllowed()) return;
    if (transitionInFlight) {
      queuedVideoURL = newSrc;
      return;
    }
    transitionInFlight = true;
    root.classList.add("is-black");
    const previousVideoURL = activeVideoURL;
    const finish = () => {
      activeVideo?.play().catch(() => undefined);
      cancelMediaTransition();
      const nextVideoURL = queuedVideoURL;
      queuedVideoURL = undefined;
      if (nextVideoURL && nextVideoURL !== activeVideoURL)
        switchVideoUnderBlack(nextVideoURL);
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
    if (!activeVideo) return;
    const players =
      (loopFadeActive || loopPrerollActive) && video && loopVideo
        ? [video, loopVideo]
        : [activeVideo];
    if (activeVideo.paused)
      players.forEach(player => player.play().catch(() => undefined));
    else players.forEach(player => player.pause());
  });
  [video, loopVideo].filter(Boolean).forEach(player => {
    player?.addEventListener("play", () => {
      setPlaybackControl();
      monitorPexelsLoop();
    });
    player?.addEventListener("pause", () => {
      setPlaybackControl();
      if (loopPrerollActive && player === activeVideo) clearLoopPreroll();
      if (loopFadeActive && player === activeVideo) {
        if (
          Number.isFinite(player.duration) &&
          player.currentTime >= player.duration
        ) {
          settleLoop();
        } else {
          clearLoopFade();
        }
      }
    });
    player?.addEventListener("loadedmetadata", monitorPexelsLoop);
    player?.addEventListener("seeked", monitorPexelsLoop);
    player?.addEventListener("timeupdate", () => {
      if (player === loopPrerollVideo) prerollIsAdvancing(player);
      fadePexelsLoop();
      if (
        loopFadeActive &&
        activeVideo &&
        activeVideo.paused &&
        Number.isFinite(activeVideo.duration) &&
        activeVideo.duration - activeVideo.currentTime <= 0.05
      )
        settleLoop();
      else if (
        loopFadeActive &&
        player === activeVideo &&
        Number.isFinite(player.duration) &&
        player.duration - player.currentTime <= 0.05
      )
        settleLoop();
    });
    player?.addEventListener("ended", () => {
      if (loopFadeActive) settleLoop();
      else if (loopFadeEnabled && player === activeVideo) restartActiveLoop();
    });
    player?.addEventListener("error", () => {
      if (player.querySelector("source")) detachVideo();
    });
  });
};

initialise();
