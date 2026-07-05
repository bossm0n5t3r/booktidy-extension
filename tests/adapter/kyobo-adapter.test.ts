import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { kyoboAdapter } from "../../src/content/adapters/kyobo-adapter";

const fixturePath = resolve("tests/fixtures/kyobo-search.html");

describe("kyoboAdapter", () => {
  beforeEach(() => {
    document.body.innerHTML = readFileSync(fixturePath, "utf-8");
  });

  it("finds unprocessed Kyobo book elements", () => {
    expect(kyoboAdapter.findBookElements(document)).toHaveLength(4);
  });

  it("extracts title, authors, publisher, id, and container", () => {
    const firstElement = kyoboAdapter.findBookElements(document)[0];
    const book = kyoboAdapter.extractBookItem(firstElement);

    expect(book).toMatchObject({
      id: "PUBLISHER_MATCH",
      site: "kyobo",
      title: "출판사 매칭 도서",
      authors: ["김저자"],
      publisher: "예시출판사",
    });
    expect(book?.container).toBe(firstElement);
  });

  it("uses undefined when publisher is missing", () => {
    const thirdElement = kyoboAdapter.findBookElements(document)[2];

    expect(kyoboAdapter.extractBookItem(thirdElement)?.publisher).toBeUndefined();
  });

  it("skips an item when title is missing", () => {
    const fourthElement = kyoboAdapter.findBookElements(document)[3];

    expect(kyoboAdapter.extractBookItem(fourthElement)).toBeNull();
  });

  it("extracts books from the current Kyobo category card markup", () => {
    document.body.innerHTML = `
      <div class="pb-10 pt-8 flex flex-col gap-10">
        <div class="flex flex-row items-start justify-start gap-4">
          <div class="group relative">
            <input id="_r_0_" class="hidden" type="checkbox" value="on" />
          </div>
          <div class="relative flex flex-1 gap-4">
            <a
              draggable="false"
              class="absolute inset-0 z-[1]"
              aria-label="마AI스트로"
              href="https://product.kyobobook.co.kr/detail/S000220457901"
            ></a>
            <div class="flex shrink-0 flex-col gap-2">
              <a draggable="false" href="https://product.kyobobook.co.kr/detail/S000220457901">
                <img alt="마AI스트로" />
              </a>
            </div>
            <div class="flex flex-col gap-2 min-w-0 flex-1 justify-start text-left">
              <div class="flex flex-col gap-0.5">
                <p class="line-clamp-2 w-full fz-16 font-medium">마AI스트로</p>
                <div class="w-full min-w-0">
                  <span class="line-clamp-1 w-full min-w-0">장은수 · 이담북스</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <script id="item-list-schema" type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "item": {
                "@type": "Book",
                "name": "마AI스트로",
                "author": { "@type": "Person", "name": "장은수" },
                "publisher": { "@type": "Organization", "name": "이담북스" },
                "offers": {
                  "@type": "Offer",
                  "url": "https://product.kyobobook.co.kr/detail/S000220457901"
                }
              }
            }
          ]
        }
      </script>
    `;

    const [element] = kyoboAdapter.findBookElements(document);
    const book = kyoboAdapter.extractBookItem(element);

    expect(kyoboAdapter.findBookElements(document)).toHaveLength(1);
    expect(book).toMatchObject({
      id: "S000220457901",
      title: "마AI스트로",
      authors: ["장은수"],
      publisher: "이담북스",
    });
  });
});
