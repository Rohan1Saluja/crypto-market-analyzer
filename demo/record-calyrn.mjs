import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS_DIR = path.join(HERE, "artifacts");
const RAW_DIR = path.join(ARTIFACTS_DIR, "raw");

const TARGET_URL = (process.env.TARGET_URL || "https://cma-rs.vercel.app").replace(
  /\/+$/,
  "",
);

const VIEWPORT = { width: 1440, height: 900 };

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function installDemoCursor(context) {
  await context.addInitScript(() => {
    const install = () => {
      if (document.getElementById("__calyrn_demo_cursor")) {
        return;
      }

      const cursor = document.createElement("div");
      cursor.id = "__calyrn_demo_cursor";
      Object.assign(cursor.style, {
        position: "fixed",
        left: "50%",
        top: "50%",
        width: "18px",
        height: "18px",
        borderRadius: "999px",
        border: "1.5px solid rgba(255,255,255,0.92)",
        background: "rgba(162,255,224,0.16)",
        boxShadow:
          "0 0 0 5px rgba(162,255,224,0.06), 0 6px 24px rgba(0,0,0,0.35)",
        pointerEvents: "none",
        zIndex: "2147483647",
        opacity: "0",
        transform: "translate(-50%, -50%)",
        transition:
          "left 260ms cubic-bezier(.2,.8,.2,1), top 260ms cubic-bezier(.2,.8,.2,1), opacity 120ms ease",
      });

      document.documentElement.appendChild(cursor);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
      install();
    }
  });
}

async function moveCursorTo(page, locator) {
  await locator.waitFor({ state: "visible", timeout: 30_000 });
  const box = await locator.boundingBox();

  if (!box) {
    return;
  }

  await page.evaluate(
    ({ x, y }) => {
      const cursor = document.getElementById("__calyrn_demo_cursor");
      if (!cursor) return;
      cursor.style.opacity = "1";
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    },
    {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    },
  );

  await pause(280);
}

async function clickWithCursor(page, locator) {
  await moveCursorTo(page, locator);
  await locator.click();
}

async function smoothScrollTo(page, locator, offset = 120) {
  await locator.waitFor({ state: "attached", timeout: 30_000 });

  await locator.evaluate(
    (element, scrollOffset) => {
      const target =
        element.getBoundingClientRect().top + window.scrollY - scrollOffset;
      window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    },
    offset,
  );

  await pause(900);
}

async function waitForSuccessfulResponse(page, predicate) {
  const response = await page.waitForResponse(
    (candidate) => predicate(candidate.url()),
    { timeout: 30_000 },
  );

  if (!response.ok()) {
    throw new Error(
      `Demo request failed: ${response.status()} ${response.url()}`,
    );
  }
}

async function warmProduction(browser) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  try {
    await page.goto(TARGET_URL, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    await page
      .getByRole("button", { name: "Search Calyrn" })
      .waitFor({ state: "visible", timeout: 30_000 });
  } finally {
    await context.close();
  }
}

async function recordDemo() {
  await rm(ARTIFACTS_DIR, { recursive: true, force: true });
  await mkdir(RAW_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });

  await warmProduction(browser);

  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: "dark",
    recordVideo: {
      dir: RAW_DIR,
      size: VIEWPORT,
    },
  });

  await installDemoCursor(context);

  const page = await context.newPage();
  const video = page.video();
  let failure = null;

  try {
    await page.goto(TARGET_URL, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });

    const searchButton = page.getByRole("button", { name: "Search Calyrn" });
    await searchButton.waitFor({ state: "visible", timeout: 30_000 });
    await pause(900);

    await clickWithCursor(page, searchButton);
    await pause(250);

    console.log("[demo] Global search opened");

    const searchInput = page.locator('[data-slot="command-input"]');
    await searchInput.waitFor({ state: "visible", timeout: 10_000 });
    await searchInput.fill("Bitcoin");
    await pause(350);

    const bitcoinOption = page
      .locator('[data-slot="command-item"]')
      .filter({ hasText: "Bitcoin" })
      .first();

    await clickWithCursor(page, bitcoinOption);
    await page.waitForURL(/\/coin\/bitcoin(?:$|[?#])/, { timeout: 30_000 });
    console.log("[demo] Bitcoin research opened");

    const priceStructure = page.getByText("Price structure", { exact: true });
    await priceStructure.waitFor({ state: "visible", timeout: 30_000 });
    await pause(700);
    await smoothScrollTo(page, priceStructure, 110);

    const range30d = page.getByRole("button", { name: "30D", exact: true });
    const priceResponse = waitForSuccessfulResponse(
      page,
      (url) =>
        url.includes("/api/coins/bitcoin/price-history") &&
        url.includes("range=30d"),
    );
    await clickWithCursor(page, range30d);
    await priceResponse;
    console.log("[demo] 30D line history loaded");
    await pause(500);

    const candlesButton = page.getByRole("button", {
      name: "Candlestick chart",
    });
    const ohlcResponse = waitForSuccessfulResponse(
      page,
      (url) =>
        url.includes("/api/coins/bitcoin/ohlc") && url.includes("range=30d"),
    );
    await clickWithCursor(page, candlesButton);
    await ohlcResponse;
    await page
      .getByRole("img", { name: /OHLC candlestick chart/i })
      .waitFor({ state: "visible", timeout: 10_000 });
    console.log("[demo] 30D candles loaded");
    await pause(850);

    const researchLayer = page.getByText("Research layer", { exact: true });
    await smoothScrollTo(page, researchLayer, 110);

    const fundamentalsTab = page.getByRole("tab", { name: "Fundamentals" });
    await clickWithCursor(page, fundamentalsTab);
    console.log("[demo] Fundamentals opened");
    await pause(650);

    const continueResearch = page.getByText("Continue research", {
      exact: true,
    });
    await smoothScrollTo(page, continueResearch, 110);
    await pause(650);

    const nextAsset = page
      .getByRole("link", { name: /Open research/i })
      .first();
    const nextHref = await nextAsset.getAttribute("href");

    if (!nextHref) {
      throw new Error("Related-asset navigation was not available.");
    }

    await clickWithCursor(page, nextAsset);
    await page.waitForURL(
      (url) => url.pathname.startsWith("/coin/") && url.pathname !== "/coin/bitcoin",
      { timeout: 30_000 },
    );

    await page
      .getByText("Price structure", { exact: true })
      .waitFor({ state: "visible", timeout: 30_000 });
    console.log("[demo] Related asset opened");
    await pause(900);
  } catch (error) {
    failure = error;

    const message =
      error instanceof Error
        ? `${error.stack ?? error.message}\n`
        : `${String(error)}\n`;

    await writeFile(
      path.join(ARTIFACTS_DIR, "error.txt"),
      message,
      "utf8",
    ).catch(() => {});

    await page
      .screenshot({
        path: path.join(ARTIFACTS_DIR, "failure.png"),
        fullPage: true,
      })
      .catch(() => {});
  } finally {
    await context.close();

    if (video) {
      const recordedPath = await video.path();
      await copyFile(
        recordedPath,
        path.join(ARTIFACTS_DIR, "calyrn-demo.webm"),
      );
    }

    await browser.close();
  }

  if (failure) {
    throw failure;
  }
}

recordDemo().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
