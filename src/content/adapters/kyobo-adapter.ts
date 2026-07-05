import { normalizeText } from "../rules/matcher";
import type { BookItem } from "../rules/rule-types";
import type { SiteAdapter } from "./site-adapter";

interface StructuredBookData {
  authors: string[];
  publisher?: string;
}

interface SchemaBook {
  author?: SchemaNamedValue | SchemaNamedValue[];
  name?: string;
  offers?: {
    url?: string;
  };
  publisher?: SchemaNamedValue;
}

interface SchemaListItem {
  item?: SchemaBook;
}

interface SchemaNamedValue {
  name?: string;
}

const KYBO_PRODUCT_DETAIL_PATTERN = /product\.kyobobook\.co\.kr\/detail\/([^/?#]+)/;

const getText = (element: Element | null): string => element?.textContent?.trim() ?? "";

const getProductIdFromHref = (href: string | null): string | undefined => {
  const match = href?.match(KYBO_PRODUCT_DETAIL_PATTERN);
  return match?.[1];
};

const getProductLink = (element: HTMLElement): HTMLAnchorElement | null => {
  return element.querySelector<HTMLAnchorElement>(
    'a[href*="product.kyobobook.co.kr/detail/"][aria-label], a[href*="product.kyobobook.co.kr/detail/"]',
  );
};

const normalizeSchemaName = (value: SchemaNamedValue | undefined): string | undefined => {
  const name = value?.name?.trim();
  return name && name.length > 0 ? name : undefined;
};

const normalizeSchemaAuthors = (author: SchemaBook["author"]): string[] => {
  const authors = Array.isArray(author) ? author : [author];

  return authors.flatMap((item) => {
    const name = normalizeSchemaName(item);
    return name ? [name] : [];
  });
};

const getStructuredBookMap = (document: Document): Map<string, StructuredBookData> => {
  const map = new Map<string, StructuredBookData>();

  for (const script of document.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]',
  )) {
    const text = script.textContent?.trim();

    if (!text) {
      continue;
    }

    try {
      const data = JSON.parse(text) as { itemListElement?: SchemaListItem[] };

      for (const listItem of data.itemListElement ?? []) {
        const book = listItem.item;
        const productId = getProductIdFromHref(book?.offers?.url ?? null);

        if (!book || !productId) {
          continue;
        }

        map.set(productId, {
          authors: normalizeSchemaAuthors(book.author),
          publisher: normalizeSchemaName(book.publisher),
        });
      }
    } catch {
      continue;
    }
  }

  return map;
};

const getTitle = (element: HTMLElement): string => {
  const titleElement = element.querySelector<HTMLElement>('span[id^="cmdtName_"]');
  const spanTitle = titleElement?.textContent?.trim() ?? "";

  if (spanTitle.length > 0) {
    return spanTitle;
  }

  const productLink = getProductLink(element);
  const ariaTitle = productLink?.getAttribute("aria-label")?.trim() ?? "";

  if (ariaTitle.length > 0) {
    return ariaTitle;
  }

  const cardTitle = getText(element.querySelector("p.line-clamp-2"));

  if (cardTitle.length > 0) {
    return cardTitle;
  }

  const infoElement = element.querySelector<HTMLElement>("a.prod_info");
  const clonedInfo = infoElement?.cloneNode(true);

  if (!(clonedInfo instanceof HTMLElement)) {
    return "";
  }

  for (const category of clonedInfo.querySelectorAll(".prod_category")) {
    category.remove();
  }

  return clonedInfo.textContent?.trim() ?? "";
};

const getId = (element: HTMLElement, title: string): string => {
  const checkbox = element.querySelector<HTMLElement>("input.result_checkbox[data-pid]");
  const dataPid = checkbox?.dataset.pid;

  if (dataPid && dataPid.length > 0) {
    return dataPid;
  }

  const productId = getProductIdFromHref(getProductLink(element)?.getAttribute("href") ?? null);

  if (productId) {
    return productId;
  }

  const titleElement = element.querySelector<HTMLElement>('span[id^="cmdtName_"]');
  const titleElementId = titleElement?.id;

  if (titleElementId?.startsWith("cmdtName_")) {
    return titleElementId.replace(/^cmdtName_/, "");
  }

  const fallbackId = element.dataset.booktidyId;

  if (fallbackId && fallbackId.length > 0) {
    return fallbackId;
  }

  return `kyobo-${normalizeText(title)}`;
};

const getAuthors = (element: HTMLElement): string[] => {
  const authors: string[] = [];
  const seenAuthors = new Set<string>();

  for (const authorElement of element.querySelectorAll<HTMLElement>(
    ".prod_author_group a.author",
  )) {
    const author = authorElement.textContent?.trim() ?? "";

    if (author.length === 0 || seenAuthors.has(author)) {
      continue;
    }

    seenAuthors.add(author);
    authors.push(author);
  }

  return authors;
};

const getCardMetadata = (element: HTMLElement): StructuredBookData => {
  for (const span of element.querySelectorAll<HTMLElement>("span")) {
    const text = getText(span);

    if (!text.includes(" · ")) {
      continue;
    }

    const [authorText, publisherText] = text.split(/\s+·\s+/, 2);
    const author = authorText.trim();
    const publisher = publisherText.trim();

    return {
      authors: author.length > 0 ? [author] : [],
      publisher: publisher.length > 0 ? publisher : undefined,
    };
  }

  return { authors: [] };
};

export const kyoboAdapter: SiteAdapter = {
  site: "kyobo",

  matches(url: URL): boolean {
    return url.hostname === "kyobobook.co.kr" || url.hostname.endsWith(".kyobobook.co.kr");
  },

  findBookElements(root: ParentNode): HTMLElement[] {
    const elements = new Set<HTMLElement>(
      root.querySelectorAll<HTMLElement>("li.prod_item:not([data-booktidy-processed='true'])"),
    );

    for (const productLink of root.querySelectorAll<HTMLAnchorElement>(
      'a.absolute.inset-0[aria-label][href*="product.kyobobook.co.kr/detail/"]',
    )) {
      const container = productLink.parentElement?.parentElement;

      if (container instanceof HTMLElement && container.dataset.booktidyProcessed !== "true") {
        elements.add(container);
      }
    }

    return Array.from(elements);
  },

  extractBookItem(element: HTMLElement): BookItem | null {
    const title = getTitle(element);

    if (title.length === 0) {
      return null;
    }

    const publisherText =
      element.querySelector<HTMLElement>(".prod_publish > a.text")?.textContent?.trim() ?? "";
    const productId = getProductIdFromHref(getProductLink(element)?.getAttribute("href") ?? null);
    const structuredData = productId
      ? getStructuredBookMap(element.ownerDocument).get(productId)
      : undefined;
    const cardMetadata = structuredData ? undefined : getCardMetadata(element);
    const publisher =
      publisherText.length > 0
        ? publisherText
        : (structuredData?.publisher ?? cardMetadata?.publisher);

    const authors = getAuthors(element);

    return {
      id: getId(element, title),
      site: "kyobo",
      title,
      authors:
        authors.length > 0 ? authors : (structuredData?.authors ?? cardMetadata?.authors ?? []),
      publisher,
      container: element,
    };
  },
};
