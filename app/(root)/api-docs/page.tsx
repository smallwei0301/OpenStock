import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OpenStock API 文件',
  description: '完整公開的 API 整合指南，無需付費或申請即可開始使用。',
};

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-200 mb-4">免費且開放的 API 文件</h1>
        <p className="text-xl text-gray-200 mb-4">
          從零開始整合 OpenStock API 的完整指引——完全免費，而且會一直免費。
        </p>
        <div className="bg-blue-300 border border-blue-400 rounded-lg p-4">
          <p className="text-black text-sm">
            💡 <strong>Open Dev Society 的承諾：</strong>這支 API 永遠免費使用。個人專案沒有隱藏費用或流量限制，知識公開透明。
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section className="bg-gray-800 rounded-lg shadow-sm p-6 border">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">🌍 我們的 API 理念</h2>
          <p className="text-gray-200 mb-4">
            我們相信市場數據應該向所有人開放——不論你是第一次打造投資工具的學生、為社群寫程式的開發者，或單純想理解財經世界的學習者。
          </p>
          <ul className="text-gray-200 space-y-2">
            <li>✅ <strong>永遠免費：</strong>核心功能沒有到期日</li>
            <li>✅ <strong>拒絕把關：</strong>簡單的驗證流程與清楚的說明</li>
            <li>✅ <strong>社群優先：</strong>為學習者、學生與創作者打造</li>
            <li>✅ <strong>開源精神：</strong>範例程式與 SDK 完全開源</li>
          </ul>
        </section>

        <section className="bg-gray-800 rounded-lg shadow-sm p-6 border">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">🤝 社群支援</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-200 p-4 rounded-lg">
              <h3 className="font-semibold text-black mb-2">🎓 給學生</h3>
              <p className="text-gray-800 text-sm">
                為課堂專題或競賽準備嗎？寫信到 <strong>opendevsociety@cc.cc</strong>，我們提供額外資源與指導。
              </p>
            </div>
            <div className="bg-blue-300 p-4 rounded-lg">
              <h3 className="font-semibold text-black mb-2">💻 給開發者</h3>
              <p className="text-gray-800 text-sm">
                加入 Discord 社群，就能取得程式碼範例、錯誤排除協助與合作機會。
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-800 rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">🔓 開源承諾</h2>
          <p className="text-gray-200 mb-4">
            API、文件與示範程式皆為開源。如果你發現問題或想提出改進，歡迎在 GitHub 提交 Issue 或 Pull Request。
          </p>
          <div className="flex space-x-4">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/Open-Dev-Society/"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              造訪 GitHub
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
