import { act, fireEvent, render, screen } from '@testing-library/react';
import { Converter } from 'opencc-js';
import React, { useState } from 'react';

import { loadSimplifiedToTraditionalConverter } from '@/lib/chinese-converter';

import { TaiwanLocaleProvider } from '@/components/TaiwanLocaleProvider';

jest.mock('@/lib/chinese-converter', () => ({
  loadSimplifiedToTraditionalConverter: jest.fn(),
}));

const settle = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

function ProxySettings() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {open && (
        <p title='图片域名'>
          图片域名。只需填写基础部分，不需要填写完整图片路径。
        </p>
      )}
    </>
  );
}

it('代理設定可反覆展開收合，翻譯完成後不再觸發轉換', async () => {
  const convert = jest.fn(Converter({ from: 'cn', to: 'tw' }));
  (loadSimplifiedToTraditionalConverter as jest.Mock).mockResolvedValue(
    convert
  );
  const { unmount } = render(
    <TaiwanLocaleProvider>
      <ProxySettings />
    </TaiwanLocaleProvider>
  );
  await settle();
  for (let i = 0; i < 3; i++) {
    fireEvent.click(screen.getByText('Toggle'));
    await settle();
    expect(screen.getByTitle('圖片網域名稱')).toHaveTextContent(
      '圖片網域名稱。只需填寫基礎部分，不需要填寫完整圖片路徑。'
    );
    const calls = convert.mock.calls.length;
    await settle();
    expect(convert).toHaveBeenCalledTimes(calls);
    fireEvent.click(screen.getByText('Toggle'));
    await settle();
    expect(screen.queryByTitle('圖片網域名稱')).toBeNull();
  }
  unmount();
});

it('即使轉換器輸出不穩定，也不會觀察自己的修改形成迴圈', async () => {
  // Cap a broken implementation so this regression test fails without hanging Jest.
  const convert = jest.fn((text: string): string =>
    convert.mock.calls.length < 20 ? `${text}！` : text
  );
  (loadSimplifiedToTraditionalConverter as jest.Mock).mockResolvedValue(
    convert
  );
  const { unmount } = render(
    <TaiwanLocaleProvider>
      <ProxySettings />
    </TaiwanLocaleProvider>
  );
  await settle();
  fireEvent.click(screen.getByText('Toggle'));
  await settle();
  expect(convert.mock.calls.length).toBeLessThan(5);
  const calls = convert.mock.calls.length;
  await settle();
  expect(convert).toHaveBeenCalledTimes(calls);
  unmount();
});
