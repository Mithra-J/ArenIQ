# 🚀 ArenIQ — Setup Guide

Complete step-by-step guide to run ArenIQ locally.

---

## Prerequisites

Make sure you have these installed:

- Python 3.8+
- Node.js 18+
- Flutter SDK
- Git

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/Mithra-J/ArenIQ.git
cd ArenIQ
```

---

## 2️⃣ Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with:
- `SUPABASE_URL` — from Supabase Dashboard → Settings → API
- `SUPABASE_KEY` — anon/public key from Supabase
- `SUPABASE_SERVICE_ROLE` — service role key (backend only)
- `COPERNICUS_USER` — your Copernicus account email
- `COPERNICUS_PASSWORD` — your Copernicus account password

For the frontend:
```bash
cp Web/frontend/.env.example Web/frontend/.env
```

Edit `Web/frontend/.env` with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 3️⃣ Python Pipeline (Satellite Detection)

```bash
# Install dependencies
pip install -r requirements.txt

# Step 1: Download latest Sentinel-2 images for Chengalpattu
python fetch_sentinel.py

# Step 2: Run NDWI change detection + upload results to Supabase
python ndwi_detection.py

# Or run both automatically via the daily runner:
python cron_runner.py
```

---

## 4️⃣ Backend Server

```bash
cd backend
npm install
npm start
```

Server runs on `http://localhost:5000`

---

## 5️⃣ Web Dashboard (Frontend)

```bash
cd Web/frontend
npm install
npm run dev
```

Dashboard runs on `http://localhost:5173`

---

## 6️⃣ Flutter Mobile App

```bash
cd App/areniq_app
flutter pub get
flutter run
```

---

## 🔄 Full Pipeline (End to End)

Run in this order for a complete test:

```bash
# Terminal 1 — Backend
cd backend && npm start

# Terminal 2 — Frontend
cd Web/frontend && npm run dev

# Terminal 3 — Satellite pipeline
python cron_runner.py

# Terminal 4 — Flutter app
cd App/areniq_app && flutter run
```

---

## 📱 Copernicus Account

Register free at: https://dataspace.copernicus.eu
- Select **Public** as user category
- Add credentials to `.env`

---

## 🗄️ Supabase Setup

1. Create free project at https://supabase.com
2. Run `backend/database/schema.sql` in Supabase SQL editor
3. Create storage bucket named `report-images`
4. Enable Phone auth in Supabase Authentication settings
5. Copy URL and keys to `.env`