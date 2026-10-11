import { Converter } from 'opencc-js';

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

describe('代理設定文字重複在地化', () => {
  const converter = Converter({ from: 'cn', to: 'tw' });

  it.each([
    [
      '图片域名。只需填写基础部分，不需要填写完整图片路径。',
      '圖片網域名稱。只需填寫基礎部分，不需要填寫完整圖片路徑。',
    ],
    ['自定义代理服务器地址', '自訂代理伺服器地址'],
    ['網域名稱', '網域名稱'],
    ['优选偏好', '優先選擇偏好'],
    ['手动矫正标题', '手動校正標題'],
    ['倍数同步', '播放倍速同步'],
  ])('重複處理 %s 不會增長或改變文字', (source, expected) => {
    let result = localizeZhTW(source, converter);
    expect(result).toBe(expected);
    for (let i = 0; i < 20; i++) {
      result = localizeZhTW(result, converter);
      expect(result).toBe(expected);
    }
  });
});
