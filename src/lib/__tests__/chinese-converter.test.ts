import {
  appendSourceQuery,
  loadTraditionalToSimplifiedConverter,
  normalizeSearchQuery,
  toSimplifiedSearchQuery,
} from '@/lib/chinese-converter';

describe('台灣版搜尋詞處理', () => {
  it('保留整理後的繁體顯示詞並產生簡體來源詞', () => {
    const fakeConverter = (text: string) =>
      text.replace('進擊的巨人', '进击的巨人');

    expect(normalizeSearchQuery('  進擊的   巨人  ')).toBe('進擊的 巨人');
    expect(toSimplifiedSearchQuery('進擊的巨人', fakeConverter)).toBe(
      '进击的巨人'
    );
  });

  it('只有繁簡不同時才加入 sourceQ', () => {
    const base = '/api/search?q=%E9%80%B2%E6%93%8A%E7%9A%84%E5%B7%A8%E4%BA%BA';
    expect(appendSourceQuery(base, '進擊的巨人', '进击的巨人')).toContain(
      'sourceQ='
    );
    expect(appendSourceQuery(base, 'SPY×FAMILY', 'SPY×FAMILY')).toBe(base);
  });

  it('OpenCC 可將台灣繁體片名轉成來源用簡體', async () => {
    const converter = await loadTraditionalToSimplifiedConverter();
    expect(toSimplifiedSearchQuery('葬送的芙莉蓮', converter)).toBe(
      '葬送的芙莉莲'
    );
  });
});
