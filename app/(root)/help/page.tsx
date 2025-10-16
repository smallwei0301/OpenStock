import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OpenStock 幫助中心',
  description: '提供免費且友善的社群支援，協助你在沒有門檻的環境下學習投資。',
};

export default function HelpPage() {
  const faqs = [
    {
      question: 'OpenStock 真的是永久免費嗎？',
      answer: '當然！我們隸屬於 Open Dev Society，不會把知識鎖在付費牆後。核心功能會一直免費，我們仰賴社群贊助，因為相信財經工具應該人人都能使用。',
    },
    {
      question: '我是學生，可以把 OpenStock 用在報告或專題嗎？',
      answer: '非常歡迎！這正是我們創建 OpenStock 的初衷。你可以用在課堂作業、自學或打造作品集。需要協助時，我們的社群很樂意指導學生，寫信至 student@opendevsociety.org 就能獲得更多支援。',
    },
    {
      question: '我要怎麼把股票加入自選？',
      answer: '進入任一股票頁面並點擊星形圖示即可，也可以透過搜尋列找到標的後直接加入。整體設計以直覺操作為優先，不需要複雜教學。',
    },
    {
      question: '我可以參與 OpenStock 的開發或貢獻嗎？',
      answer: '非常歡迎！OpenStock 是社群驅動的開源專案。前往 GitHub 查看標記為 “good first issue” 或 “help wanted” 的任務，每一份貢獻都能帶來改變。',
    },
    {
      question: '如果發現錯誤或想提出新功能該怎麼辦？',
      answer: '請務必告訴我們！你可以在 GitHub 建立 issue、加入 Discord，或寄信到 opendevsociety@gmail.com。每一次回饋都是讓平台更好的機會。',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">社群幫助中心</h1>
        <p className="text-xl text-gray-200 mb-4">
          免費的協作與陪伴，因為我們相信每位投資人都值得被支持。
        </p>
        <div className="bg-green-300 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-black text-sm">
            🤝 <strong>我們的承諾：</strong>每個提問都重要，每位新手都被歡迎，沒有排除、沒有門檻。
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-800 rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-blue-500 mb-2">一起學習</h3>
          <p className="text-gray-200 text-sm">
            每位高手都曾是新手。社群撰寫的教學文章以白話方式呈現，沒有艱澀術語，也不預設你已有任何背景知識。
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-green-500 mb-2">社群支援</h3>
          <p className="text-gray-200 text-sm">
            真實的夥伴互相幫助。我們的 Discord 聚集了學生、專業人士與熱心導師，隨時準備協助你邁出下一步。
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-purple-500 mb-2">用心打造</h3>
          <p className="text-gray-200 text-sm">
            每個功能都以可用性與無障礙為出發點。強大的工具也應該簡單好上手，讓更多人能安心使用。
          </p>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-100 mb-8 text-center">常見問題</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-800 rounded-lg shadow-sm p-6 border">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">{faq.question}</h3>
              <p className="text-gray-200">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">加入我們的社群</h2>
        <p className="text-gray-700 mb-6">
          不用孤軍奮戰。我們的夥伴來自不同領域，願意分享、願意陪伴，因為相信開放協作能讓投資旅程更順利。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://discord.gg/jdJuEMvk"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-550 transition-colors text-center inline-block"
          >
            加入 Discord 社群
          </a>

          <a
            href="mailto:opendevsociety@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors text-center inline-block"
          >
            寄信給支援團隊
          </a>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          ✨ 所有支援皆為免費。我們真心希望陪你一起成長，而不是銷售服務。
        </p>
      </section>
    </div>
  );
}
