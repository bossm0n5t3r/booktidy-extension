import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const distRoot = path.resolve("dist");

const readDistManifest = (): Record<string, unknown> => {
  const manifestPath = path.join(distRoot, "manifest.json");
  const raw = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
};

const assertDistFile = (relativePath: string): string => {
  const filePath = path.join(distRoot, relativePath);
  expect(fs.existsSync(filePath), `expected dist file to exist: ${relativePath}`).toBe(true);
  return filePath;
};

test("Firefox MV3 manifest points to built popup/background/content artifacts", () => {
  const manifest = readDistManifest();

  expect(manifest.manifest_version).toBe(3);
  expect(manifest.name).toBe("BookTidy");
  expect(manifest.permissions).toEqual(["storage", "tabs"]);
  expect(manifest.host_permissions).toEqual(["*://*.kyobobook.co.kr/*"]);

  const action = manifest.action as { default_popup: string };
  const background = manifest.background as { scripts: string[]; type: string };
  const contentScripts = manifest.content_scripts as Array<{ js: string[]; css: string[] }>;

  expect(action.default_popup).toBe("src/popup/index.html");
  expect(background).toEqual({ scripts: ["assets/background.js"], type: "module" });
  expect(contentScripts[0]?.js).toEqual(["assets/content.js"]);
  expect(contentScripts[0]?.css).toEqual(["assets/content.css"]);

  assertDistFile(action.default_popup);
  assertDistFile(background.scripts[0]!);
  assertDistFile(contentScripts[0]!.js[0]!);
  assertDistFile(contentScripts[0]!.css[0]!);
});

test("Built popup HTML references existing Vite assets", () => {
  const popupHtmlPath = assertDistFile("src/popup/index.html");
  const html = fs.readFileSync(popupHtmlPath, "utf-8");
  const assetMatches = Array.from(html.matchAll(/(?:src|href)="\/(assets\/[^"]+)"/g));

  expect(assetMatches.length).toBeGreaterThan(0);
  for (const match of assetMatches) {
    assertDistFile(match[1]!);
  }
});
