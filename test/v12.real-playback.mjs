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
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await fn();
    } catch {
      await delay(50);
    }
  }
  throw new Error(message);
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
          const video = document.querySelector("[data-demo-video]");
          const carte = document.querySelector("[data-demo-carte]");
          return {
            source: video.querySelector("source")?.src,
            paused: video.paused,
            readyState: video.readyState,
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            currentTime: video.currentTime,
            loop: video.loop,
            loopFading: root.classList.contains("is-video-loop-fading"),
            videoOpacity: Number(getComputedStyle(video).opacity),
            carteTextVisible: getComputedStyle(carte).visibility === "visible" && carte.innerText.includes("3 Vagues & Mignardises")
          };
        })()`);

      await waitFor(async () => {
        const state = await videoState();
        if (!state.source) throw new Error("initial video source was not attached");
        return state;
      }, "v12 did not attach its initial source");
      await evaluate('document.querySelector("[data-intro-skip]").click()');
      await evaluate('document.querySelector("[data-open-carte]").click()');

      const playingPexels = await waitFor(async () => {
        const state = await videoState();
        if (
          state.source !== pexels ||
          state.paused ||
          state.readyState < 2 ||
          state.width === 0 ||
          state.height === 0 ||
          !Number.isFinite(state.duration) ||
          state.duration <= 2
        )
          throw new Error(JSON.stringify(state));
        return state;
      }, "Pexels video did not reach real playable state");
      assert.equal(playingPexels.loop, false, JSON.stringify(playingPexels));
      assert.equal(playingPexels.carteTextVisible, true, JSON.stringify(playingPexels));

      await evaluate('document.querySelector("[data-video-toggle]").click()');
      const pausedByControl = await waitFor(async () => {
        const state = await videoState();
        if (!state.paused) throw new Error(JSON.stringify(state));
        return state;
      }, "the video pause control did not pause Pexels playback");
      assert.equal(pausedByControl.carteTextVisible, true, JSON.stringify(pausedByControl));
      await evaluate('document.querySelector("[data-video-toggle]").click()');
      await waitFor(async () => {
        const state = await videoState();
        if (state.paused) throw new Error(JSON.stringify(state));
        return state;
      }, "the video pause control did not resume Pexels playback");

      await evaluate(`(() => {
        const video = document.querySelector("[data-demo-video]");
        video.currentTime = video.duration - 1.15;
        return video.play();
      })()`);
      const fadeStarted = await waitFor(async () => {
        const state = await videoState();
        if (!state.loopFading || state.currentTime < state.duration - 1.2)
          throw new Error(JSON.stringify(state));
        return state;
      }, "Pexels loop did not begin its one-second video fade");
      assert.equal(fadeStarted.carteTextVisible, true, JSON.stringify(fadeStarted));

      const replayed = await waitFor(async () => {
        const state = await videoState();
        if (state.loopFading || state.currentTime > 0.35 || state.paused)
          throw new Error(JSON.stringify(state));
        return state;
      }, "Pexels video did not restart after the fade", 120);
      assert.equal(replayed.source, pexels, JSON.stringify(replayed));
      assert.equal(replayed.carteTextVisible, true, JSON.stringify(replayed));
      assert(replayed.videoOpacity < 1, JSON.stringify(replayed));
      console.log("v12 real loop evidence", JSON.stringify({ fadeStarted, replayed }));
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
