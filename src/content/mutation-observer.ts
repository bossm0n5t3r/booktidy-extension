export const DEFAULT_DEBOUNCE_MS = 100;

export const observeBookMutations = (
  target: Node,
  onChange: () => void,
  debounceMs = DEFAULT_DEBOUNCE_MS,
): MutationObserver => {
  let timer: number | undefined;

  const observer = new MutationObserver((mutations) => {
    const hasAddedNodes = mutations.some((mutation) => mutation.addedNodes.length > 0);

    if (!hasAddedNodes) {
      return;
    }

    if (timer !== undefined) {
      window.clearTimeout(timer);
    }

    timer = window.setTimeout(onChange, debounceMs);
  });

  observer.observe(target, { childList: true, subtree: true });

  return observer;
};
