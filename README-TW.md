# MoonTVPlus-TW

MoonTVPlus-TW 是以 [DianNaoTou/MoonTVPlus](https://github.com/DianNaoTou/MoonTVPlus) 為基礎的台灣繁體中文在地化版本。

目前版本：`1.0.0-phase1`

上游基準：MoonTVPlus `225.1.0`，commit `e3d15dcf33518467e1a35936d410740c72e196b2`

## 第一階段內容

- 使用 `zh-TW` 語系與台灣常用詞彙顯示既有介面。
- 保留使用者輸入的繁體片名，對外部影片來源自動另外產生簡體搜尋詞。
- 私人影音庫（OpenList／Emby）維持使用繁體原文搜尋。
- TMDB 改用 `zh-TW` 資料，日期與時間採台灣語系格式。
- 保留原專案功能、介面、作者資訊與授權條款。

完整架構、盤點方式與上游同步注意事項請見 [docs/LOCALIZATION.zh-TW.md](docs/LOCALIZATION.zh-TW.md)，版本異動請見 [CHANGELOG-TW.md](CHANGELOG-TW.md)。原專案部署說明請見 [README.md](README.md)。

## Docker 正式映像

正式映像為 `ghcr.io/diannaotou/moontvplus-tw`，提供 `latest` 與可供固定版本、rollback 使用的明確版本 tag。Docker Compose、`docker run`、從 upstream 切換、更新、備份與 rollback 請見 [Docker 部署與升級指南](docs/DOCKER.zh-TW.md)。

## 授權與來源

本分支未移除或取代原作者資訊。程式碼沿用原專案的 [LICENSE](LICENSE)；使用與散布時仍須遵守原授權條款。
