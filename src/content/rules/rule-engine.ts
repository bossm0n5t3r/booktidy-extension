import { matchContains } from "./matcher";
import type { BookItem, FilterResult, FilterRule } from "./rule-types";

export const evaluateRules = (book: BookItem, rules: FilterRule[]): FilterResult => {
  for (const rule of rules) {
    if (!rule.enabled) {
      continue;
    }

    if (rule.type === "publisher" && book.publisher && matchContains(book.publisher, rule.value)) {
      return { matched: true, rule, reason: `출판사 "${rule.value}"` };
    }

    if (
      rule.type === "author" &&
      book.authors.some((author) => matchContains(author, rule.value))
    ) {
      return { matched: true, rule, reason: `저자 "${rule.value}"` };
    }
  }

  return { matched: false };
};
