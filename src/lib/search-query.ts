export type SearchTerms = {
  displayQuery: string;
  sourceQuery: string;
};

const MAX_QUERY_LENGTH = 200;

function cleanQuery(value: string | null): string {
  return (value || '').trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH);
}

/**
 * q 保留使用者實際輸入；sourceQ 只供外部影片來源與來源腳本查詢。
 * 私人媒體庫使用 q，避免將台灣片名不必要地改成簡體。
 */
export function getSearchTerms(searchParams: URLSearchParams): SearchTerms {
  const displayQuery = cleanQuery(searchParams.get('q'));
  const sourceQuery = cleanQuery(searchParams.get('sourceQ')) || displayQuery;
  return { displayQuery, sourceQuery };
}

export function isExactSearchTitle(
  title: string,
  { displayQuery, sourceQuery }: SearchTerms
): boolean {
  return title === displayQuery || title === sourceQuery;
}
