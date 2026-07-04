type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    finished: Promise<void>;
  };
};

export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

export function startViewTransition(callback: () => void | Promise<void>): void {
  const doc = document as ViewTransitionDocument;
  if (doc.startViewTransition) {
    doc.startViewTransition(callback);
  } else {
    void callback();
  }
}

export function viewTransitionNavigate(
  router: { push: (href: string) => void; refresh: () => void },
  href: string,
  options?: { refresh?: boolean }
): void {
  startViewTransition(() => {
    router.push(href);
    if (options?.refresh) router.refresh();
  });
}

export function isModifiedClick(event: MouseEvent): boolean {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

export function isInternalLink(anchor: HTMLAnchorElement): boolean {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}
