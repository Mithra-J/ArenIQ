# 🌐 ArenIQ — Web Dashboard

The authority-facing React.js dashboard for monitoring detected encroachments across Chengalpattu District's waterbodies.

---

## What It Does

- Displays all encroachment zones detected by the satellite pipeline on an interactive map
- Shows encroachment type, confidence score, area, and detection date for each zone
- Allows authorities to mark complaints as **resolved** or **escalate** to higher officials
- Shows live counters — total encroachments flagged vs rescued
- Receives citizen reports forwarded by the backend

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | React.js |
| Maps | OpenStreetMap + Leaflet.js |
| Backend Connection | REST API (Node.js) |
| Styling | CSS |

---

## Getting Started

```bash
cd dashboard
npm install
npm start
```

Dashboard runs on `http://localhost:3000`

Make sure the backend server is running on port 5000 before starting the dashboard.