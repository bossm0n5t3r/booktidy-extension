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

test("collapses dynamically added author-matched books", async ({ page }) => {
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
            id: "rule-author",
            type: "author",
            value: "동적저자",
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
  await page.evaluate(() => {
    const list = document.querySelector("ul.prod_list");

    if (!list) {
      throw new Error("Fixture list is missing");
    }

    const item = document.createElement("li");
    item.className = "prod_item";
    item.innerHTML = `
      <input class="result_checkbox" type="checkbox" data-pid="DYNAMIC_AUTHOR_MATCH" />
      <div class="prod_name_group">
        <a class="prod_info" href="/detail/dynamic">
          <span class="prod_category">국내도서</span>
          <span id="cmdtName_DYNAMIC_AUTHOR_MATCH">동적 도서</span>
        </a>
      </div>
      <div class="prod_author_group">
        <a class="author" href="/author/dynamic">동적저자</a>
      </div>
      <div class="prod_publish">
        <a class="text" href="/publisher/dynamic">동적출판사</a>
      </div>
    `;
    list.append(item);
  });

  await expect(
    page.locator('[data-booktidy-state="collapsed"]').filter({ hasText: '저자 "동적저자"' }),
  ).toBeVisible();
});
