# Trading Journal

A professional trading journal web app built with React + TypeScript, Vite, and Express.

## Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Recharts, Framer Motion, Lucide icons
- **Backend**: Express (Node.js), serving Vite in dev mode
- **Database**: Optional MongoDB (falls back to local `data_store.json` if no URI provided)

## How to run

The workflow `Start application` runs `npm run dev`, which starts the Express + Vite dev server on port 5000.

To run manually:
```bash
npm run dev
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Optional | MongoDB connection string (e.g. `mongodb+srv://...`). If not set, data is stored in `data_store.json`. |

## Features

- Dashboard with P&L, win rate, profit factor, equity curve
- Trade journal with filtering and search
- Calendar view
- Trade gallery
- Analytics (strategy, pair, session, day-of-week breakdowns)
- Risk management
- Accounts management
- Strategies & tags
- Settings (theme, currency, etc.)

## User preferences

- Wants to add advanced features: proper database storage (PostgreSQL/MongoDB), AI-powered insights, and more.
