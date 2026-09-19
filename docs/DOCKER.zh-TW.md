# MoonTVPlus-TW Docker 部署與升級

正式映像：`ghcr.io/dianaotou/moontvplus-tw`

目前沿用 upstream MoonTVPlus 的完整 `Dockerfile`、啟動方式與資料介面。容器監聽 `3000`，預設 SQLite 檔案為 `/app/.data/moontv.db`，離線下載目錄為 `/data`。切換到 TW 映像時，請保留原本的 port、環境變數與 volume 對應。

## Docker Compose

以下是使用 SQLite 的最小範例。正式環境請替換帳號密碼，並建議固定版本。

```yaml
services:
  moontvplus-tw:
    image: ghcr.io/dianaotou/moontvplus-tw:1.0.0-phase1
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
  ghcr.io/dianaotou/moontvplus-tw:1.0.0-phase1
```

## 從 upstream MoonTVPlus 切換到 TW

1. 記錄目前使用的 image tag、port、所有環境變數與 volume 對應。
2. 停止服務，備份資料庫與設定。SQLite 請備份整個掛載到 `/app/.data` 的目錄；Redis／Kvrocks／Postgres／Turso／Upstash 請使用該資料庫的原生備份或快照方式。
3. 僅將 image 改為 `ghcr.io/dianaotou/moontvplus-tw:<版本>`，其餘設定先保持不變。
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
image: ghcr.io/dianaotou/moontvplus-tw:1.0.0-phase1
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
image: ghcr.io/dianaotou/moontvplus-tw:latest
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

## 正式發布規則

普通 commit 與 pull request 只執行 CI 和 Docker build 驗證，不會發布映像。正式發布由 `moontvplus-tw` 分支上的受限制 Git tag 觸發：

- `package.json` 版本例如為 `1.0.0-phase1`。
- 發布 tag 必須為 `tw-v1.0.0-phase1`。
- workflow 會驗證 tag commit 屬於 `moontvplus-tw`，且 tag 與 `package.json` 版本一致。
- 成功後發布 `ghcr.io/dianaotou/moontvplus-tw:1.0.0-phase1` 和 `ghcr.io/dianaotou/moontvplus-tw:latest`，支援 `linux/amd64` 與 `linux/arm64`。
- 若既有版本因暫時性錯誤發布失敗，可在 Actions 頁面手動執行相同 workflow，輸入與 `package.json` 相同的版本。手動重試只允許從目前 `moontvplus-tw` HEAD 發布，不會繞過分支及版本檢查。

維護者發布指令：

```bash
git switch moontvplus-tw
git pull --ff-only origin moontvplus-tw
git tag -a tw-v1.0.0-phase1 -m 'MoonTVPlus-TW 1.0.0-phase1'
git push origin tw-v1.0.0-phase1
```

GitHub Actions 使用內建 `GITHUB_TOKEN` 與 `contents: read`、`packages: write` 最小權限，不需要 Repository secret 或私人 Token。首次發布後，若 GHCR package 預設不是公開可見，請在 GitHub package 設定中將 visibility 設為 Public。
