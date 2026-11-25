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
const chromium = "/run/current-system/sw/bin/chromium";
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
        file.endsWith(".js") ? "text/javascript" : "text/html; charset=utf-8"
      );
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });

const waitFor = async (fn, message) => {
  for (let index = 0; index < 50; index += 1) {
    try {
      return await fn();
    } catch {
      await delay(100);
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

test("v12 switches videos only after the black fade and restores the v11 source", { timeout: 30000 }, async () => {
  const server = serve();
  await new Promise(resolve => server.listen(port, "127.0.0.1", resolve));
  const profile = join(tmpdir(), `ouvriere-v12-${process.pid}`);
  const browser = spawn(chromium, [
    "--headless=new",
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "about:blank",
  ]);

  try {
    await waitFor(
      () => fetch(`http://127.0.0.1:${chromePort}/json/version`),
      "Chromium CDP did not start"
    );
    const cdp = await connect();
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
    await delay(500);
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
    const initial = await evaluate(`(() => ({
      variant: document.querySelector("[data-demo-root]").dataset.demoVariant,
      source: document.querySelector("[data-demo-video] source")?.src,
      text: document.body.innerText,
    }))()`);
    assert.equal(initial.variant, "v12");
    assert.equal(initial.source, main);
    assert.match(initial.text, /3 Vagues & Mignardises — 55/);
    assert.doesNotMatch(initial.text, /Pâturage/);

    const click = async selector => {
      await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    };

    await click("[data-intro-skip]");
    await delay(50);
    await click("[data-open-carte]");
    await delay(50);
    const duringOpen = await evaluate(`(() => ({
      black: document.querySelector("[data-demo-root]").classList.contains("is-black"),
      carte: document.querySelector("[data-demo-root]").classList.contains("is-carte-open"),
      complete: document.querySelector("[data-demo-root]").classList.contains("is-complete"),
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      source: document.querySelector("[data-demo-video] source")?.src,
    }))()`);
    assert.equal(duringOpen.black, true, JSON.stringify(duringOpen));
    assert.equal(duringOpen.source, main);
    await delay(350);
    const opened = await evaluate(`(() => ({
      black: document.querySelector("[data-demo-root]").classList.contains("is-black"),
      carte: document.querySelector("[data-demo-root]").classList.contains("is-carte-open"),
      source: document.querySelector("[data-demo-video] source")?.src,
    }))()`);
    assert.deepEqual(opened, { black: false, carte: true, source: pexels });

    await click("[data-close-carte]");
    await delay(350);
    const closed = await evaluate(`(() => ({
      black: document.querySelector("[data-demo-root]").classList.contains("is-black"),
      carte: document.querySelector("[data-demo-root]").classList.contains("is-carte-open"),
      source: document.querySelector("[data-demo-video] source")?.src,
    }))()`);
    assert.deepEqual(closed, { black: false, carte: false, source: main });
    cdp.close();
  } finally {
    browser.kill("SIGTERM");
    await new Promise(resolve => browser.once("exit", resolve));
    await new Promise(resolve => server.close(resolve));
  }
});
