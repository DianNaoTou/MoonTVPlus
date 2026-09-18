'use client';

import {
  type ChineseConverter,
  appendSourceQuery,
  loadTraditionalToSimplifiedConverter,
  normalizeSearchQuery,
  toSimplifiedSearchQuery,
} from '@/lib/chinese-converter';

export function isSourceQueryConversionEnabled(): boolean {
  return (
    typeof window === 'undefined' ||
    localStorage.getItem('searchTraditionalToSimplified') !== 'false'
  );
}

export function resolveSourceSearchQuery(
  query: string,
  converter: ChineseConverter | null
): string {
  const displayQuery = normalizeSearchQuery(query);
  return isSourceQueryConversionEnabled()
    ? toSimplifiedSearchQuery(displayQuery, converter)
    : displayQuery;
}

/** 建立台灣版搜尋網址：q 保留繁體原文，sourceQ 提供外部來源使用。 */
export async function buildSearchApiUrl(
  path: string,
  query: string
): Promise<string> {
  const displayQuery = normalizeSearchQuery(query);
  const separator = path.includes('?') ? '&' : '?';
  let url = `${path}${separator}q=${encodeURIComponent(displayQuery)}`;

  const sourceQuery = await getSourceSearchQuery(displayQuery);
  url = appendSourceQuery(url, displayQuery, sourceQuery);
  return url;
}

/** 單一入口管理外部來源繁轉簡設定；私人影音庫不應呼叫此函式。 */
export async function getSourceSearchQuery(query: string): Promise<string> {
  const displayQuery = normalizeSearchQuery(query);

  if (!isSourceQueryConversionEnabled()) {
    return displayQuery;
  }

  const converter = await loadTraditionalToSimplifiedConverter();
  return resolveSourceSearchQuery(displayQuery, converter);
}
