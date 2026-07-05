const startUrl = process.env.BOOKTIDY_WEB_EXT_START_URL ?? "about:blank";

export default {
  sourceDir: "dist",
  artifactsDir: "web-ext-artifacts",
  build: {
    overwriteDest: true,
  },
  run: {
    startUrl: [startUrl],
  },
};
