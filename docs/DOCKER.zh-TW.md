# MoonTVPlus-TW Docker 部署與升級

正式映像：`ghcr.io/diannaotou/moontvplus-tw`

目前沿用 upstream MoonTVPlus 的完整 `Dockerfile`、啟動方式與資料介面。容器監聽 `3000`，預設 SQLite 檔案為 `/app/.data/moontv.db`，離線下載目錄為 `/data`。切換到 TW 映像時，請保留原本的 port、環境變數與 volume 對應。

## Docker Compose

以下是使用 SQLite 的最小範例。正式環境請替換帳號密碼，並建議固定版本。

```yaml
services:
  moontvplus-tw:
    image: ghcr.io/diannaotou/moontvplus-tw:1.1.0-tw.1
    container_name: moontvplus-tw
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      USERNAME: admin
      PASSWORD: change-me
      NEXT_PUBLIC_STORAGE_TYPE: d1
      SQLITE_DB_PATH: /app/.data/moontv.db
      PUID: '1001'
      PGID: '1001'
    volumes:
      - ./data:/app/.data
      - ./downloads:/data
```

啟動：

```bash
docker compose up -d
docker compose logs -f moontvplus-tw
```

若使用 Kvrocks、Redis、Upstash、Postgres 或 Turso，請沿用原部署的 `NEXT_PUBLIC_STORAGE_TYPE` 和相對應連線環境變數；不要在切換映像時同時更換資料後端。

## docker run

```bash
docker run -d \
  --name moontvplus-tw \
  --restart unless-stopped \
  -p 3000:3000 \
  -e USERNAME=admin \
  -e PASSWORD=change-me \
  -e NEXT_PUBLIC_STORAGE_TYPE=d1 \
  -e SQLITE_DB_PATH=/app/.data/moontv.db \
  -e PUID=1001 \
  -e PGID=1001 \
  -v "$PWD/data:/app/.data" \
  -v "$PWD/downloads:/data" \
  ghcr.io/diannaotou/moontvplus-tw:1.1.0-tw.1
```

## 從 upstream MoonTVPlus 切換到 TW

1. 記錄目前使用的 image tag、port、所有環境變數與 volume 對應。
2. 停止服務，備份資料庫與設定。SQLite 請備份整個掛載到 `/app/.data` 的目錄；Redis／Kvrocks／Postgres／Turso／Upstash 請使用該資料庫的原生備份或快照方式。
3. 僅將 image 改為 `ghcr.io/diannaotou/moontvplus-tw:<版本>`，其餘設定先保持不變。
4. 拉取映像並啟動，檢查 logs、登入、設定、收藏與播放紀錄。

```bash
docker compose pull
docker compose up -d
docker compose logs --tail=200 moontvplus-tw
```

完整映像沿用 upstream 的資料介面與 migrations。SQLite 模式在啟動時會依 `schema_migrations` 自動執行尚未套用的 migration。migration 通常不可逆，因此更新前備份是必要步驟；切換映像不等於自動降級資料庫。

不要把新的空目錄掛載到 `/app/.data` 後期待容器找到舊資料，也不要同時更改 `NEXT_PUBLIC_STORAGE_TYPE`。若宿主機目錄權限不同，可設定 `PUID`／`PGID` 為該目錄擁有者的 UID／GID。

## 更新與固定版本

正式部署建議固定版本，例如：

```yaml
image: ghcr.io/diannaotou/moontvplus-tw:1.1.0-tw.1
```

更新流程：

```bash
# 先完成資料備份，再修改 compose 內的版本
docker compose pull
docker compose up -d
docker compose logs --tail=200 moontvplus-tw
```

`latest` 會指向最近一次正式發布，適合測試或希望主動追蹤新版本的環境：

```yaml
image: ghcr.io/diannaotou/moontvplus-tw:latest
```

舊的明確版本 tag 會保留，以便回復容器程式版本。

## Rollback

1. 停止服務。
2. 將 image tag 改回先前版本。
3. 若新版本已執行 migration，先還原更新前的資料庫備份；只回退 image 而不回退資料，可能造成 schema 不相容。
4. 重新拉取並啟動，確認 logs 與資料。

```bash
docker compose down
# 修改 compose 的 image tag，必要時還原資料備份
docker compose pull
docker compose up -d
```

## 滾動更新與版本紀錄

推送至 `moontvplus-tw` 後，Actions 先驗證型別、繁中相關 lint 與測試，再分別建置 `linux/amd64` 和 `linux/arm64`。兩個架構均建置成功後，才發布多架構映像及更新 `latest`。每次發布前需更新 `package.json`、`TW_VERSION.txt` 及 `src/lib/version.ts` 的 TW 版本。

本次繁中版本為 `1.1.0-tw.1`，上游基準為 `226.1.0`（`c7c5a3648025b24c5d7c0c13eaef148cf8b29b48`）。

- 舊版快照：`v1.0.1-phase1` 指向 `e84f8d430f943c75e243e2f52929adc4d60e5ed0`。
- 新版 Tag：`v1.1.0-tw.1`，Actions 保留標籤且不覆寫既有標籤。
- 映像標籤：`:1.1.0-tw.1`、`:v1.1.0-tw.1`、`:latest`。
- 不建立 GitHub Release，也不區分測試／正式分支。
- 手動重試仍可透過 Actions 的 workflow_dispatch，輸入與 package.json 一致的版本。

Dockerfile 固定 `pnpm@10.14.0`，與 CI 和 packageManager 一致，並在依賴安裝時帶入 pnpm-workspace.yaml 的原生套件建置設定，避免 pnpm 最新版的政策差異導致 SQLite 安裝或建置失敗。

GitHub Actions 使用內建 `GITHUB_TOKEN`：`packages: write` 用於發布映像，`contents: write` 用於保留 Git Tag，不需私人 Token。既有 GHCR 套件沿用原權限；是否可匿名拉取須以實際驗證結果為準。

上游已移除獨立觀影室伺服器，改用外部服務；若原部署使用這項功能，需依上游 README 重新設定。一般容器的 port、資料 volume 與資料後端沿用原設定。此次上游同步未修改 migrations，仍建議更新前備份原資料。
