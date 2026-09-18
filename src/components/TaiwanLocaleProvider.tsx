'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { ChineseConverter } from '@/lib/chinese-converter';
import { loadSimplifiedToTraditionalConverter } from '@/lib/chinese-converter';

import { locale, localizeZhTW } from '@/i18n';

type LocaleContextValue = {
  locale: typeof locale;
  t: (text: string) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale,
  t: (text) => localizeZhTW(text),
});

const TRANSLATABLE_ATTRIBUTES = ['aria-label', 'placeholder', 'title', 'alt'];
const SKIP_SELECTOR =
  '[data-i18n-skip],script,style,code,pre,textarea,[contenteditable="true"]';

function shouldSkip(element: Element | null): boolean {
  return Boolean(element?.closest(SKIP_SELECTOR));
}

function localizeTextNode(node: Text, converter: ChineseConverter): void {
  if (shouldSkip(node.parentElement)) return;
  const current = node.nodeValue || '';
  const translated = localizeZhTW(current, converter);
  if (translated !== current) node.nodeValue = translated;
}

function localizeElement(element: Element, converter: ChineseConverter): void {
  if (shouldSkip(element)) return;

  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const translated = localizeZhTW(current, converter);
    if (translated !== current) element.setAttribute(attribute, translated);
  }
}

function localizeTree(root: Node, converter: ChineseConverter): void {
  if (root.nodeType === Node.TEXT_NODE) {
    localizeTextNode(root as Text, converter);
    return;
  }

  if (
    root.nodeType !== Node.ELEMENT_NODE &&
    root.nodeType !== Node.DOCUMENT_NODE
  ) {
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    const element = root as Element;
    if (shouldSkip(element)) return;
    localizeElement(element, converter);
  }

  const documentRef = root.ownerDocument || (root as Document);
  const walker = documentRef.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    localizeTextNode(node as Text, converter);
    node = walker.nextNode();
  }

  if ('querySelectorAll' in root) {
    (root as Element | Document)
      .querySelectorAll(
        TRANSLATABLE_ATTRIBUTES.map((name) => `[${name}]`).join(',')
      )
      .forEach((element) => localizeElement(element, converter));
  }
}

export function TaiwanLocaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [converter, setConverter] = useState<ChineseConverter | null>(null);

  useEffect(() => {
    let disposed = false;
    let observer: MutationObserver | null = null;
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    const originalPrompt = window.prompt;

    void loadSimplifiedToTraditionalConverter().then((loadedConverter) => {
      if (disposed || !loadedConverter) return;
      setConverter(() => loadedConverter);
      localizeTree(document.documentElement, loadedConverter);

      window.alert = (message) =>
        originalAlert.call(
          window,
          localizeZhTW(String(message), loadedConverter)
        );
      window.confirm = (message) =>
        originalConfirm.call(
          window,
          localizeZhTW(String(message ?? ''), loadedConverter)
        );
      window.prompt = (message, defaultValue) =>
        originalPrompt.call(
          window,
          localizeZhTW(String(message ?? ''), loadedConverter),
          defaultValue
        );

      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData') {
            localizeTree(mutation.target, loadedConverter);
          } else if (mutation.type === 'attributes') {
            localizeElement(mutation.target as Element, loadedConverter);
          } else {
            mutation.addedNodes.forEach((node) =>
              localizeTree(node, loadedConverter)
            );
          }
        }
      });
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: TRANSLATABLE_ATTRIBUTES,
      });
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      window.alert = originalAlert;
      window.confirm = originalConfirm;
      window.prompt = originalPrompt;
    };
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: (text) => localizeZhTW(text, converter),
    }),
    [converter]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  return useContext(LocaleContext);
}
