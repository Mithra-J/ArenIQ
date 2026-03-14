export const portalStats = [
  {
    label: "Waterbodies Under Watch",
    value: "1,248",
    change: "+12.4%",
    description: "Integrated registry of lakes, tanks, canals, and seasonal wetlands monitored weekly.",
    tone: "bg-sky-100 text-sky-800",
  },
  {
    label: "Active Encroachment Alerts",
    value: "86",
    change: "+7 today",
    description: "Suspected edge intrusions raised from satellite, drone, and citizen evidence layers.",
    tone: "bg-amber-100 text-amber-800",
  },
  {
    label: "Resolved Cases",
    value: "214",
    change: "91% closure",
    description: "Cases cleared after field verification, notice issuance, and restoration confirmation.",
    tone: "bg-emerald-100 text-emerald-800",
  },
  {
    label: "District Monitoring Score",
    value: "94.6",
    change: "Operational",
    description: "Composite readiness index across monitoring cadence, alerts, and enforcement throughput.",
    tone: "bg-slate-100 text-slate-700",
  },
];

export const encroachmentTrend = [
  { month: "Jan", detected: 18, resolved: 12 },
  { month: "Feb", detected: 24, resolved: 17 },
  { month: "Mar", detected: 22, resolved: 19 },
  { month: "Apr", detected: 29, resolved: 21 },
  { month: "May", detected: 35, resolved: 27 },
  { month: "Jun", detected: 31, resolved: 28 },
];

export const districtStats = [
  { district: "Chennai", cases: 18, monitored: 240 },
  { district: "Coimbatore", cases: 10, monitored: 166 },
  { district: "Madurai", cases: 7, monitored: 121 },
  { district: "Trichy", cases: 14, monitored: 140 },
  { district: "Salem", cases: 11, monitored: 132 },
];

export const monthlyMonitoring = [
  { period: "Week 1", scans: 92, alerts: 11 },
  { period: "Week 2", scans: 104, alerts: 16 },
  { period: "Week 3", scans: 111, alerts: 9 },
  { period: "Week 4", scans: 118, alerts: 13 },
];

export const mapMarkers = [
  {
    id: 1,
    title: "Lake Edge Intrusion",
    location: "Porur Lake, Chennai",
    position: [13.038, 80.154],
    status: "Critical",
  },
  {
    id: 2,
    title: "Canal Shoulder Occupation",
    location: "Ukkadam Canal, Coimbatore",
    position: [10.992, 76.961],
    status: "Observed",
  },
  {
    id: 3,
    title: "Bund Alteration",
    location: "Vandiyur Tank, Madurai",
    position: [9.929, 78.155],
    status: "Critical",
  },
];

export const reportCards = [
  {
    id: 1,
    category: "Citizen Submission",
    location: "Velachery Lake Buffer Zone",
    description: "Temporary structures observed on the southern bund during the last two weeks.",
    status: "Pending",
    reportedBy: "K. Priya",
    date: "12 Mar 2026",
    photo: "IMG_0421.jpg",
  },
  {
    id: 2,
    category: "Field Verification",
    location: "Singanallur Tank Outfall",
    description: "Debris dumping and land fill activity reducing natural drainage width.",
    status: "Approved",
    reportedBy: "Ward Survey Team 3",
    date: "10 Mar 2026",
    photo: "drone_capture_07.png",
  },
  {
    id: 3,
    category: "Satellite Flag",
    location: "Korattur Lake Fringe",
    description: "Reflectance anomaly and edge hardening indicate possible compound wall extension.",
    status: "Rejected",
    reportedBy: "Remote Sensing Unit",
    date: "07 Mar 2026",
    photo: "sentinel_tile_b12.tif",
  },
];

export const satellitePreviews = [
  {
    id: 1,
    sensor: "Sentinel-2 / NDWI Overlay",
    title: "Seasonal shrinkage with perimeter hardening",
    captureDate: "Captured on 11 Mar 2026",
    summary: "Vegetation masking removed to highlight suspected fill zones along the western bank.",
    district: "Chennai",
    priority: "Priority I",
    gradient: "from-sky-800 via-sky-700 to-emerald-700",
  },
  {
    id: 2,
    sensor: "Drone Mosaic / RGB",
    title: "Canal corridor obstruction cluster",
    captureDate: "Captured on 09 Mar 2026",
    summary: "High-resolution inspection confirms progressive dumping across the service pathway.",
    district: "Coimbatore",
    priority: "Priority II",
    gradient: "from-emerald-800 via-teal-700 to-sky-700",
  },
  {
    id: 3,
    sensor: "Historical Comparison",
    title: "Bund breach risk near settlement edge",
    captureDate: "Updated on 13 Mar 2026",
    summary: "Change analysis shows repeated earthwork expansion over the last three monitoring cycles.",
    district: "Madurai",
    priority: "Priority I",
    gradient: "from-slate-800 via-sky-900 to-emerald-800",
  },
];

export const adminRows = [
  {
    id: 1,
    district: "Chennai",
    officer: "Assistant Engineer - Zone 12",
    pending: 6,
    approved: 14,
    resolutionRate: "88%",
  },
  {
    id: 2,
    district: "Coimbatore",
    officer: "Executive Officer - North",
    pending: 4,
    approved: 9,
    resolutionRate: "81%",
  },
  {
    id: 3,
    district: "Madurai",
    officer: "Lake Protection Cell",
    pending: 3,
    approved: 7,
    resolutionRate: "84%",
  },
];
