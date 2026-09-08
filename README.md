# 📈 Pip Track — Trading Journal & Analytics Dashboard

A professional, full-stack trading journal and performance analytics application built with **React 19**, **TypeScript**, **Tailwind CSS**, **Vite**, and **Express**.

Designed for active forex, crypto, futures, indices, and equities traders to log executions, analyze setups, manage risk, attach chart screenshots, and track long-term equity growth.

---

## ✨ Features

- **📊 Comprehensive Performance Analytics**:
  - Net Profit/Loss, Win Rate, Profit Factor, Expected Payoff, and Realized R-Multiple calculations.
  - Interactive Equity Growth Curves and cumulative R:R progression with Recharts.
  - Performance breakdown by Trading Session (Asian, London, NY, London/NY overlap) and Day of Week.
  - Strategy & Asset Pair comparative statistics and Account Balance progress tracker.

- **📝 High-Velocity Trade Logging**:
  - Automatic P&L calculation based on entry, stop loss, exit price, and lot size.
  - Risk parameters with position sizing calculator and risk-to-reward ratio tracking.
  - Execution tagging (A+ Setup, FOMO, News, Breakout, Counter-trend, etc.) and trade notes.

- **🖼️ Universal Screenshot & Chart Gallery**:
  - Instant clipboard paste (`Ctrl+V` / `Cmd+V`) and drag-and-drop file upload.
  - Automated chart synthesis (`Auto Chart`) with candlestick pattern visualization.
  - Multi-tier image storage: Cloudinary CDN integration or automatic local server `/uploads/` fallback.
  - Fullscreen zoom lightbox with category markers (Before Entry, Entry, Management, Exit).

- **📅 Calendar & Account Management**:
  - Monthly calendar view with daily P&L heatmaps and trade counts.
  - Multi-account management (Funded challenge accounts, live personal accounts, swing/scalp books).

- **🛡️ Risk Management & Drawdown Guard**:
  - Configurable maximum risk per trade (%) and daily loss circuit breakers (%).
  - Real-time lot size calculation based on account equity and stop loss distance.

- **🤖 AI-Powered Trade Insights (Optional)**:
  - Server-side Gemini AI integration for trade psychology and setup reviews.
  - Fails gracefully when AI services are not configured.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React Icons, Recharts, Motion
- **Backend**: Node.js, Express, tsx, esbuild
- **Persistence**: Hybrid multi-layer architecture (Firebase Cloud Firestore / MongoDB / File-backed local store)
- **Image Pipeline**: Cloudinary CDN + Local Static Storage (`/uploads/`)

---

## 🔐 Environment Variables & Security

Pip Track is designed so that sensitive credentials are **never stored in the source code**.

To run your own instance, create a `.env.local` file from `.env.example` and provide **your own service credentials**.

> **Important:** The public repository does not include the author's production credentials. Do not use or commit credentials belonging to another deployment.

### Services

* **MongoDB** — Optional. Provide your own MongoDB connection string. If omitted, Pip Track uses local persistence.
* **Cloudinary** — Optional. Configure your own Cloudinary account for image hosting.
* **Gemini AI** — Optional. Provide your own Gemini API key for AI-powered features.
* **Firebase** — Optional. Configure your own Firebase project for authentication and cloud synchronization.

Never commit `.env.local`, API keys, passwords, database connection strings, or other private credentials to Git.

---

## 📦 Production Build & Deployment

### Standard Production Build

```bash
# 1. Compile frontend and bundle backend
npm run build

# 2. Launch production server
npm start
```

### Docker Deployment

Run with Docker in a single step:

```bash
# Build Docker image
docker build -t pip-track .

# Run container on port 3000 with environment variables
docker run -p 3000:3000 --env-file .env.local pip-track
```

### Deploying to Cloud Platforms

- **Google Cloud Run**: Build using the provided `Dockerfile` or connect your GitHub repository to Cloud Run. Set environment variables in Cloud Run configuration.
- **Render / Railway / Fly.io**: Set build command to `npm run build` and start command to `npm start`. Bind to port `3000`.
- **AWS / DigitalOcean / VPS**: Clone the repository, install dependencies, configure `.env.local`, run `npm run build`, and manage the process with `pm2 start dist/server.cjs --name pip-track`.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
