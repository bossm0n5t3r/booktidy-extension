import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { installExtensionApiMock } from "./helpers/extension-api.js";

const contentScriptPath = resolve("dist/assets/content.js");
const contentStylePath = resolve("dist/assets/content.css");
const fixturePath = resolve("tests/fixtures/kyobo-search.html");
const kyoboUrl = "https://search.kyobobook.co.kr/search?keyword=booktidy";

const routeFixture = async (page: Page): Promise<void> => {
  await page.route(kyoboUrl, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: readFileSync(fixturePath, "utf-8"),
    });
  });
};

test("collapses publisher-matched books and restores the original item", async ({ page }) => {
  expect(
    existsSync(contentScriptPath),
    "dist/assets/content.js is missing. Run pnpm build before pnpm test:e2e.",
  ).toBe(true);
  expect(
    existsSync(contentStylePath),
    "dist/assets/content.css is missing. Run pnpm build before pnpm test:e2e.",
  ).toBe(true);

  await routeFixture(page);
  await page.goto(kyoboUrl);
  await installExtensionApiMock(page);
  await page.evaluate(() => {
    Object.defineProperty(window, "__BOOKTIDY_TEST_STATE__", {
      configurable: true,
      value: {
        version: 1,
        settings: { enabled: true },
        filterRules: [
          {
            id: "rule-publisher",
            type: "publisher",
            value: "예시출판사",
            matchMode: "contains",
            enabled: true,
            createdAt: "2026-07-04T00:00:00.000Z",
            updatedAt: "2026-07-04T00:00:00.000Z",
          },
        ],
      },
    });
  });
  await page.addStyleTag({ path: contentStylePath });
  await page.addScriptTag({ path: contentScriptPath });

  const collapsed = page.locator('[data-booktidy-state="collapsed"]');
  await expect(collapsed).toHaveCount(1);
  await expect(collapsed).toContainText("BookTidy에 의해 접힘");
  await expect(collapsed).toContainText('사유: 출판사 "예시출판사"');

  await collapsed.getByRole("button", { name: "보기" }).click();

  await expect(page.locator('[data-booktidy-state="collapsed"]')).toHaveCount(0);
  await expect(page.locator('li.prod_item:has([data-pid="PUBLISHER_MATCH"])')).toBeVisible();
});
