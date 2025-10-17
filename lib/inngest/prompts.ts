export const PERSONALIZED_WELCOME_EMAIL_PROMPT = `請以繁體中文產生一段高度個人化的 HTML 內容，將會插入郵件模板中的 {{intro}} 位置。

使用者輪廓資料：
{{userProfile}}

個人化需求：
1. **直接引用使用者資訊**：務必提及他們的投資目標、風險承受度、偏好產業與任何特定背景。
2. **貼近情境的語氣**：針對新手、進階投資人或退休規劃等情境使用對應語彙，並確保語句自然親切。
3. **強調專屬感**：點出平台功能如何對應該使用者的需求，讓內容看起來只為他們撰寫。

格式要求：
- 僅輸出一段純 HTML，不可使用 Markdown 或程式碼區塊。
- 使用單一段落：<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">內容</p>
- 內容必須為兩個句子，總字數介於 35 到 50 個中文字。
- 使用 <strong> 標示關鍵個人化元素（例如投資目標、偏好產業）。
- 不可出現「歡迎」等重複標題文字。
- 語氣溫暖、具鼓勵性。`;

export const NEWS_SUMMARY_EMAIL_PROMPT = `請以繁體中文為以下新聞資料生成 HTML 內容，將填入模板的 {{newsContent}}。

待總結的新聞資料：
{{newsData}}

格式與排版要求：
- 僅輸出乾淨的 HTML，不得使用 Markdown 或程式碼區塊。
- 各區塊使用以下 CSS 結構與樣式：

區塊標題：
<h3 class="mobile-news-title dark-text" style="margin: 30px 0 15px 0; font-size: 18px; font-weight: 600; color: #f8f9fa; line-height: 1.3;">標題</h3>

段落文字：
<p class="mobile-text dark-text-secondary" style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">內文</p>

股票與公司名稱：
<strong style="color: #FDD458;">股票代號</strong>
<strong style="color: #CCDADC;">公司名稱</strong>

績效符號：使用 📈（上漲）、📉（下跌）、📊（持平）。

每則新聞需包含：
1. 外框容器 <div class="dark-info-box" style="background-color: #212328; padding: 24px; margin: 20px 0; border-radius: 8px;">。
2. 文章標題 <h4 class="dark-text" style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #FFFFFF; line-height: 1.4;">。
3. 至少三個要點，使用下列列表格式：
<ul style="margin: 16px 0 20px 0; padding-left: 0; margin-left: 0; list-style: none;">
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>重點描述，語句簡潔易懂。
  </li>
</ul>
4. 「重點提醒」區塊：
<div style="background-color: #141414; border: 1px solid #374151; padding: 15px; border-radius: 6px; margin: 16px 0;">
<p class="dark-text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.4;">💡 <strong style="color: #FDD458;">重點：</strong>用日常語言解釋為何這則新聞與投資人有關。</p>
</div>
5. 「閱讀更多」連結：
<div style="margin: 20px 0 0 0;">
<a href="ARTICLE_URL" style="color: #FDD458; text-decoration: none; font-weight: 500; font-size: 14px;" target="_blank" rel="noopener noreferrer">閱讀完整內容 →</a>
</div>

段落之間需以 <div style="border-top: 1px solid #374151; margin: 32px 0 24px 0;"></div> 分隔。

內容準則：
- 以「📊 市場總覽、📈 漲幅亮點、📉 跌幅焦點、🔥 即時要聞、💼 財報摘要、🏛️ 經濟數據」等分區呈現，且每種區塊僅出現一次。
- 每則新聞需包含原始標題與實際數據，並以淺顯語句說明意義。
- 文風需具體、簡短，像在向投資新手解釋。
- 強調這些消息對一般投資人的影響，避免艱澀術語。
- 保持友善、值得信任的語氣。
- 所有輸出都需為繁體中文。

範例結構：
<h3 class="mobile-news-title dark-text" style="margin: 30px 0 15px 0; font-size: 20px; font-weight: 600; color: #f8f9fa; line-height: 1.3;">📊 市場總覽</h3>

<div class="dark-info-box" style="background-color: #212328; padding: 24px; margin: 20px 0; border-radius: 8px;">
<h4 class="dark-text" style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #FDD458; line-height: 1.4;">今日股市表現分歧</h4>
<ul style="margin: 16px 0 20px 0; padding-left: 0; margin-left: 0; list-style: none;">
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>科技股如 <strong style="color: #FDD458;">AAPL</strong> 上漲 1.2%，吸引資金流入。
  </li>
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>傳產股下跌 0.3%，顯示資金偏好成長股。
  </li>
  <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>成交量達 124 億股，顯示市場信心仍在。
  </li>
</ul>
<div style="background-color: #141414; border: 1px solid #374151; padding: 15px; border-radius: 6px; margin: 16px 0;">
<p class="dark-text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.4;">💡 <strong style="color: #FDD458;">重點：</strong>若持有科技股，今日表現相對亮眼；若想布局，成長型產業仍具動能。</p>
</div>
<div style="margin: 20px 0 0 0;">
<a href="https://example.com/article1" style="color: #FDD458; text-decoration: none; font-weight: 500; font-size: 14px;" target="_blank" rel="noopener noreferrer">閱讀完整內容 →</a>
</div>
</div>`;

export const TRADINGVIEW_SYMBOL_MAPPING_PROMPT = `你是一位熟悉全球金融市場與交易平台的專家，任務是為指定的 Finnhub 股票代碼找出正確的 TradingView 代碼。

來自 Finnhub 的股票資訊：
Symbol: {{symbol}}
Company: {{company}}
Exchange: {{exchange}}
Currency: {{currency}}
Country: {{country}}

重要規則：
1. TradingView 的代碼格式可能與 Finnhub 不同。
2. 美國股票通常只需代碼（例如：AAPL）。
3. 國際股票常需加上交易所前綴（例如：NASDAQ:AAPL、NYSE:MSFT、LSE:BARC）。
4. 不同股別可能帶有後綴。
5. ADR 或海外上市股票可能使用不同格式。

回應格式：
只允許輸出以下結構的有效 JSON：
{
  "tradingViewSymbol": "EXCHANGE:SYMBOL",
  "confidence": "high|medium|low",
  "reasoning": "簡短說明為何這個映射正確"
}

範例：
- Apple Inc. (AAPL) → {"tradingViewSymbol": "NASDAQ:AAPL", "confidence": "high", "reasoning": "Apple 在 NASDAQ 以 AAPL 交易"}
- Microsoft Corp (MSFT) → {"tradingViewSymbol": "NASDAQ:MSFT", "confidence": "high", "reasoning": "Microsoft 在 NASDAQ 以 MSFT 交易"}
- Barclays PLC (BARC.L) → {"tradingViewSymbol": "LSE:BARC", "confidence": "high", "reasoning": "Barclays 在倫敦證交所以 BARC 交易"}

務必只輸出 JSON，請勿包含其他文字。`;
