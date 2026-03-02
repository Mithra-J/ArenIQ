# 📱 ArenIQ — Citizen Reporting App

The mobile application component of ArenIQ, built with **Flutter** for both Android and iOS.

This app allows verified citizens to report waterbody encroachments directly from their phone with photo evidence and GPS location — routing each complaint automatically to the responsible local authority.

---

## Features

- **OTP Verification** — Users sign up with mobile number + OTP via Supabase Auth. No anonymous reports allowed.
- **Report Encroachment** — Capture or upload a photo, add a caption, select encroachment type.
- **GPS Tagging** — Location is auto-captured or manually pinned on OpenStreetMap via `flutter_map`.
- **Auto Routing** — Complaint goes to the authority responsible for that GPS location.
- **Privacy First** — No public feed, no comments, no sharing, no screenshots.
- **Live Counter** — Users can see how many encroachments have been flagged and rescued.

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Flutter (Dart) |
| Maps | OpenStreetMap + flutter_map |
| Authentication | Supabase Auth (OTP) |
| Database | Supabase PostgreSQL |
| Image Storage | Supabase Storage |
| Notifications | Ntfy.sh |

---

## Getting Started

```bash
flutter pub get
flutter run
```

Make sure your `lib/config.dart` has your Supabase project URL and anon key configured.
