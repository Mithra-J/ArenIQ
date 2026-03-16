# ArenIQ Backend

Free and accessible backend integrations for:

- Supabase Auth, PostgreSQL, and Storage
- OpenStreetMap + Leaflet
- Nominatim reverse geocoding
- Sentinel Hub satellite previews
- ntfy.sh notifications
- OpenWeatherMap rainfall context

## Folder Structure

```txt
backend/
  server.js
  .env.example
  controllers/
    reportsController.js
    satelliteController.js
    statisticsController.js
    uploadController.js
    weatherController.js
    waterbodiesController.js
  database/
    schema.sql
    supabase.js
  routes/
    reports.js
    satellite.js
    statistics.js
    upload.js
    weather.js
    waterbodies.js
  services/
    notifications.js
```

## API Endpoints

- `POST /api/report`
- `GET /api/reports`
- `GET /api/waterbodies`
- `POST /api/upload`
- `GET /api/statistics`
- `GET /api/satellite/preview`
- `GET /api/weather-context`
- `GET /api/health`

## Run

```bash
cd backend
npm install
copy .env.example .env
npm start
```

## Credentials You Need

### 1. Supabase

Required:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Steps:

1. Go to https://supabase.com and create a project.
2. Open your project dashboard.
3. Go to `Project Settings -> API`.
4. Copy:
   - `Project URL` -> `SUPABASE_URL`
   - `anon public` key -> `SUPABASE_ANON_KEY`
   - `service_role secret` key -> `SUPABASE_SERVICE_ROLE_KEY`
5. In `Storage`, create buckets named `report-photos` and `satellite-cache`.
6. In `SQL Editor`, run [database/schema.sql](/c:/Users/THARIF/OneDrive/Desktop/AQ/ArenIQ/backend/database/schema.sql).

### 2. Sentinel Hub

Required:

- `SENTINEL_CLIENT_ID`
- `SENTINEL_CLIENT_SECRET`

Steps:

1. Go to https://www.sentinel-hub.com/
2. Create a free account.
3. Open `Dashboard -> User settings -> OAuth clients`.
4. Create a new OAuth client.
5. Copy the generated client ID and client secret.

### 3. OpenWeatherMap

Optional:

- `OPENWEATHER_API_KEY`

Steps:

1. Go to https://openweathermap.org/api
2. Create a free account.
3. Generate an API key from your account dashboard.
4. Paste it into `.env`

### 4. OpenStreetMap / Nominatim / ntfy.sh

No API key required.

## Example Calls

### Reverse geocoding

```txt
https://nominatim.openstreetmap.org/reverse?lat=13.038&lon=80.154&format=jsonv2
```

### ntfy.sh

```js
await fetch("https://ntfy.sh/areniq-alerts", {
  method: "POST",
  headers: {
    Title: "New ArenIQ Report",
    Priority: "high",
  },
  body: "Porur Lake boundary intrusion reported",
});
```

### Sentinel preview

```txt
GET /api/satellite/preview?bbox=80.11,13.01,80.19,13.08&from=2026-01-01&to=2026-03-15
```
