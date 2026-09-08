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

## 🚀 Quick Start & Installation

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 1. Clone the Repository & Install Dependencies

```bash
git clone https://github.com/your-username/trading-journal.git
cd trading-journal
npm install
```

### 2. Configure Environment Variables

Create your local environment configuration by copying `.env.example`:

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and configure any services you wish to connect:
- **MongoDB**: For centralized database storage. If omitted, Pip Track persists seamlessly to local disk (`data_store.json`).
- **Cloudinary**: For external image CDN hosting. If omitted, screenshots save directly to `./uploads/`.
- **Gemini AI**: For AI setup reviews and trade feedback.
- **Firebase**: For multi-device authentication and cloud Firestore sync.

> ⚠️ **SECURITY NOTE**: Never commit `.env.local` or any file containing real API keys or credentials to version control. Keep all secret keys strictly in your server environment variables.

### 3. Run Locally in Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:3000`.

---

## ⚙️ Environment Variables Reference

| Variable | Scope | Required | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | Server | No | Server port (default: `3000`) |
| `MONGODB_URI` | Server | No | MongoDB connection string. Falls back to local file storage if not provided. |
| `GEMINI_API_KEY` | Server | No | Google Gemini API key for server-side AI trade insights. |
| `CLOUDINARY_CLOUD_NAME` | Server | No | Cloudinary cloud name for screenshot uploads. |
| `CLOUDINARY_API_KEY` | Server | No | Cloudinary API Key. |
| `CLOUDINARY_API_SECRET` | Server | No | Cloudinary API Secret (kept strictly server-side). |
| `VITE_CLOUDINARY_CLOUD_NAME` | Client | No | Public Cloudinary cloud name for client uploads. |
| `VITE_CLOUDINARY_UPLOAD_PRESET`| Client | No | Unsigned Cloudinary upload preset. |
| `VITE_FIREBASE_API_KEY` | Client | No | Firebase client API key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client | No | Firebase authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | Client | No | Firebase Project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET`| Client | No | Firebase storage bucket. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Client | No | Firebase messaging sender ID. |
| `VITE_FIREBASE_APP_ID` | Client | No | Firebase client App ID. |

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
