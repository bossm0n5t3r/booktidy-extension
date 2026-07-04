import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const distRoot = path.resolve(process.cwd(), "dist");

function readDistManifest(): Record<string, unknown> {
  const manifestPath = path.join(distRoot, "manifest.json");
  const raw = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function assertDistFile(relativePath: string): string {
  const filePath = path.join(distRoot, relativePath);
  expect(fs.existsSync(filePath), `expected dist file to exist: ${relativePath}`).toBe(true);
  return filePath;
}

test("Firefox MV3 manifest points to built popup/background/content artifacts", () => {
  const manifest = readDistManifest();

  expect(manifest.manifest_version).toBe(3);
  expect(manifest.name).toBe("BookTidy");

  const action = manifest.action as Record<string, string>;
  assertDistFile(action.default_popup);

  const background = manifest.background as Record<string, string | string[]>;
  for (const script of background.scripts as string[]) {
    assertDistFile(script);
  }

  const contentScripts = manifest.content_scripts as Array<Record<string, string | string[]>>;
  for (const entry of contentScripts) {
    for (const js of (entry.js ?? []) as string[]) {
      assertDistFile(js);
    }
    for (const css of (entry.css ?? []) as string[]) {
      assertDistFile(css);
    }
  }
});

test("Built popup HTML references existing Vite assets", () => {
  const popupHtmlPath = assertDistFile("src/popup/index.html");
  const html = fs.readFileSync(popupHtmlPath, "utf-8");

  const scriptMatch = html.match(/<script[^>]+src="([^"]+)"/);
  expect(scriptMatch, "popup HTML must reference a script bundle").not.toBeNull();
  const scriptPath = scriptMatch![1].replace(/^\//, "");
  assertDistFile(scriptPath);

  const styleMatch = html.match(/<link[^>]+href="([^"]+)"/);
  expect(styleMatch, "popup HTML must reference a style bundle").not.toBeNull();
  const stylePath = styleMatch![1].replace(/^\//, "");
  assertDistFile(stylePath);
});
