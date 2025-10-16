<div align="center">
  <br />
  <a href="#" target="_blank">
    <img src="./public/assets/images/dashboard.png" alt="Project Banner" />
  </a>
  © Open Dev Society. This project is licensed under AGPL-3.0; if you modify, redistribute, or deploy it (including as a web service), you must release your source code under the same license and credit the original authors.
  <br />
  <br/>

  <div>
    <img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logoColor=white&logo=next.js&color=000000" alt="Next.js badge" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6"/>
    <img src="https://img.shields.io/badge/-Tailwind%20CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=38B2AC"/>
    <img src="https://img.shields.io/badge/-shadcn/ui-black?style=for-the-badge&logoColor=white&logo=shadcnui&color=000000"/>
    <img src="https://img.shields.io/badge/-Radix%20UI-black?style=for-the-badge&logoColor=white&logo=radixui&color=000000"/>
    <img src="https://img.shields.io/badge/-Better%20Auth-black?style=for-the-badge&logoColor=white&logo=betterauth&color=000000"/>
    <img src="https://img.shields.io/badge/-MongoDB-black?style=for-the-badge&logoColor=white&logo=mongodb&color=00A35C"/>
    <img src="https://img.shields.io/badge/-Inngest-black?style=for-the-badge&logoColor=white&logo=inngest&color=000000"/>
    <img src="https://img.shields.io/badge/-Nodemailer-black?style=for-the-badge&logoColor=white&logo=gmail&color=EA4335"/>
    <img src="https://img.shields.io/badge/-TradingView-black?style=for-the-badge&logoColor=white&logo=tradingview&color=2962FF"/>
    <img src="https://img.shields.io/badge/-Finnhub-black?style=for-the-badge&logoColor=white&color=30B27A"/>
    <img src="https://img.shields.io/badge/-CodeRabbit-black?style=for-the-badge&logoColor=white&logo=coderabbit&color=9146FF"/>
  </div>
</div>

# OpenStock

OpenStock is an open-source alternative to expensive market platforms. Track real-time prices, set personalized alerts, and explore detailed company insights — built openly, for everyone, forever free.

Note: OpenStock is community-built and not a brokerage. Market data may be delayed based on provider rules and your configuration. Nothing here is financial advice.

## 📋 Table of Contents

1. ✨ [Introduction](#introduction)
2. 🌍 [Open Dev Society Manifesto](#manifesto)
3. ⚙️ [Tech Stack](#tech-stack)
4. 🔋 [Features](#features)
5. 🤸 [Quick Start](#quick-start)
6. 🐳 [Docker Setup](#docker-setup)
7. 🚀 [Deploying to Netlify](#deploying-to-netlify)
8. 🔐 [Environment Variables](#environment-variables)
9. 🧱 [Project Structure](#project-structure)
10. 📡 [Data & Integrations](#data--integrations)
11. 🧪 [Scripts & Tooling](#scripts--tooling)
12. 🤝 [Contributing](#contributing)
13. 🛡️ [Security](#security)
14. 📜 [License](#license)
15. 🙏 [Acknowledgements](#acknowledgements)

## ✨ Introduction

OpenStock is a modern stock market app powered by Next.js (App Router), shadcn/ui and Tailwind CSS, Better Auth for authentication, MongoDB for persistence, Finnhub for market data, and TradingView widgets for charts and market views.

## 🌍 Open Dev Society Manifesto <a name="manifesto"></a>

We live in a world where knowledge is hidden behind paywalls. Where tools are locked in subscriptions. Where information is twisted by bias. Where newcomers are told they’re not “good enough” to build.

We believe there’s a better way.

- Our Belief: Technology should belong to everyone. Knowledge should be open, free, and accessible. Communities should welcome newcomers with trust, not gatekeeping.
- Our Mission: Build free, open-source projects that make a real difference:
    - Tools that professionals and students can use without barriers.
    - Knowledge platforms where learning is free, forever.
    - Communities where every beginner is guided, not judged.
    - Resources that run on trust, not profit.
- Our Promise: We will never lock knowledge. We will never charge for access. We will never trade trust for money. We run on transparency, donations, and the strength of our community.
- Our Call: If you’ve ever felt you didn’t belong, struggled to find free resources, or wanted to build something meaningful — you belong here.

Because the future belongs to those who build it openly.

## ⚙️ Tech Stack

Core
- Next.js 15 (App Router), React 19
- TypeScript
- Tailwind CSS v4 (via @tailwindcss/postcss)
- shadcn/ui + Radix UI primitives
- Lucide icons

Auth & Data
- Better Auth (email/password) with MongoDB adapter
- MongoDB + Mongoose
- Finnhub API for symbols, profiles, and market news
- TradingView embeddable widgets

Automation & Comms
- Inngest (events, cron, AI inference via Gemini)
- Nodemailer (Gmail transport)
- next-themes, cmdk (command palette), react-hook-form

Language composition
- TypeScript (~93.4%), CSS (~6%), JavaScript (~0.6%)

## 🔋 Features

- Authentication
    - Email/password auth with Better Auth + MongoDB adapter
    - Protected routes enforced via Next.js middleware
- Global search and Command + K palette
    - Fast stock search backed by Finnhub
    - Popular stocks when idle; debounced querying
- Watchlist
    - Per-user watchlist stored in MongoDB (unique symbol per user)
- Stock details
    - TradingView symbol info, candlestick/advanced charts, baseline, technicals
    - Company profile and financials widgets
- Market overview
    - Heatmap, quotes, and top stories (TradingView widgets)
- Personalized onboarding
    - Collects country, investment goals, risk tolerance, preferred industry
- Email & automation
    - AI-personalized welcome email (Gemini via Inngest)
    - Daily news summary emails (cron) personalized using user watchlists
- Polished UI
    - shadcn/ui components, Radix primitives, Tailwind v4 design tokens
    - Dark theme by default
- Keyboard shortcut
    - Cmd/Ctrl + K for quick actions/search

## 🤸 Quick Start

Prerequisites
- Node.js 20+ and pnpm or npm
- MongoDB connection string (MongoDB Atlas or local via Docker Compose)
- Finnhub API key (free tier supported; real-time may require paid)
- Gmail account for email (or update Nodemailer transport)
- Optional: Google Gemini API key (for AI-generated welcome intros)

Clone and install
```bash
git clone https://github.com/Open-Dev-Society/OpenStock.git
cd OpenStock

# choose one:
pnpm install
# or
npm install
```

Configure environment
- Create a `.env` file (see [Environment Variables](#environment-variables)).
- Verify DB connectivity:
```bash
pnpm test:db
# or
npm run test:db
```

Run development
```bash
# Next.js dev (Turbopack)
pnpm dev
# or
npm run dev
```

Run Inngest locally (workflows, cron, AI)
```bash
npx inngest-cli@latest dev
```

Build & start (production)
```bash
pnpm build && pnpm start
# or
npm run build && npm start
```

Open http://localhost:3000 to view the app.

## 🐳 Docker Setup

You can run OpenStock and MongoDB easily with Docker Compose.

1) Ensure Docker and Docker Compose are installed.

2) docker-compose.yml includes two services:
- openstock (this app)
- mongodb (MongoDB database with a persistent volume)

3) Create your `.env` (see examples below). For the Docker setup, use a local connection string like:
```env
MONGODB_URI=mongodb://root:example@mongodb:27017/openstock?authSource=admin
```

4) Start the stack:
```bash
# from the repository root
docker compose up -d --build
```

5) Access the app:
- App: http://localhost:3000
- MongoDB is available inside the Docker network at host mongodb:27017

Notes
- The app service depends_on the mongodb service.
- Credentials are defined in Compose for the MongoDB root user; authSource=admin is required on the connection string for root.
- Data persists across restarts via the docker volume.

Optional: Example MongoDB service definition used in this project:
```yaml
services:
  mongodb:
    image: mongo:7
    container_name: mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongo-data:
```

## 🚀 Deploying to Netlify

Netlify can build the project without extra tweaks thanks to the included `netlify.toml`. Follow this checklist to enable one-click deployments:

1. **Prepare the repository**
   - Fork this repo or push it to your Git provider (GitHub/GitLab/Bitbucket).
   - Ensure the default branch contains your configuration files and the latest code.
2. **Create a Netlify site**
   - Log into [Netlify](https://app.netlify.com) and choose **Add new site → Import an existing project**.
   - Connect the repository; Netlify auto-detects the build command (`npm run build`) and publish directory (`.next`) from `netlify.toml`.
   - The official `@netlify/plugin-nextjs` is installed automatically during each build.
3. **Set environment variables**
   - In **Site settings → Environment variables**, add the same keys you use locally (see [Environment Variables](#environment-variables) for details).
   - Minimum production-ready values:

      | Variable | Purpose |
      | --- | --- |
      | `MONGODB_URI` | Connection string for your MongoDB deployment (Atlas or dedicated cluster). |
      | `BETTER_AUTH_SECRET` | Secret string for Better Auth session encryption. |
      | `BETTER_AUTH_URL` | Public site URL (e.g. `https://your-site.netlify.app`). |
      | `FINNHUB_API_KEY` | Server-side Finnhub market data key. |
      | `NEXT_PUBLIC_FINNHUB_API_KEY` | Optional browser-exposed Finnhub key if client requests need it. |
      | `FINNHUB_BASE_URL` | Default `https://finnhub.io/api/v1`; override only if you proxy requests. |
      | `GEMINI_API_KEY` | (Optional) Enables AI-powered emails triggered through Inngest. |
      | `NODEMAILER_EMAIL` / `NODEMAILER_PASSWORD` | SMTP credentials for transactional email delivery. |
4. **Trigger the first deploy**
   - Click **Deploy site**. Netlify runs `npm run build`, emits serverless functions for API routes/Server Actions, and serves assets from `.next`.
   - Subsequent pushes to the tracked branch deploy automatically.
5. **Local parity (optional)**
   - Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) and run `netlify dev` to emulate Netlify Functions locally for QA parity.

> ℹ️ For cron jobs or background workflows (Inngest), continue configuring them with the provider dashboards; Netlify focuses on request-driven functions.

## 🔐 Environment Variables

Create `.env` at the project root. Choose either a hosted MongoDB (Atlas) URI or the local Docker URI.

Hosted (MongoDB Atlas):
```env
# Core
NODE_ENV=development

# Database (Atlas)
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# Better Auth
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Finnhub
FINNHUB_API_KEY=your_finnhub_key
# Optional client-exposed variant if needed by client code:
NEXT_PUBLIC_FINNHUB_API_KEY=
FINNHUB_BASE_URL=https://finnhub.io/api/v1

# Inngest AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Email (Nodemailer via Gmail; consider App Passwords if 2FA)
NODEMAILER_EMAIL=youraddress@gmail.com
NODEMAILER_PASSWORD=your_gmail_app_password
```

Local (Docker Compose) MongoDB:
```env
# Core
NODE_ENV=development

# Database (Docker)
MONGODB_URI=mongodb://root:example@mongodb:27017/openstock?authSource=admin

# Better Auth
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Finnhub
FINNHUB_API_KEY=your_finnhub_key
NEXT_PUBLIC_FINNHUB_API_KEY=
FINNHUB_BASE_URL=https://finnhub.io/api/v1

# Inngest AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Email (Nodemailer via Gmail; consider App Passwords if 2FA)
NODEMAILER_EMAIL=youraddress@gmail.com
NODEMAILER_PASSWORD=your_gmail_app_password
```

Notes
- Keep private keys server-side whenever possible.
- If using `NEXT_PUBLIC_` variables, remember they are exposed to the browser.
- In production, prefer a dedicated SMTP provider over a personal Gmail.
- Do not hardcode secrets in the Dockerfile; use `.env` and Compose.

## 🧱 Project Structure

```
app/
  (auth)/
    layout.tsx
    sign-in/page.tsx
    sign-up/page.tsx
  (root)/
    layout.tsx
    page.tsx
    help/page.tsx
    stocks/[symbol]/page.tsx
  api/inngest/route.ts
  globals.css
  layout.tsx
components/
  ui/…          # shadcn/radix primitives (button, dialog, command, input, etc.)
  forms/…       # InputField, SelectField, CountrySelectField, FooterLink
  Header.tsx, Footer.tsx, SearchCommand.tsx, WatchlistButton.tsx, …
database/
  models/watchlist.model.ts
  mongoose.ts
lib/
  actions/…     # server actions (auth, finnhub, user, watchlist)
  better-auth/…
  inngest/…     # client, functions, prompts
  nodemailer/…  # transporter, email templates
  constants.ts, utils.ts
scripts/
  test-db.mjs
types/
  global.d.ts
next.config.ts          # i.ibb.co image domain allowlist
postcss.config.mjs      # Tailwind v4 postcss setup
components.json         # shadcn config
public/assets/images/   # logos and screenshots
```

## 📡 Data & Integrations

- Finnhub
    - Stock search, company profiles, and market news.
    - Set `FINNHUB_API_KEY` and `FINNHUB_BASE_URL` (default: https://finnhub.io/api/v1).
    - Free tiers may return delayed quotes; respect rate limits and terms.

- TradingView
    - Embeddable widgets used for charts, heatmap, quotes, and timelines.
    - External images from `i.ibb.co` are allowlisted in `next.config.ts`.

- Better Auth + MongoDB
    - Email/password with MongoDB adapter.
    - Session validation via middleware; most routes are protected, with public exceptions for `sign-in`, `sign-up`, assets and Next internals.

- Inngest
    - Workflows:
        - `app/user.created` → AI-personalized Welcome Email
        - Cron `0 12 * * *` → Daily News Summary per user
    - Local dev: `npx inngest-cli@latest dev`.

- Email (Nodemailer)
    - Gmail transport. Update credentials or switch to your SMTP provider.
    - Templates for welcome and news summary emails.

## 🧪 Scripts & Tooling

Package scripts
- `dev`: Next.js dev server with Turbopack
- `build`: Production build (Turbopack)
- `start`: Run production server
- `lint`: ESLint
- `test:db`: Validate DB connectivity

Developer experience
- TypeScript strict mode
- Tailwind CSS v4 (no separate tailwind.config needed)
- shadcn/ui components with Radix primitives
- cmdk command palette, next-themes, lucide-react icons

## 🤝 Contributing

You belong here. Whether you’re a student, a self-taught dev, or a seasoned engineer — contributions are welcome.

- Open an issue to discuss ideas and bugs
- Look for “good first issue” or “help wanted”
- Keep PRs focused; add screenshots for UI changes
- Be kind, guide beginners, no gatekeeping — that’s the ODS way

## 🛡️ Security

If you discover a vulnerability:
- Do not open a public issue
- Email: opendevsociety@cc.cc
- We’ll coordinate responsible disclosure and patch swiftly

## 📜 License

OpenStock is and will remain free and open for everyone. A formal open-source license will be added to this repository; until then, contributions are accepted under our commitment to openness and transparency.

## 🙏 Acknowledgements

- Finnhub for accessible market data
- TradingView for embeddable market widgets
- shadcn/ui, Radix UI, Tailwind CSS, Next.js community
- Inngest for dependable background jobs and workflows
- Better Auth for simple and secure authentication
- All contributors who make open tools possible

— Built openly, for everyone, forever free. Open Dev Society.

> © Open Dev Society. This project is licensed under AGPL-3.0; if you modify, redistribute, or deploy it (including as a web service), you must release your source code under the same license and credit the original authors.

## Our Honourable Contributors
- [ravixalgorithm](https://github.com/ravixalgorithm)
- [Priyanshuu00007](https://github.com/Priyanshuu00007)
- [chinnsenn](https://github.com/chinnsenn)

## Special thanks
Huge thanks to [Adrian Hajdin (JavaScript Mastery)](https://github.com/adrianhajdin) — his excellent Stock Market App tutorial was instrumental in building OpenStock for the open-source community under the Open Dev Society.

GitHub: [adrianhajdin](https://github.com/adrianhajdin)
YouTube tutorial: [Stock Market App Tutorial](https://www.youtube.com/watch?v=gu4pafNCXng)
YouTube channel: [JavaScript Mastery](https://www.youtube.com/@javascriptmastery)
