import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import test from "node:test";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const port = 43221;
const chromePort = port + 1;
const chromium = process.env.CHROMIUM || "chromium";
const pexels =
  "https://videos.pexels.com/video-files/30474577/13058534_1080_1920_60fps.mp4";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const serve = () =>
  createServer(async (request, response) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    const projectPath = pathname.replace(/^\/ouvriere(?=\/|$)/, "") || "/";
    const relative = projectPath.endsWith("/") ? `${projectPath}index.html` : projectPath;
    const file = normalize(join(dist, relative));
    if (!file.startsWith(`${dist}/`)) return response.writeHead(403).end();
    try {
      await stat(file);
      response.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "text/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : "text/html; charset=utf-8"
      );
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });

const waitFor = async (fn, message, attempts = 240) => {
  let lastError;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await delay(50);
    }
  }
  throw new Error(`${message}: ${lastError instanceof Error ? lastError.message : lastError}`);
};

const connect = async () => {
  const targets = await (await fetch(`http://127.0.0.1:${chromePort}/json`)).json();
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) pending.get(message.id)?.(message);
  });
  return {
    async send(method, params = {}) {
      const id = ++nextId;
      const result = new Promise((resolve, reject) =>
        pending.set(id, message => {
          pending.delete(id);
          if (message.error) reject(new Error(message.error.message));
          else resolve(message.result);
        })
      );
      ws.send(JSON.stringify({ id, method, params }));
      return result;
    },
    close: () => ws.close(),
  };
};

test(
  "v12 observes real Pexels playback across a faded loop without mocking media",
  { timeout: 45000 },
  async () => {
    const server = serve();
    const profile = join(tmpdir(), `ouvriere-real-v12-${process.pid}`);
    let browser;
    let cdp;
    await new Promise(resolve => server.listen(port, "127.0.0.1", resolve));

    try {
      browser = spawn(chromium, [
        "--headless=new",
        `--remote-debugging-port=${chromePort}`,
        `--user-data-dir=${profile}`,
        "--no-first-run",
        "--autoplay-policy=no-user-gesture-required",
        "about:blank",
      ]);
      await waitFor(
        () => fetch(`http://127.0.0.1:${chromePort}/json/version`),
        "Chromium CDP did not start"
      );
      cdp = await connect();
      await cdp.send("Page.enable");
      await cdp.send("Runtime.enable");
      await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/ouvriere/v12/` });

      const evaluate = async expression => {
        const result = await cdp.send("Runtime.evaluate", {
          expression,
          returnByValue: true,
          awaitPromise: true,
        });
        return result.result.value;
      };
      const videoState = () =>
        evaluate(`(() => {
          const root = document.querySelector("[data-demo-root]");
          const players = [...document.querySelectorAll("[data-demo-video], [data-demo-video-loop]")];
          const carte = document.querySelector("[data-demo-carte]");
          return {
            sources: players.map(player => player.querySelector("source")?.src),
            paused: players.map(player => player.paused),
            readyStates: players.map(player => player.readyState),
            dimensions: players.map(player => [player.videoWidth, player.videoHeight]),
            durations: players.map(player => player.duration),
            currentTimes: players.map(player => player.currentTime),
            opacities: players.map(player => Number(getComputedStyle(player).opacity)),
            zIndexes: players.map(player => getComputedStyle(player).zIndex),
            activeSecondary: root.classList.contains("is-loop-secondary-active"),
            loopPrerolling: root.classList.contains("is-video-loop-prerolling"),
            loopFading: root.classList.contains("is-video-loop-fading"),
            overlayOpacity: Number(getComputedStyle(document.querySelector(".transition-overlay")).opacity),
            posterOpacity: Number(getComputedStyle(document.querySelector(".poster")).opacity),
            carteTextVisible: getComputedStyle(carte).visibility === "visible" && carte.innerText.includes("3 Vagues & Mignardises")
          };
        })()`);

      await waitFor(async () => {
        const state = await videoState();
        if (!state.sources[0]) throw new Error("initial video source was not attached");
        return state;
      }, "v12 did not attach its initial source");
      await evaluate('document.querySelector("[data-intro-skip]").click()');
      await evaluate('document.querySelector("[data-open-carte]").click()');

      const playingPexels = await waitFor(async () => {
        const state = await videoState();
        if (
          state.sources.length !== 2 ||
          state.sources.some(source => source !== pexels) ||
          state.paused[0] ||
          !state.paused[1] ||
          state.readyStates.some(readyState => readyState < 2) ||
          state.dimensions.some(([width, height]) => width === 0 || height === 0) ||
          state.durations.some(duration => !Number.isFinite(duration) || duration <= 2) ||
          state.overlayOpacity > 0.01
        )
          throw new Error(JSON.stringify(state));
        return state;
      }, "both Pexels layers did not reach real playable state");
      assert.equal(playingPexels.carteTextVisible, true, JSON.stringify(playingPexels));
      assert(playingPexels.overlayOpacity < 0.01, JSON.stringify(playingPexels));
      assert.equal(playingPexels.posterOpacity, 0, JSON.stringify(playingPexels));

      await evaluate('document.querySelector("[data-video-toggle]").click()');
      const pausedByControl = await waitFor(async () => {
        const state = await videoState();
        if (state.paused.some(paused => !paused)) throw new Error(JSON.stringify(state));
        return state;
      }, "the video pause control did not pause both Pexels layers");
      assert.equal(pausedByControl.carteTextVisible, true, JSON.stringify(pausedByControl));
      await evaluate('document.querySelector("[data-video-toggle]").click()');
      await waitFor(async () => {
        const state = await videoState();
        if (state.paused[0] || !state.paused[1]) throw new Error(JSON.stringify(state));
        return state;
      }, "the video pause control did not resume both Pexels layers");

      // Let real Pexels frames advance for eight seconds before forcing two observed overlaps.
      await delay(8000);
      const afterEightSeconds = await videoState();
      assert(
        afterEightSeconds.currentTimes.some(currentTime => currentTime > 7) ||
          afterEightSeconds.loopFading ||
          afterEightSeconds.activeSecondary,
        JSON.stringify(afterEightSeconds)
      );

      const observeOverlap = async (activeIndex, expectedSecondary) => {
        await evaluate(`(() => {
          const players = [...document.querySelectorAll("[data-demo-video], [data-demo-video-loop]")];
          const incomingIndex = ${activeIndex} === 0 ? 1 : 0;
          players[incomingIndex].pause();
          players[incomingIndex].currentTime = 0;
          players[${activeIndex}].currentTime = players[${activeIndex}].duration - 2.05;
          return players[${activeIndex}].play();
        })()`);
        const incomingIndex = activeIndex === 0 ? 1 : 0;
        const outgoingIndex = activeIndex;
        const prerollStarted = await waitFor(async () => {
          const state = await videoState();
          if (
            !state.loopPrerolling ||
            state.loopFading ||
            state.currentTimes[incomingIndex] <= 0.05
          )
            throw new Error(JSON.stringify(state));
          return state;
        }, "Pexels loop did not begin hidden incoming playback");
        await delay(150);
        const prerollAdvancing = await videoState();
        assert(
          prerollAdvancing.loopPrerolling &&
            !prerollAdvancing.loopFading &&
            prerollAdvancing.currentTimes[incomingIndex] >
              prerollStarted.currentTimes[incomingIndex] + 0.02,
          JSON.stringify({ prerollStarted, prerollAdvancing })
        );
        assert(prerollAdvancing.opacities[outgoingIndex] > 0.999, JSON.stringify(prerollAdvancing));
        const started = await waitFor(async () => {
          const state = await videoState();
          if (
            !state.loopFading ||
            state.currentTimes[activeIndex] < state.durations[activeIndex] - 1.2
          )
            throw new Error(JSON.stringify(state));
          return state;
        }, "Pexels loop did not begin a transparent overlap");
        assert(
          started.currentTimes[incomingIndex] >= 0.75 &&
            started.currentTimes[incomingIndex] <= 1.35 &&
            !started.paused[incomingIndex],
          JSON.stringify(started)
        );
        await delay(500);
        const midpoint = await videoState();
        const compositedVideoAlpha =
          midpoint.opacities[incomingIndex] +
          midpoint.opacities[outgoingIndex] *
            (1 - midpoint.opacities[incomingIndex]);
        assert.equal(midpoint.loopFading, true, JSON.stringify(midpoint));
        assert.equal(midpoint.zIndexes[incomingIndex], "1", JSON.stringify(midpoint));
        assert.equal(midpoint.zIndexes[outgoingIndex], "0", JSON.stringify(midpoint));
        assert(midpoint.opacities[outgoingIndex] > 0.999, JSON.stringify(midpoint));
        assert(
          midpoint.opacities[incomingIndex] > 0.35 &&
            midpoint.opacities[incomingIndex] < 0.65,
          JSON.stringify(midpoint)
        );
        assert(compositedVideoAlpha > 0.999, JSON.stringify({ midpoint, compositedVideoAlpha }));
        assert.equal(midpoint.overlayOpacity, 0, JSON.stringify(midpoint));
        assert.equal(midpoint.posterOpacity, 0, JSON.stringify(midpoint));
        assert(midpoint.paused.every(paused => !paused), JSON.stringify(midpoint));
        const settled = await waitFor(async () => {
          const state = await videoState();
          if (state.loopFading || state.activeSecondary !== expectedSecondary || state.paused[expectedSecondary ? 1 : 0])
            throw new Error(JSON.stringify(state));
          return state;
        }, "Pexels loop did not settle on the incoming live layer", 120);
        await delay(100);
        const promoted = await videoState();
        const promotedIncomingIndex = expectedSecondary ? 1 : 0;
        const promotedOutgoingIndex = expectedSecondary ? 0 : 1;
        const promotedVideoAlpha =
          promoted.opacities[promotedIncomingIndex] +
          promoted.opacities[promotedOutgoingIndex] *
            (1 - promoted.opacities[promotedIncomingIndex]);
        assert.equal(promoted.loopFading, false, JSON.stringify(promoted));
        assert.equal(promoted.zIndexes[promotedIncomingIndex], "1", JSON.stringify(promoted));
        assert(promoted.opacities[promotedIncomingIndex] > 0.999, JSON.stringify(promoted));
        assert(promotedVideoAlpha > 0.999, JSON.stringify({ promoted, promotedVideoAlpha }));
        return { started, midpoint, settled, promoted };
      };

      const settledAfterEightSeconds = await waitFor(async () => {
        const state = await videoState();
        if (state.loopFading) throw new Error(JSON.stringify(state));
        return state;
      }, "the natural eight-second playback did not settle its first overlap", 120);

      const firstActiveIndex = settledAfterEightSeconds.activeSecondary ? 1 : 0;
      const firstLoop = await observeOverlap(
        firstActiveIndex,
        firstActiveIndex === 0
      );
      const secondLoop = await observeOverlap(
        firstActiveIndex === 0 ? 1 : 0,
        firstActiveIndex !== 0
      );
      assert.equal(secondLoop.settled.carteTextVisible, true, JSON.stringify(secondLoop));
      console.log("v12 real transparent loop evidence", JSON.stringify({ afterEightSeconds, firstLoop, secondLoop }));
    } finally {
      cdp?.close();
      if (browser && !browser.killed) {
        browser.kill("SIGTERM");
        await new Promise(resolve => browser.once("exit", resolve));
      }
      await new Promise(resolve => server.close(resolve));
    }
  }
);
