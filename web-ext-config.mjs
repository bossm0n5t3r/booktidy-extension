export default {
  sourceDir: "dist",
  artifactsDir: "web-ext-artifacts",
  build: {
    overwriteDest: true,
  },
  run: {
    startUrl: ["https://search.kyobobook.co.kr/search?keyword=booktidy"],
  },
};
