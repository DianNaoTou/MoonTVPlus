/* eslint-disable no-console */

export type ChineseConverter = (text: string) => string;

let traditionalToSimplified: ChineseConverter | null = null;
let simplifiedToTraditional: ChineseConverter | null = null;

let traditionalToSimplifiedPromise: Promise<ChineseConverter | null> | null =
  null;
let simplifiedToTraditionalPromise: Promise<ChineseConverter | null> | null =
  null;

function loadConverter(
  direction: 'tw-to-cn' | 'cn-to-tw'
): Promise<ChineseConverter | null> {
  const isTraditionalToSimplified = direction === 'tw-to-cn';
  const cached = isTraditionalToSimplified
    ? traditionalToSimplified
    : simplifiedToTraditional;

  if (cached) return Promise.resolve(cached);

  const currentPromise = isTraditionalToSimplified
    ? traditionalToSimplifiedPromise
    : simplifiedToTraditionalPromise;
  if (currentPromise) return currentPromise;

  const promise = import('opencc-js')
    .then(({ Converter }) =>
      isTraditionalToSimplified
        ? Converter({ from: 'tw', to: 'cn' })
        : Converter({ from: 'cn', to: 'tw' })
    )
    .then((converter) => {
      if (isTraditionalToSimplified) {
        traditionalToSimplified = converter;
      } else {
        simplifiedToTraditional = converter;
      }
      return converter;
    })
    .catch((error) => {
      console.error(`初始化中文轉換器失敗 (${direction}):`, error);
      return null;
    });

  if (isTraditionalToSimplified) {
    traditionalToSimplifiedPromise = promise;
  } else {
    simplifiedToTraditionalPromise = promise;
  }

  return promise;
}

export function loadTraditionalToSimplifiedConverter() {
  return loadConverter('tw-to-cn');
}

export function loadSimplifiedToTraditionalConverter() {
  return loadConverter('cn-to-tw');
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

export function toSimplifiedSearchQuery(
  query: string,
  converter: ChineseConverter | null
): string {
  const normalized = normalizeSearchQuery(query);
  if (!normalized || !converter) return normalized;

  try {
    return normalizeSearchQuery(converter(normalized));
  } catch (error) {
    console.error('搜尋詞繁體轉簡體失敗:', error);
    return normalized;
  }
}

export function appendSourceQuery(
  url: string,
  displayQuery: string,
  sourceQuery: string
): string {
  const normalizedDisplay = normalizeSearchQuery(displayQuery);
  const normalizedSource = normalizeSearchQuery(sourceQuery);
  if (!normalizedSource || normalizedSource === normalizedDisplay) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}sourceQ=${encodeURIComponent(normalizedSource)}`;
}
