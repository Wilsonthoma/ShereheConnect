'use client';

import { useEffect } from 'react';

function applyMixedFonts(root: HTMLHeadingElement) {
  if (root.querySelector('[data-mixed-word="true"]')) return;

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
}

export function MixedHeadings() {
  useEffect(() => {
    const processAll = () => {
      document.querySelectorAll<HTMLHeadingElement>('h1').forEach(applyMixedFonts);
    };

    processAll();

    const observer = new MutationObserver(() => {
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
