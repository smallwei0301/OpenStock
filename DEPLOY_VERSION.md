# Deployment Version

- Version Code: `netlify-ready-v20250216`
- Description: Initial Netlify deployment configuration, including build pipeline tweaks and documentation for one-click deploy.
- Date: 2025-02-16


- Version Code: `netlify-ready-v20250217`
- Description: Gracefully handle missing authentication environment variables during build to unblock Netlify deploy previews.
- Date: 2025-02-17

- Version Code: `netlify-ready-v20250218`
- Description: 將整個網站介面與電子郵件內容調整為繁體中文，並更新 TradingView 元件語系以符合台灣用戶期待。
- Date: 2025-02-18

- Version Code: `netlify-ready-v20250219`
- Description: 補齊股票搜尋、自選清單與即時行情功能，確保與開源專案一致並支援 Netlify 無資料庫／無 API 金鑰情境。
- Date: 2025-02-19

- Version Code: `netlify-ready-v20250220`
- Description: 強化搜尋體驗與導覽層，加入桌面與行動版完整搜尋頁連結、指令面板與手機選單，確保所有開源功能在前端可視可用。
- Date: 2025-02-20

- Version Code: `netlify-ready-v20250221`
- Description: 修正 Finnhub API 金鑰偵測邏輯並於伺服器／客戶端搜尋流程中即時反應設定狀態，確保已配置金鑰的 Netlify 部署能啟用所有市場資料功能。
- Date: 2025-02-21

- Version Code: `netlify-ready-v20250222`
- Description: 將 Finnhub 設定檢查改寫為非同步 Server Action 並更新相關頁面呼叫方式，確保 Netlify 建置流程符合 Next.js 規範。
- Date: 2025-02-22

- Version Code: `LBT-20250222-03`
- Description: 將台股即時報價改用 Fugle Realtime API，並保留證交所資料作為備援，同步補充環境變數與文件說明。
- Date: 2025-02-22

- Version Code: `LBT-20250223-02`
- Description: 以日 K 蠟燭資料補齊台股即時報價缺漏的開高低收與昨收欄位，避免介面只顯示破折號。
- Date: 2025-02-23

- Version Code: `LBT-20250224-01`
- Description: 強化台股即時報價的數值解析邏輯，支援證交所以破折號或全形字符標示的佔位符，避免開高低收顯示為破折號。
- Date: 2025-02-24

- Version Code: `LBT-20250224-02`
- Description: 改善 Fugle 回應解析流程，優先採用成交價與交易時間並補齊多種欄位名稱，確保台股即時報價與最後更新時間維持最新狀態。
- Date: 2025-02-24

