# 🌊 ArenIQ — Waterbody Encroachment Monitoring & Citizen Reporting System

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20%7C%20iOS-green)
![Satellite](https://img.shields.io/badge/Satellite-Sentinel--2%20(Copernicus)-orange)
![FOSS](https://img.shields.io/badge/FOSS-Compliant-brightgreen)

> **Protecting Chengalpattu District's waterbodies — automatically, 24x7, without manual intervention.**

---

## 🚨 The Problem

Tamil Nadu is losing its waterbodies at an alarming rate. Encroachments — illegal constructions, land filling, sand mining, and waste dumping — go undetected for months because:

- Traditional systems rely on **public complaints**, which are often unreported or unnoticed
- Manual inspection is **slow, costly, and geographically limited**
- By the time authorities act, the damage is irreversible

The consequences are devastating: **flooding during heavy rains**, reduced groundwater recharge, and permanent loss of water sources for future generations.

---

## 💡 Our Solution

**ArenIQ** is a dual-layer encroachment detection and reporting system:

| Layer | What it does |
|---|---|
| 🛰️ **Satellite Monitoring Website** | Automatically detects changes in waterbodies using Sentinel-2 imagery and sends alerts to authorities |
| 📱 **Citizen Reporting App** | Allows verified citizens to photograph and report encroachments with GPS tagging |

Together, they form a **dual authentication + complaint escalation system** that bridges the gap between detection and government action.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   ArenIQ System                     │
│                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │  🛰️ Satellite Module  │  │  📱 Citizen App       │ │
│  │                      │  │                      │ │
│  │  Sentinel-2           │  │  Flutter (Android/  │ │
│  │  (Copernicus/ESA)    │  │  iOS)                │ │
│  │       ↓              │  │       ↓              │ │
│  │  NDWI Calculation    │  │  OTP Verification    │ │
│  │       ↓              │  │       ↓              │ │
│  │  Image Differencing  │  │  GPS-Tagged Report   │ │
│  │       ↓              │  │       ↓              │ │
│  │  Change Detection    │  │  Supabase Storage    │ │
│  │       ↓              │  └──────────────────────┘ │
│  │  Random Forest       │             │             │
│  │  Classifier          │             │             │
│  └──────────────────────┘             │             │
│             │                         │             │
│             └────────────┬────────────┘             │
│                          ↓                          │
│              ┌───────────────────────┐              │
│              │   Node.js Backend     │              │
│              │   Alert Engine        │              │
│              │   Escalation Logic    │              │
│              └───────────────────────┘              │
│                          ↓                          │
│              ┌───────────────────────┐              │
│              │  Ntfy.sh Push Alerts  │              │
│              │  → Local Authority    │              │
│              │  → District Level     │              │
│              │  → State Level        │              │
│              └───────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

---

## 🛰️ Feature 1: Satellite Monitoring Website

### How It Works

**Step 1 — Image Acquisition**
Satellite images are fetched from **Sentinel-2** via the **Copernicus Open Access Hub** using the open-source `sentinelsat` Python library. Images are pulled on a daily/weekly schedule for all registered waterbodies in Chengalpattu District.

**Step 2 — NDWI Calculation**
The **Normalized Difference Water Index** is computed for both current and previous images:
```
NDWI = (Green − NIR) / (Green + NIR)
```
Higher NDWI values indicate water presence. A drop in NDWI signals potential encroachment.

**Step 3 — Image Differencing**
The old NDWI map is subtracted from the current one to isolate only the changed regions, filtering out seasonal variation noise.

**Step 4 — Change Area Extraction**
Pixels showing significant change (beyond a calibrated threshold) are grouped into contiguous zones — these are candidate encroachment sites.

**Step 5 — Encroachment Classification**
A **Random Forest Classifier** (scikit-learn) trained on labeled satellite data categorizes each detected change:
- 🏗️ Construction / Building
- 🪨 Sand Mining
- 🗑️ Waste Dumping
- 🌍 Land Filling

**Step 6 — Alert Dispatch**
A complaint is auto-generated and sent via **Ntfy.sh** (open-source, self-hostable push notifications) to the responsible local authority. If no action is taken within the deadline, the alert **automatically escalates** to higher officials.

---

## 📱 Feature 2: Citizen Reporting App

### How It Works

**Step 1 — Verified Sign-Up**
Users register with their mobile number and verify via **OTP** (Supabase Auth). This prevents fake or anonymous reports.

**Step 2 — Report Encroachment**
The user taps "Report Encroachment", captures or uploads a photo, and optionally adds a short caption describing what they observed.

**Step 3 — GPS Tagging**
Location is automatically captured via the device GPS or manually pinned on an **OpenStreetMap + flutter_map** interface. The location determines which authority receives the complaint.

**Step 4 — Encroachment Type Selection**
Users select the type of encroachment from a predefined list (Construction, Dumping, Sand Mining, etc.) for faster processing.

### Privacy First
- ❌ No public comments or sharing of reports
- ❌ No screenshots allowed within the app
- ✅ Reports go directly and only to the mapped authority

---

## ⚡ What Makes ArenIQ Unique

Unlike research tools like **SandWatch** or academic satellite platforms where data rarely reaches authorities:

| Feature | ArenIQ | Existing Tools |
|---|---|---|
| 24x7 automated monitoring | ✅ | ❌ |
| Direct authority alert | ✅ | ❌ |
| Escalation to higher officials | ✅ | ❌ |
| Citizen + satellite dual layer | ✅ | ❌ |
| Real-time encroachment count (public) | ✅ | ❌ |
| Encroachments rescued counter | ✅ | ❌ |
| Fully FOSS stack | ✅ | ❌ |

---

## 🔧 Tech Stack

> ✅ All tools are **free and open-source (FOSS)**. No proprietary APIs required for core functionality.

### Website (Satellite Monitoring)
| Component | Technology | License |
|---|---|---|
| Language | Python | PSF |
| Satellite Data | Sentinel-2 via `sentinelsat` + Copernicus Open Access Hub | Apache 2.0 / ESA Open |
| Image Processing | OpenCV | Apache 2.0 |
| NDWI + Change Detection | NumPy, Rasterio | BSD |
| Classification | scikit-learn (Random Forest) | BSD |
| Frontend | React.js | MIT |
| Backend | Node.js | MIT |
| Push Alerts | Ntfy.sh (self-hostable) | Apache 2.0 |

### Mobile App (Citizen Reporting)
| Component | Technology | License |
|---|---|---|
| Framework | Flutter (Android & iOS) | BSD |
| Maps | OpenStreetMap + flutter_map | ODbL / BSD |
| Authentication (OTP) | Supabase Auth | Apache 2.0 |
| Database | Supabase (PostgreSQL) | Apache 2.0 |
| Image Storage | Supabase Storage | Apache 2.0 |
| Push Notifications | Ntfy.sh | Apache 2.0 |

---

## 📁 Project Structure

```
ArenIQ/
├── Web/                    # React.js frontend (satellite monitoring dashboard)
├── App/                    # Flutter mobile application
├── backend/                # Node.js backend + alert escalation engine
├── ndwi_detection.py       # Core NDWI + change detection + RF classifier
├── LICENSE                 # MIT License
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- Flutter SDK
- Copernicus Open Access Hub account (free — https://scihub.copernicus.eu)
- Supabase project (free tier — https://supabase.com)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Fill in your Supabase credentials
npm start
```

### Satellite Detection Script
```bash
pip install sentinelsat opencv-python scikit-learn numpy rasterio
python ndwi_detection.py
```

### Web Frontend
```bash
cd Web
npm install
npm run dev
```

### Mobile App
```bash
cd App
flutter pub get
flutter run
```

---

## 📍 Current Scope — Chengalpattu District

ArenIQ is currently focused on **Chengalpattu District** as a pilot region, chosen because:

- Rapid urban expansion makes encroachment highly active and measurable
- Dense network of registered waterbodies provides rich test data
- Proximity to Chennai makes authority coordination feasible for real-world validation

The system is intentionally scoped to one district to ensure depth over breadth — accurate detection, reliable alerts, and real authority response.

---

## 🎯 Expected Impact (Chengalpattu Pilot)

- 🌊 Monitor all registered waterbodies in Chengalpattu District simultaneously
- 🏘️ Reduce urban flooding by catching encroachments before they become permanent
- ⚡ Cut detection-to-action time from months to **hours**
- 👁️ Provide transparent public accountability through live encroachment + rescue counters

---

## ⚠️ Known Challenges

1. **Small encroachment detection** — Sentinel-2's 10m resolution may miss very small-scale changes
2. **Seasonal waterbody disappearance** — Small waterbodies may dry up in summer; handled by per-season baseline calibration
3. **Citizen adoption** — Encouraging consistent public participation requires awareness campaigns

---

## 🤖 AI Attribution

Portions of this codebase and documentation were developed with assistance from **Claude (Anthropic)**. All architecture decisions, domain-specific logic, and implementation were designed and validated by the team.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ for Tamil Nadu's waterbodies at **Foss Hack 2026**.

> *"Water is not just a resource — it is life. It is our duty to protect it."*
