import type { Page } from "@playwright/test";

export const installExtensionApiMock = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    Object.defineProperty(window, "browser", {
      configurable: true,
      value: {
        runtime: {
          getURL: (path: string) => `chrome-extension://booktidy/${path}`,
        },
      },
    });
  });
};
