import { applyTaiwanTerminology, localizeZhTW } from '@/i18n';

describe('zh-TW 在地化', () => {
  it('使用台灣常用介面詞彙', () => {
    expect(applyTaiwanTerminology('用戶在服務器設置中保存視頻文件')).toBe(
      '使用者在伺服器設定中儲存影片檔案'
    );
  });

  it('先轉字形，再套用台灣詞彙', () => {
    const fakeOpenCC = (text: string) =>
      text
        .replace('用户', '用戶')
        .replace('服务器', '服務器')
        .replace('视频', '視頻');
    expect(localizeZhTW('用户视频服务器', fakeOpenCC)).toBe('使用者影片伺服器');
  });
});
