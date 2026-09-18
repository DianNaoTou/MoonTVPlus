import { getSearchTerms, isExactSearchTitle } from '@/lib/search-query';

describe('搜尋 API 查詢分流', () => {
  it('分開保留顯示詞與外部來源詞', () => {
    const params = new URLSearchParams({
      q: '葬送的芙莉蓮',
      sourceQ: '葬送的芙莉莲',
    });
    expect(getSearchTerms(params)).toEqual({
      displayQuery: '葬送的芙莉蓮',
      sourceQuery: '葬送的芙莉莲',
    });
  });

  it('舊用戶端沒有 sourceQ 時退回 q', () => {
    const params = new URLSearchParams({ q: '繁花' });
    expect(getSearchTerms(params).sourceQuery).toBe('繁花');
  });

  it('精確搜尋可接受來源回傳繁體或簡體標題', () => {
    const terms = {
      displayQuery: '葬送的芙莉蓮',
      sourceQuery: '葬送的芙莉莲',
    };
    expect(isExactSearchTitle('葬送的芙莉蓮', terms)).toBe(true);
    expect(isExactSearchTitle('葬送的芙莉莲', terms)).toBe(true);
  });
});
