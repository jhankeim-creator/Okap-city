import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

/**
 * OKAP CITY — zouti kaptire (videyo apèsi).
 *
 * Chèche yon Chromium ki mache nan anviwònman an:
 *   1. CHROME_PATH / PUPPETEER_EXECUTABLE_PATH
 *   2. Chromium Playwright la telechaje (~/.cache/ms-playwright)
 *   3. @sparticuz/chromium (npm) + SwiftShader pou rann san GPU
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const cacheDir = path.join(root, ".capture", "chromium");

function findPlaywrightChromium() {
  const base = path.join(os.homedir(), ".cache", "ms-playwright");
  if (!fs.existsSync(base)) return null;
  const dirs = fs
    .readdirSync(base)
    .filter((d) => d.startsWith("chromium-"))
    .sort()
    .reverse();
  for (const d of dirs) {
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell", "chrome-linux64/chrome"]) {
      const p = path.join(base, d, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

function brotli(src, dst) {
  if (fs.existsSync(dst)) return dst;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, zlib.brotliDecompressSync(fs.readFileSync(src)));
  return dst;
}

function extractTar(tarPath, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  execFileSync("tar", ["-xf", tarPath, "-C", outDir], { stdio: "ignore" });
}

/** Prepare @sparticuz/chromium: binè + lib nss/nspr + SwiftShader. */
async function sparticuz() {
  const bin = path.join(root, "node_modules", "@sparticuz", "chromium", "bin");
  if (!fs.existsSync(bin)) return null;
  const chrome = path.join(cacheDir, "chromium");
  brotli(path.join(bin, "chromium.br"), chrome);
  fs.chmodSync(chrome, 0o755);
  const libs = path.join(cacheDir, "lib");
  const libTar = brotli(path.join(bin, "al2023.tar.br"), path.join(cacheDir, "al2023.tar"));
  if (!fs.existsSync(path.join(libs, "al2023", "lib", "libnss3.so"))) {
    extractTar(libTar, path.join(libs, "al2023"));
  }
  const gl = path.join(cacheDir, "gl");
  const glTar = brotli(path.join(bin, "swiftshader.tar.br"), path.join(cacheDir, "swiftshader.tar"));
  if (!fs.existsSync(path.join(gl, "libEGL.so"))) extractTar(glTar, gl);
  const fontsTar = brotli(path.join(bin, "fonts.tar.br"), path.join(cacheDir, "fonts.tar"));
  if (!fs.existsSync(path.join(cacheDir, "fonts", "fonts"))) {
    extractTar(fontsTar, path.join(cacheDir, "fonts"));
  }
  return {
    executablePath: chrome,
    ld: [path.join(libs, "al2023", "lib"), gl].join(":"),
    extraArgs: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--use-vulkan=swiftshader",
      "--enable-features=Vulkan",
      "--ignore-gpu-blocklist",
      "--disable-features=AudioServiceOutOfProcess,Translate",
      "--mute-audio",
      "--hide-scrollbars",
    ],
  };
}

export async function launchBrowser({ width = 1280, height = 720, quality = "low" } = {}) {
  const found = await sparticuz();
  const exe = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || findPlaywrightChromium() || found?.executablePath;
  if (!exe) {
    throw new Error(
      "Pa gen Chromium. Enstale l ak `npx playwright install chromium` oswa `npm i -D @sparticuz/chromium`.",
    );
  }
  const env = { ...process.env };
  if (found && exe === found.executablePath) env.LD_LIBRARY_PATH = found.ld;
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: true,
    env,
    protocolTimeout: 0,
    args: [
      ...(found && exe === found.executablePath ? found.extraArgs : ["--no-sandbox", "--disable-dev-shm-usage"]),
      `--window-size=${width},${height}`,
      "--js-flags=--max-old-space-size=4096",
    ],
    defaultViewport: { width, height, deviceScaleFactor: 1 },
  });
  return browser;
}

/** Kouri sèvè dev Vite la (oswa sèvi dist/ si li egziste). */
export async function ensureServer({ port = 4173, mode = "dev" } = {}) {
  const { spawn } = await import("node:child_process");
  const url = `http://127.0.0.1:${port}`;
  const alive = await fetch(url, { signal: AbortSignal.timeout(1200) }).then(() => true).catch(() => false);
  if (alive) return { url, stop: () => {} };
  const args = mode === "preview" && fs.existsSync(path.join(root, "dist", "index.html"))
    ? ["vite", "preview", "--port", String(port), "--host", "127.0.0.1", "--strictPort"]
    : ["vite", "--port", String(port), "--host", "127.0.0.1", "--strictPort"];
  const proc = spawn("npx", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"], env: process.env });
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Vite pa demare")), 90000);
    const onData = (buf) => {
      const s = buf.toString();
      if (s.includes("Local:") || s.includes("ready in")) {
        clearTimeout(timer);
        resolve();
      }
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("exit", (c) => reject(new Error(`Vite soti (${c})`)));
  });
  await ready;
  return { url, stop: () => proc.kill("SIGTERM") };
}

export const projectRoot = root;
