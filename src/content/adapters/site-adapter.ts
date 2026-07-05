import type { BookItem, SupportedSite } from "../rules/rule-types";

export interface SiteAdapter {
  site: SupportedSite;
  matches(url: URL): boolean;
  findBookElements(root: ParentNode): HTMLElement[];
  extractBookItem(element: HTMLElement): BookItem | null;
}
