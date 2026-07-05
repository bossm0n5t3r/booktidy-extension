import type { BookItem, FilterResult } from "../rules/rule-types";

export const renderCollapsedBook = (book: BookItem, result: FilterResult): void => {
  if (result.matched !== true || !result.reason) {
    return;
  }

  if (book.container.dataset.booktidyProcessed === "true") {
    return;
  }

  book.container.classList.add("booktidy-original-hidden");
  book.container.dataset.booktidyProcessed = "true";

  const collapsed = document.createElement("div");
  collapsed.className = "booktidy-collapsed";
  collapsed.dataset.booktidyState = "collapsed";

  const marker = document.createElement("div");
  marker.className = "booktidy-collapsed__marker";
  marker.setAttribute("aria-hidden", "true");

  const markerIcon = document.createElement("img");
  markerIcon.className = "booktidy-collapsed__marker-icon";
  markerIcon.src = browser.runtime.getURL("booktidy-icon.svg");
  markerIcon.alt = "";
  marker.append(markerIcon);

  const content = document.createElement("div");
  content.className = "booktidy-collapsed__content";

  const title = document.createElement("div");
  title.className = "booktidy-collapsed__title";
  title.textContent = "BookTidy에 의해 접힘";

  const reason = document.createElement("div");
  reason.className = "booktidy-collapsed__reason";
  reason.textContent = `사유: ${result.reason}`;

  const button = document.createElement("button");
  button.className = "booktidy-collapsed__button";
  button.type = "button";
  button.textContent = "보기";
  button.addEventListener("click", () => {
    collapsed.remove();
    book.container.classList.remove("booktidy-original-hidden");
  });

  content.append(title, reason);
  collapsed.append(marker, content, button);
  book.container.insertAdjacentElement("afterend", collapsed);
};
