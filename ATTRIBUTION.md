# Attribution

## AI Assistance

Portions of this project were developed with assistance from **Claude (Anthropic)**.

### What AI was used for:
- Code scaffolding and boilerplate generation
- Documentation and README writing
- Code comments and inline explanations
- Suggesting FOSS alternatives to proprietary tools

### What was designed and built by the team:
- Problem statement and domain research (Tamil Nadu waterbody encroachment)
- System architecture and feature design
- Choice of Chengalpattu District as pilot region
- NDWI-based detection approach and pipeline design
- 3-level authority escalation logic concept
- Dual satellite + citizen reporting system concept
- Integration decisions and technology stack choices
- All testing, debugging, and validation

All AI-generated code was reviewed, understood, and validated by the team before use.

---

## Open Source Libraries Used

| Library | License | Purpose |
|---|---|---|
| sentinelsat | Apache 2.0 | Sentinel-2 satellite image download |
| OpenCV | Apache 2.0 | Image processing and NDWI computation |
| scikit-learn | BSD | Random Forest encroachment classifier |
| rasterio | BSD | Geospatial raster band extraction |
| NumPy | BSD | Numerical computation |
| React.js | MIT | Web dashboard frontend |
| Node.js | MIT | Backend server |
| Flutter | BSD | Mobile application framework |
| flutter_map | BSD | OpenStreetMap integration |
| Supabase | Apache 2.0 | Database, auth and storage |
| Ntfy.sh | Apache 2.0 | Push notifications to authorities |
| python-dotenv | BSD | Environment variable management |

---

## Satellite Data

Sentinel-2 imagery provided by the **European Space Agency (ESA)** via the
**Copernicus Data Space Ecosystem** under the Copernicus open data policy.

Free access: https://dataspace.copernicus.eu

---

## Team

| Member | Role |
|---|---|
| Mithra J | Flutter app, Python pipeline, escalation logic, documentation |
| FAIZ | Backend API, Supabase integration, dashboard frontend |
| Mohamed Marzuq Tharif | Web frontend, UI/UX |