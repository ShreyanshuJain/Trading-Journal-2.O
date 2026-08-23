# 📈 Trading Journal & Analytics Dashboard

A professional, full-stack trading journal and performance analytics application built with **React 19**, **TypeScript**, **Tailwind CSS**, **Vite**, and **Express**.

Designed for active forex, crypto, futures, indices, and equities traders to log executions, analyze setups, manage risk, attach chart screenshots, and track long-term equity growth.

---

## ✨ Features

- **📊 Comprehensive Performance Analytics**:
  - Net Profit/Loss, Win Rate, Profit Factor, Expected Payoff, and Realized R-Multiple calculations.
  - Interactive Equity Growth Curves and cumulative R:R progression with Recharts.
  - Performance breakdown by Trading Session (Asian, London, NY, London/NY overlap) and Day of Week.
  - Strategy & Asset Pair comparative statistics.

- **📝 High-Velocity Trade Logging**:
  - Automatic P&L calculation based on entry, stop loss, exit price, and lot size.
  - Risk parameters with position sizing calculator and risk-to-reward ratio tracking.
  - Execution tagging (A+ Setup, FOMO, News, Breakout, Counter-trend, etc.) and trade notes.

- **🖼️ Universal Screenshot & Chart Gallery**:
  - Instant clipboard paste (`Ctrl+V` / `Cmd+V`) and drag-and-drop file upload.
  - Automated chart synthesis (`Auto Chart`) with candlestick pattern visualization.
  - Multi-tier image storage: Cloudinary CDN integration or local server `/uploads/` fallback.
  - Fullscreen zoom lightbox with category markers (Before Entry, Entry, Management, Exit).

- **📅 Calendar & Account Management**:
  - Monthly calendar view with daily P&L heatmaps and trade counts.
  - Multi-account management (Funded challenge accounts, live personal accounts, swing/scalp books).

- **🛡️ Risk Management & Drawdown Guard**:
  - Configurable maximum risk per trade (%) and daily loss circuit breakers (%).
  - Real-time lot size calculation based on account equity and stop loss distance.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React Icons, Recharts, Motion
- **Backend**: Node.js, Express, tsx, esbuild
- **Persistence**: Hybrid multi-layer architecture (Firebase Cloud Firestore / MongoDB / File-backed local store)
- **Image Pipeline**: Cloudinary CDN + Local Static Storage (`/uploads/`)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/trading-journal.git
cd trading-journal
npm install
```

### 2. Configure Environment Variables

Copy the example environment template:

```bash
cp .env.example .env.local
```

Fill in any optional services (Firebase, Cloudinary, MongoDB, or Gemini API). If left blank, the app will automatically run with the built-in local persistence engine and local screenshot storage.

### 3. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`.

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
docker build -t trading-journal .

# Run container on port 3000
docker run -p 3000:3000 --env-file .env.local trading-journal
```

### Deploying to Cloud Platforms

- **Google Cloud Run**: Connect your GitHub repository to Cloud Run or use the provided `Dockerfile`.
- **Render / Railway / Fly.io**: Set the build command to `npm run build` and start command to `npm start`. Set port to `3000`.
- **Vercel / Netlify**: Configure root directory and ensure `npm run build` generates the `dist/` directory.

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description |
| :--- | :---: | :--- |
| `PORT` | No | Server port (default: `3000`) |
| `VITE_FIREBASE_API_KEY` | No | Firebase client API key for cloud synchronization |
| `VITE_FIREBASE_PROJECT_ID` | No | Firebase Project ID |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name for screenshot CDN |
| `CLOUDINARY_API_KEY` | No | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API Secret |
| `MONGODB_URI` | No | MongoDB connection string (falls back to local storage) |
| `GEMINI_API_KEY` | No | Gemini API Key for AI-assisted trade insights |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
