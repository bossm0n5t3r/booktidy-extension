import "./styles.css";

import { observeBookMutations } from "./mutation-observer";
import { renderCollapsedBook } from "./renderer/collapsed-renderer";
import { evaluateRules } from "./rules/rule-engine";
import { detectSiteAdapter } from "./site-detector";
import { storageClient } from "./storage/storage-client";

export const startBookTidy = async (): Promise<void> => {
  let schema;

  try {
    schema = await storageClient.getSchema();
  } catch (error) {
    console.warn("BookTidy failed to initialize", error);
    return;
  }

  if (!schema.settings.enabled) {
    return;
  }

  document.documentElement.dataset.booktidyTheme = schema.settings.theme;

  const adapter = detectSiteAdapter(new URL(window.location.href));

  if (!adapter) {
    return;
  }

  const processBooks = (): void => {
    const elements = adapter.findBookElements(document);

    for (const element of elements) {
      try {
        const book = adapter.extractBookItem(element);

        if (!book) {
          continue;
        }

        renderCollapsedBook(book, evaluateRules(book, schema.filterRules));
      } catch (error) {
        console.warn("BookTidy skipped a book item", error);
      }
    }
  };

  processBooks();

  if (document.body) {
    observeBookMutations(document.body, processBooks);
  }
};

void startBookTidy();
