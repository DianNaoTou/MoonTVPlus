/* 繁简转换 —— 独立客户端模块。
 *
 * 服务端 bundle 不应包含 opencc-js（其字典约 1.9MB，会撑爆 Cloudflare Worker）。
 * opencc-js 只在客户端加载（本文件 + search 页面复用），服务端打包 danmaku/api.ts
 * 或 search 路由时不应把本文件的 opencc-js 动态 import 内联进 worker。
 */

import type { ChineseConverter as OpenCCConverter } from '@/lib/chinese-converter';
import { loadTraditionalToSimplifiedConverter } from '@/lib/chinese-converter';

let danmakuConverter: OpenCCConverter | null = null;
let danmakuConverterPromise: Promise<OpenCCConverter | null> | null = null;

/**
 * 載入繁簡轉換器（from: tw → to: cn）。同一程序只載入一次。
 * 仅客户端可调用；服务端（SSR）下 window 未定义时由调用方自行保护。
 */
function loadDanmakuConverter(): Promise<OpenCCConverter | null> {
  if (danmakuConverter) return Promise.resolve(danmakuConverter);
  if (!danmakuConverterPromise) {
    danmakuConverterPromise = loadTraditionalToSimplifiedConverter()
      .then((converter) => {
        danmakuConverter = converter;
        return converter;
      })
      .catch((error) => {
        console.error('初始化繁简转换器失败:', error);
        danmakuConverter = null;
        return null;
      });
  }
  return danmakuConverterPromise;
}

// 客户端加载时预热转换器（服务端 SSR 时 window 未定义，无副作用）
if (typeof window !== 'undefined') {
  void loadDanmakuConverter();
}

export function convertDanmakuText(text: string): string {
  if (
    typeof window === 'undefined' ||
    localStorage.getItem('danmakuTraditionalToSimplified') !== 'true'
  ) {
    return text;
  }

  // 转换器尚未就绪时原样返回（预热后通常已加载完成）
  if (!danmakuConverter) return text;

  try {
    return danmakuConverter(text);
  } catch (error) {
    console.error('弹幕繁简转换失败:', error);
    return text;
  }
}
