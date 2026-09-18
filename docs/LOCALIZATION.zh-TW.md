# MoonTVPlus-TW 在地化架構與第一階段盤點

## 基準與原則

- 上游：`DianNaoTou/MoonTVPlus`
- 基準 commit：`e3d15dcf33518467e1a35936d410740c72e196b2`
- 正式維護分支：`moontvplus-tw`
- 原則：不改核心播放流程、版面設計、資料結構與部署介面；新增內容集中於語系及搜尋查詢邊界。

## 盤點結果

上游沒有正式 i18n。使用者可見文字主要散落於 `src/app/**/*.tsx` 與 `src/components/**/*.tsx`。基準版本共找出 **118 個檔案、3,455 行**含中國用語候選字串；其中管理頁、播放頁、使用者選單、直播、音樂、詳情與搜尋頁是高密度區域。`pnpm audit:i18n` 可重跑盤點；候選清單也會包含註解及不可直接翻譯的邏輯值，因此不可機械式整批取代。

另有三類地區設定：

1. HTML `lang` 與中繼資料。
2. `toLocale*`／`Intl.DateTimeFormat` 的 `zh-CN`。
3. TMDB API 的 `language=zh-CN`。

第一階段已將上述使用者可見地區設定調整為 `zh-TW`；第三方服務為相容性所需的請求標頭、裝置識別字串與中文語音代碼不強制更動。

## i18n 架構

- `src/i18n/zh-TW.ts`：語系定義、OpenCC 字形轉換後的台灣用語詞彙表。
- `src/components/TaiwanLocaleProvider.tsx`：舊介面相容層，處理文字節點及 `placeholder`、`title`、`alt`、`aria-label`。
- `src/lib/chinese-converter.ts`：唯一的 OpenCC 載入與繁簡轉換層；採動態載入，不增加全站初始 JS bundle。
- `useI18n().t()`：新功能與後續逐元件遷移入口。
- `data-i18n-skip`：精確字串、程式碼或不應在地化的內容可明確略過。

相容層讓第一階段不必修改數百個核心元件。後續同步上游時，新增介面可直接沿用相容層；有空再按高使用率頁面逐步改成 `t()`，不需要一次完成大規模重構。

## 搜尋流程

```text
使用者繁體輸入 ── q ───────────▶ OpenList／Emby／畫面與歷史紀錄
              └─ sourceQ(簡體) ─▶ 外部影片 API／來源腳本
```

- `q` 永遠保留使用者輸入，不再把網址及搜尋框改成簡體。
- `src/lib/search-query.client.ts` 是用戶端來源搜尋詞與啟用設定的單一入口；頁面只在繁簡標題聚合／比對時直接取得共用轉換器。
- `src/lib/search-query.ts` 統一在伺服器端解析 `q`／`sourceQ`，搜尋 API 路由只保留少量參數接線。
- `sourceQ` 在瀏覽器端以既有 `opencc-js` 延遲產生，避免將大型字典打入 Cloudflare 伺服器端 bundle 或全站初始載入。
- 沒有 `sourceQ` 的舊用戶端仍可正常呼叫 API，伺服器會退回使用 `q`。
- 精確搜尋同時比對 `q` 與 `sourceQ`，避免簡體來源結果被錯誤過濾。
- 設定可關閉，但 MoonTVPlus-TW 預設啟用。

## 上游同步

建議先將上游更新合併到獨立同步分支，再合併本分支。最常需要檢查的衝突點只有：

- `src/app/layout.tsx`
- `src/app/search/page.tsx`
- `src/app/api/search/route.ts`
- `src/app/api/search/ws/route.ts`
- `src/components/UserMenu.tsx`

不要把自動盤點結果直接當成可取代清單；API 協定值、內容分類值與第三方裝置識別可能必須維持簡體原值。

## 驗證指令

- `pnpm typecheck`
- `pnpm lint:tw`（只檢查本分支新增及直接修改的搜尋／語系範圍）
- `pnpm test --runInBand`
- `pnpm build`

上游目前仍有多個與本分支無關的既存 ESLint error，因此全專案 `pnpm lint` 不是可通過的基準；TW CI 會完整執行 type check、測試及 Build，並對本次變更範圍執行 lint。
