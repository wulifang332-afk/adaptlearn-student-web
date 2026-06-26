import { chromium } from "@playwright/test";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const outputDir = "/Users/cube/Documents/Playground/outputs/adaptlearn_iccse_submission/media";
const rawDir = path.join(outputDir, "raw-playwright");
const adminBase = "http://127.0.0.1:3001";
const consoleBase = "http://127.0.0.1:3002";
const viewport = { width: 1280, height: 720 };

async function ensureCleanDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function waitReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);
  await page.waitForTimeout(650);
}

async function savePoster(page, name) {
  await page.screenshot({
    path: path.join(outputDir, name),
    fullPage: false,
  });
}

async function saveElementShot(page, selector, name, fallbackFullPage = false) {
  const target = page.locator(selector).first();
  try {
    await target.waitFor({ state: "visible", timeout: 5000 });
    await target.screenshot({ path: path.join(outputDir, name) });
  } catch {
    await page.screenshot({
      path: path.join(outputDir, name),
      fullPage: fallbackFullPage,
    });
  }
}

async function clickNav(page, text) {
  const link = page.getByRole("link", { name: new RegExp(text, "i") }).first();
  await link.waitFor({ state: "visible", timeout: 10000 });
  await link.hover();
  await page.waitForTimeout(250);
  await link.click();
  await waitReady(page);
}

async function gotoAppRoute(page, url, heading) {
  await page.goto(url);
  await waitReady(page);
  if (heading) {
    await page.getByRole("heading", { name: new RegExp(heading, "i") }).first().waitFor({
      state: "visible",
      timeout: 15000,
    });
  }
}

async function convertWebmToMp4(input, output) {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    input,
    "-vf",
    "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    output,
  ]);
}

async function recordContext(browser, name) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: rawDir, size: viewport },
  });
  const page = await context.newPage();
  return { context, page, name };
}

async function finishRecording(context, page, outputName) {
  const video = page.video();
  await page.close();
  await context.close();
  if (!video) throw new Error(`No video recorded for ${outputName}`);
  const rawPath = await video.path();
  await convertWebmToMp4(rawPath, path.join(outputDir, outputName));
}

async function recordConsole(browser) {
  const { context, page } = await recordContext(browser, "console");

  await gotoAppRoute(page, `${consoleBase}/foundation`, "System Overview");
  await savePoster(page, "console-poster.png");
  await saveElementShot(page, "[data-testid='foundation-readiness-source']", "console-highlight-readiness.png");
  await saveElementShot(page, "[data-testid='student-safe-output']", "console-highlight-safe-output.png");

  await page.mouse.wheel(0, 360);
  await page.waitForTimeout(650);
  await page.mouse.wheel(0, -360);
  await page.waitForTimeout(350);

  await gotoAppRoute(page, `${consoleBase}/foundation/rls`, "RLS Policy Viewer");
  await saveElementShot(page, "[data-testid='rls-readiness-api']", "console-highlight-rls.png", true);
  await page.mouse.wheel(0, 460);
  await page.waitForTimeout(650);

  await gotoAppRoute(page, `${consoleBase}/foundation/agents/workflows`, "Agent Workflow Registry");
  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(750);

  await gotoAppRoute(page, `${consoleBase}/foundation/jobs`, "Queue / Job Monitor");
  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(750);

  await gotoAppRoute(page, `${consoleBase}/foundation/generator`, "Schema / CRUD Generator");
  await saveElementShot(page, "[data-testid='generator-dry-run-preview']", "console-highlight-generator.png", true);
  await page.mouse.wheel(0, 460);
  await page.waitForTimeout(900);

  await finishRecording(context, page, "adaptlearn-console-demo.mp4");
}

async function recordAdmin(browser) {
  const { context, page } = await recordContext(browser, "admin");

  await page.goto(`${adminBase}/admin`);
  await waitReady(page);
  await savePoster(page, "admin-poster.png");
  await saveElementShot(page, ".dashboard-grid .side-panel", "admin-highlight-publish-guard.png", true);

  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(650);
  await saveElementShot(page, ".projection-panel", "admin-highlight-safe-projection.png", true);
  await page.mouse.wheel(0, -420);
  await page.waitForTimeout(350);

  await clickNav(page, "Diagnosis");
  await saveElementShot(page, ".panel.panel-large", "admin-highlight-diagnosis.png", true);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(650);

  await clickNav(page, "Path Review");
  await waitReady(page);
  await saveElementShot(page, ".path-review-grid .panel.panel-large", "admin-highlight-path-review.png", true);
  await page.getByPlaceholder("Record the teacher-facing reason before changing this path.").fill(
    "Split evidence reasoning before publishing to students.",
  );
  await page.waitForTimeout(450);
  await page.getByRole("button", { name: "Modify" }).click();
  await page.waitForTimeout(700);
  await saveElementShot(page, "section.panel:has-text('DecisionTrace display')", "admin-highlight-decision-trace.png", true);
  await page.mouse.wheel(0, 520);
  await page.waitForTimeout(900);

  await clickNav(page, "Review Cases");
  await page.waitForTimeout(800);

  await finishRecording(context, page, "adaptlearn-admin-demo.mp4");
}

async function main() {
  await ensureCleanDir(rawDir);
  const browser = await chromium.launch({ headless: true });
  try {
    await recordConsole(browser);
    await recordAdmin(browser);
  } finally {
    await browser.close();
  }
  console.log(`Recorded Admin and Console videos/screenshots to ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
