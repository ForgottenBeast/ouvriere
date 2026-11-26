import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import test from "node:test";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const port = 43219;
const chromePort = 9322;
const chromium = process.env.CHROMIUM || "chromium";
const pexels =
  "https://videos.pexels.com/video-files/30474577/13058534_1080_1920_60fps.mp4";
const main =
  "https://customer-spsh21dx72idjxm3.cloudflarestream.com/9f1cb85817b73966e4732bee3e14edcc/downloads/default.mp4";

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

const waitFor = async (fn, message) => {
  for (let index = 0; index < 80; index += 1) {
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

const snapshot = expression => `(() => (${expression}))()`;

test(
  "v12 fades to and from black for one second, queues rapid input, and keeps its text above the media",
  { timeout: 30000 },
  async () => {
    const server = serve();
    const profile = join(tmpdir(), `ouvriere-v12-${process.pid}`);
    let browser;
    let cdp;
    await new Promise(resolve => server.listen(port, "127.0.0.1", resolve));

    try {
      browser = spawn(chromium, [
        "--headless=new",
        `--remote-debugging-port=${chromePort}`,
        `--user-data-dir=${profile}`,
        "--no-first-run",
        "about:blank",
      ]);
      await waitFor(
        () => fetch(`http://127.0.0.1:${chromePort}/json/version`),
        "Chromium CDP did not start"
      );
      cdp = await connect();
      await cdp.send("Page.enable");
      await cdp.send("Runtime.enable");
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `
          HTMLMediaElement.prototype.play = () => Promise.resolve();
          HTMLMediaElement.prototype.load = function () {
            queueMicrotask(() => this.dispatchEvent(new Event("loadeddata")));
          };
        `,
      });
      await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/ouvriere/v12/` });
      const evaluate = async expression => {
        const result = await cdp.send("Runtime.evaluate", {
          expression,
          returnByValue: true,
          awaitPromise: true,
        });
        return result.result.value;
      };
      await waitFor(async () => {
        const source = await evaluate(
          'document.querySelector("[data-demo-video] source")?.src'
        );
        if (!source) throw new Error("video source not attached");
        return source;
      }, "v12 did not attach its initial video source");

      const initial = await evaluate(
        snapshot(`({
          variant: document.querySelector("[data-demo-root]").dataset.demoVariant,
          source: document.querySelector("[data-demo-video] source")?.src,
          overlayDuration: getComputedStyle(document.querySelector(".transition-overlay")).transitionDuration,
          text: document.body.innerText
        })`)
      );
      assert.equal(initial.variant, "v12");
      assert.equal(initial.source, main);
      assert.equal(initial.overlayDuration, "1s");
      assert.match(initial.text, /Déguster/);

      const click = selector =>
        evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
      const state = () =>
        evaluate(
          snapshot(`({
            black: document.querySelector("[data-demo-root]").classList.contains("is-black"),
            carte: document.querySelector("[data-demo-root]").classList.contains("is-carte-open"),
            source: document.querySelector("[data-demo-video] source")?.src,
            overlayOpacity: Number(getComputedStyle(document.querySelector(".transition-overlay")).opacity),
            menuVisible: Boolean([...document.querySelectorAll(".carte-inner, .controls")].find(element => element.innerText.includes("Retour") || element.innerText.includes("Lecture / pause")))
          })`)
        );

      await click("[data-intro-skip]");
      await click("[data-open-carte]");
      await delay(500);
      const halfwayOpen = await state();
      assert.equal(halfwayOpen.black, true, JSON.stringify(halfwayOpen));
      assert.equal(halfwayOpen.carte, true, JSON.stringify(halfwayOpen));
      assert.equal(halfwayOpen.source, main, JSON.stringify(halfwayOpen));
      assert(halfwayOpen.overlayOpacity > 0 && halfwayOpen.overlayOpacity < 1, JSON.stringify(halfwayOpen));
      assert.equal(halfwayOpen.menuVisible, true, JSON.stringify(halfwayOpen));

      await delay(850);
      const afterOpenSwap = await state();
      assert.equal(afterOpenSwap.black, false, JSON.stringify(afterOpenSwap));
      assert.equal(afterOpenSwap.carte, true, JSON.stringify(afterOpenSwap));
      assert.equal(afterOpenSwap.source, pexels, JSON.stringify(afterOpenSwap));
      assert(afterOpenSwap.overlayOpacity > 0, JSON.stringify(afterOpenSwap));

      await delay(1050);
      const opened = await state();
      assert.equal(opened.overlayOpacity, 0, JSON.stringify(opened));

      // A close while the next open fade is underway must settle on the latest requested source.
      await click("[data-close-carte]");
      await delay(500);
      const halfwayClose = await state();
      assert.equal(halfwayClose.black, true, JSON.stringify(halfwayClose));
      assert.equal(halfwayClose.carte, false, JSON.stringify(halfwayClose));
      assert.equal(halfwayClose.source, pexels, JSON.stringify(halfwayClose));
      assert(halfwayClose.overlayOpacity > 0 && halfwayClose.overlayOpacity < 1, JSON.stringify(halfwayClose));

      await delay(1900);
      const closed = await state();
      assert.equal(closed.black, false, JSON.stringify(closed));
      assert.equal(closed.carte, false, JSON.stringify(closed));
      assert.equal(closed.source, main, JSON.stringify(closed));
      assert.equal(closed.overlayOpacity, 0, JSON.stringify(closed));

      await click("[data-open-carte]");
      await delay(100);
      await click("[data-close-carte]");
      await delay(4100);
      const rapidlyClosed = await state();
      assert.deepEqual(
        rapidlyClosed,
        { black: false, carte: false, source: main, overlayOpacity: 0, menuVisible: false },
        JSON.stringify(rapidlyClosed)
      );
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
