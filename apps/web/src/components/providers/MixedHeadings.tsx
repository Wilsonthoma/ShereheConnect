'use client';

import { useEffect } from 'react';

function applyMixedFonts(root: HTMLHeadingElement) {
  if (root.dataset.mixedHeading === 'true') return;

  let wordIndex = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    if (
      node.textContent &&
      parent &&
      !parent.closest('[data-mixed-word="true"]')
    ) {
      textNodes.push(node);
    }
  }

  textNodes.forEach((node) => {
    const text = node.textContent ?? '';
    const parts = text.split(/(\s+)/);
    if (!parts.some((part) => part.trim())) return;

    const fragment = document.createDocumentFragment();
    parts.forEach((part) => {
      if (!part.trim()) {
        fragment.appendChild(document.createTextNode(part));
        return;
      }

      const span = document.createElement('span');
      span.dataset.mixedWord = 'true';
      span.className =
        wordIndex % 2 === 0 ? 'heading-coddy' : 'heading-kaushan';
      span.textContent = part;
      fragment.appendChild(span);
      wordIndex += 1;
    });

    node.replaceWith(fragment);
  });

  root.dataset.mixedHeading = 'true';
}

export function MixedHeadings() {
  useEffect(() => {
    const processAll = () => {
      document.querySelectorAll<HTMLHeadingElement>('h1').forEach(applyMixedFonts);
    };

    processAll();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          const heading = (mutation.target.parentElement ?? null)?.closest('h1');
          if (heading) {
            heading.removeAttribute('data-mixed-heading');
          }
          continue;
        }

        for (const node of Array.from(mutation.addedNodes)) {
          if (
            node instanceof HTMLElement &&
            node.matches('[data-mixed-word="true"]')
          ) {
            continue;
          }

          const heading =
            node instanceof HTMLElement
              ? node.closest('h1') ?? node.querySelector('h1')
              : node.parentElement?.closest('h1');

          if (heading) {
            heading.removeAttribute('data-mixed-heading');
          }
        }
      }
      processAll();
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
