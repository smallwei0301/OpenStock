import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OpenStock 服務條款',
  description: '以信任、透明與社群價值為基礎的使用條款，保障每位使用者與創作者。',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">服務條款</h1>
        <p className="text-gray-300 mb-4">最後更新日期：2025 年 10 月 4 日</p>
        <div className="bg-green-900 border border-green-700 rounded-lg p-4">
          <p className="text-green-200 text-sm">
            🤝 <strong>白話條款：</strong>我們避免艱澀法律語言，條款內容以公平、透明並符合 Open Dev Society 的價值為核心。
          </p>
        </div>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">🌟 我們看待條款的方式</h2>
          <p className="text-gray-200 mb-4">
            條款的目的應該是保護使用者與創作者，而非設下陷阱。以下原則貫徹 Open Dev Society 的精神：開放、公平、以社群為先。
          </p>
          <ul className="text-gray-200 space-y-2">
            <li>✅ <strong>沒有陷阱：</strong>內容如實呈現，不搞暗樁</li>
            <li>✅ <strong>社群共同檢視：</strong>條款草案曾與社群夥伴討論</li>
            <li>✅ <strong>合理使用：</strong>設下對所有人都有利的界線</li>
            <li>✅ <strong>核心功能永久免費：</strong>我們承諾永遠維持免費使用</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">🎯 使用基本原則</h2>
          <p className="text-gray-200 mb-4">使用 OpenStock 代表你加入了我們的社群，這也意味著：</p>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <ul className="text-gray-200 space-y-3">
              <li>💙 <strong>善意使用：</strong>用於學習、打造作品與自我成長，而非傷害他人</li>
              <li>🎓 <strong>教育導向：</strong>很適合學生、個人專案與自學者</li>
              <li>🤝 <strong>社群精神：</strong>有能力時伸出援手，需要幫助時放心提問</li>
              <li>🔓 <strong>開源價值：</strong>若有可能請回饋、分享與共創</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">💰 永遠免費的承諾</h2>
          <div className="bg-green-900 border border-green-700 rounded-lg p-6">
            <p className="text-green-200 font-medium mb-3">以下核心功能將長期免費提供：</p>
            <ul className="text-gray-200 space-y-2">
              <li>✅ 即時股價與圖表</li>
              <li>✅ 自選追蹤與投資組合管理</li>
              <li>✅ 基礎市場分析工具</li>
              <li>✅ 社群互動與討論空間</li>
              <li>✅ 個人專案可使用的 API 權限</li>
            </ul>
            <p className="text-gray-300 text-sm mt-4 italic">
              這不是所謂的「免費陷阱」，而是我們讓金融工具普及化的承諾。
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">🛡️ 投資風險聲明</h2>
          <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6">
            <p className="text-yellow-200 font-medium mb-2">請務必留意以下重點：</p>
            <div className="text-gray-200 space-y-3">
              <p>
                <strong>OpenStock 是教育與分析工具，並非投資建議。</strong>
                我們提供資料與工具協助你做出判斷，最終決策仍由你自行負責。
              </p>
              <p>
                <strong>我們不是財務顧問。</strong>我們是一群開發者與社群夥伴，打造出自己學習投資時希望擁有的工具。
              </p>
              <p>
                <strong>請自行評估風險。</strong>善用多元資訊來源、諮詢專業人士，並確保投資金額在可承受範圍內。
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">👥 帳號與使用者責任</h2>
          <p className="text-gray-200 mb-4">我們相信你會成為好的社群成員，也期待大家遵守以下原則：</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-200 mb-2">✨ 我們期待的行動</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• 與其他使用者分享經驗與知識</li>
                <li>• 回報問題並提出改進建議</li>
                <li>• 隨時更新自己的帳號資訊</li>
                <li>• 把平台當成練習與成長的夥伴</li>
              </ul>
            </div>
            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">❌ 會傷害社群的行為</h3>
              <ul className="text-red-200 text-sm space-y-1">
                <li>• 分享帳號或 API 金鑰</li>
                <li>• 嘗試破壞或入侵系統</li>
                <li>• 騷擾其他社群成員</li>
                <li>• 將平台用於違法或不當用途</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">📊 資料與內容</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-200 mb-4">
              <strong>你的資料屬於你。</strong>我們提供匯出工具，並不會主張擁有你的自選清單、筆記或個人資訊。
            </p>
            <p className="text-gray-200 mb-4">
              <strong>市場資料來自有授權的來源。</strong>雖然我們免費提供，但用途以個人研究與學習為限，請尊重原始授權規範。
            </p>
            <p className="text-gray-200">
              <strong>感謝每一位社群貢獻者。</strong>當你分享心得或參與討論，就在幫助我們共同打造知識共享的環境。
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">🔧 服務可用性</h2>
          <p className="text-gray-200 mb-4">我們致力於維持服務穩定，但也希望坦白說明：</p>
          <ul className="text-gray-200 space-y-2 ml-6">
            <li>• 目標為 99.9% 上線率，但偶爾仍可能發生意外狀況</li>
            <li>• 若有計畫性維護會提前公告</li>
            <li>• 重大中斷會透過狀態頁面與 Discord 通知</li>
            <li>• 我們投資長期可維運的基礎建設，而非最低成本的權宜方案</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">🔄 條款更新方式</h2>
          <div className="bg-purple-900 border border-purple-700 rounded-lg p-6">
            <p className="text-purple-200 mb-3">
              <strong>我們同樣以透明原則處理條款更新：</strong>
            </p>
            <ul className="text-gray-200 space-y-2">
              <li>• 重大調整前會先與社群討論</li>
              <li>• 清楚說明調整內容與原因</li>
              <li>• GitHub 上會保留版本歷史</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">🤔 有問題嗎？</h2>
          <p className="text-gray-200 mb-4">
            條款不應該難以理解。如果你對任何內容感到疑惑或覺得不夠公平，請和我們聊聊。
          </p>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-200 mb-2">
              <strong>法律相關問題：</strong>{' '}
              <a href="mailto:legal@opendevsociety.org" className="text-blue-400 hover:text-blue-300">
                legal@opendevsociety.org
              </a>
            </p>
            <p className="text-gray-200">
              <strong>一般交流：</strong> 歡迎加入 Discord 的 #community 頻道
            </p>
          </div>
        </section>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-100 mb-3">Open Dev Society 的信念</h3>
          <p className="text-gray-200 mb-2">
            「我們打造讓人們賦能的工具、提供人人可得的知識，並培養彼此成長的社群。」
          </p>
          <p className="text-gray-300 text-sm">
            這份條款正是這些價值的延伸。謝謝你成為社群的一份子。🚀
          </p>
        </div>
      </div>
    </div>
  );
}
