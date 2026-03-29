"""
ndwi_detection.py — ArenIQ Waterbody Encroachment Detection
============================================================
This script forms the core of ArenIQ's satellite monitoring pipeline.

Pipeline:
  1. Load two NDWI satellite images (previous period vs current period)
  2. Compute pixel-wise difference to detect waterbody changes
  3. Threshold the difference to isolate significant change zones
  4. Extract contiguous changed regions (potential encroachment sites)
  5. Classify encroachment type using a Random Forest Classifier
  6. Upload results to Supabase (reports + image) for dashboard/alerts

Satellite Source : Sentinel-2 (ESA Copernicus — free & open access)
Band used        : Green (B3) and NIR (B8) for NDWI computation
NDWI Formula     : (Green - NIR) / (Green + NIR)
  - NDWI > 0   → water present
  - NDWI < 0   → land / vegetation
  - A drop in NDWI over time → potential encroachment

Author  : ArenIQ Team (Faiz, Mithra, Mohammed)
License : MIT
TEAM NOTE: Updated for Supabase integration. Run daily via cron: 0 6 * * * python ndwi_detection.py
"""

import cv2
import numpy as np
import json
import os
from dotenv import load_dotenv  # TEAM NOTE: For loading .env (pip install python-dotenv)
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from supabase import create_client, Client
import uuid  # TEAM NOTE: For unique report IDs

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

# Paths to the pre-computed NDWI grayscale images
NDWI_PREVIOUS = "ndwi_2023.png"   # Baseline image (older period)
NDWI_CURRENT  = "ndwi_2024.png"   # Current image (latest period)

# Change detection threshold (0–255)
CHANGE_THRESHOLD = 50

# Minimum contiguous pixel area to count as an encroachment zone
MIN_ENCROACHMENT_AREA_PX = 500

# Output files
OUTPUT_CHANGE_MAP  = "water_change_map.png"    # Binary change mask
OUTPUT_LABELLED    = "labelled_change_map.png" # Colour-coded by type
OUTPUT_REPORT      = "encroachment_report.json"

# Geographic bounds for Chengalpattu District (approx for pixel-to-lat/lon mapping)
# TEAM NOTE: Update with real image bounds from Sentinel-2 metadata
IMG_BOUNDS = {
    "north": 12.85,   # Top latitude
    "south": 12.55,   # Bottom latitude
    "west":  79.85,   # Left longitude
    "east":  80.25    # Right longitude
}

# Load env vars for Supabase
load_dotenv()
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
    raise ValueError("Supabase environment variables not set")  # TEAM NOTE: Create .env file with keys

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

# ─────────────────────────────────────────────
# STEP 1 — LOAD NDWI IMAGES (unchanged)
# ─────────────────────────────────────────────

def load_ndwi_images(path_prev, path_curr):
    if not os.path.exists(path_prev):
        raise FileNotFoundError(f"Previous NDWI image not found: {path_prev}")
    if not os.path.exists(path_curr):
        raise FileNotFoundError(f"Current NDWI image not found: {path_curr}")

    img_prev = cv2.imread(path_prev, cv2.IMREAD_GRAYSCALE)
    img_curr = cv2.imread(path_curr, cv2.IMREAD_GRAYSCALE)

    print(f"[✓] Loaded previous image : {path_prev} — shape {img_prev.shape}")
    print(f"[✓] Loaded current image  : {path_curr} — shape {img_curr.shape}")

    return img_prev, img_curr

# ─────────────────────────────────────────────
# STEP 2 — IMAGE DIFFERENCING (unchanged)
# ─────────────────────────────────────────────

def compute_change_map(img_prev, img_curr, threshold=CHANGE_THRESHOLD):
    diff = cv2.absdiff(img_prev, img_curr)
    _, thresh = cv2.threshold(diff, threshold, 255, cv2.THRESH_BINARY)

    changed_pixels = np.count_nonzero(thresh)
    print(f"[✓] Change detection complete — {changed_pixels} changed pixels flagged")

    return diff, thresh

# ─────────────────────────────────────────────
# STEP 3 — EXTRACT ENCROACHMENT ZONES (updated with lat/lon calc)
# ─────────────────────────────────────────────

def extract_encroachment_zones(thresh, img_shape, min_area=MIN_ENCROACHMENT_AREA_PX):
    # TEAM NOTE: Added img_shape param to calculate lat/lon here
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(thresh, connectivity=8)

    zones = []
    height, width = img_shape  # TEAM NOTE: Use image dimensions for geo mapping
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < min_area:
            continue

        x = int(stats[i, cv2.CC_STAT_LEFT])
        y = int(stats[i, cv2.CC_STAT_TOP])
        w = int(stats[i, cv2.CC_STAT_WIDTH])
        h = int(stats[i, cv2.CC_STAT_HEIGHT])
        cx, cy = int(centroids[i][0]), int(centroids[i][1])

        # Approximate lat/lon from pixel centroid (linear interpolation)
        lon = IMG_BOUNDS["west"] + (cx / width) * (IMG_BOUNDS["east"] - IMG_BOUNDS["west"])
        lat = IMG_BOUNDS["north"] - (cy / height) * (IMG_BOUNDS["north"] - IMG_BOUNDS["south"])

        zones.append({
            "id": i,
            "area_px": int(area),
            "bbox": (x, y, w, h),
            "centroid": (cx, cy),
            "latitude": round(lat, 6),   # TEAM NOTE: Real-ish coords for dashboard map
            "longitude": round(lon, 6)
        })

    print(f"[✓] {len(zones)} encroachment zone(s) identified after noise filtering")
    return zones, labels

# ─────────────────────────────────────────────
# STEP 4 — CLASSIFY ENCROACHMENT TYPE (unchanged, but removed broken insert)
# ─────────────────────────────────────────────

def build_classifier():
    X_train = np.array([
        [180, 500, 1.1], [160, 620, 1.3], [190, 480, 0.9],  # Construction
        [200, 300, 3.5], [210, 280, 4.0], [195, 320, 3.2],  # Sand Mining
        [100, 120, 1.8], [110, 100, 2.1], [95, 130, 1.6],   # Waste Dumping
        [140, 900, 1.2], [130, 850, 1.0], [145, 920, 1.4],  # Land Filling
    ])
    y_train = [
        "Construction", "Construction", "Construction",
        "Sand Mining", "Sand Mining", "Sand Mining",
        "Waste Dumping", "Waste Dumping", "Waste Dumping",
        "Land Filling", "Land Filling", "Land Filling",
    ]

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    print("[✓] Random Forest Classifier trained")
    return clf

def classify_zones(zones, diff, clf):
    for zone in zones:
        x, y, w, h = zone["bbox"]
        roi = diff[y:y+h, x:x+w]
        mean_diff = float(np.mean(roi))
        area_px = zone["area_px"]
        aspect_ratio = round(w / h, 2) if h > 0 else 1.0

        features = np.array([[mean_diff, area_px, aspect_ratio]])
        prediction = clf.predict(features)[0]
        probabilities = clf.predict_proba(features)[0]
        confidence = round(float(np.max(probabilities)) * 100, 1)

        zone["type"] = prediction
        zone["confidence"] = confidence

        print(f"  Zone {zone['id']:02d} → {prediction} ({confidence}% confidence) | "
              f"area={area_px}px | aspect={aspect_ratio}")

    return zones

# ─────────────────────────────────────────────
# STEP 5 — GENERATE OUTPUTS (unchanged)
# ─────────────────────────────────────────────

TYPE_COLOURS = {
    "Construction": (0, 0, 255),      # Red
    "Sand Mining": (0, 165, 255),     # Orange
    "Waste Dumping": (0, 255, 255),   # Yellow
    "Land Filling": (255, 0, 0),      # Blue
}

def generate_labelled_map(img_curr, zones, labels):
    output = cv2.cvtColor(img_curr, cv2.COLOR_GRAY2BGR)

    for zone in zones:
        x, y, w, h = zone["bbox"]
        colour = TYPE_COLOURS.get(zone["type"], (255, 255, 255))
        label = f"{zone['type']} ({zone['confidence']}%)"

        cv2.rectangle(output, (x, y), (x+w, y+h), colour, 2)
        cv2.putText(output, label, (x, y - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, colour, 1)

    cv2.imwrite(OUTPUT_LABELLED, output)
    print(f"[✓] Labelled map saved → {OUTPUT_LABELLED}")

def generate_report(zones):
    report = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "total_zones": len(zones),
        "encroachments": []
    }

    for zone in zones:
        report["encroachments"].append({
            "zone_id": zone["id"],
            "type": zone["type"],
            "confidence": zone["confidence"],
            "area_px": zone["area_px"],
            "centroid": zone["centroid"],
            "bbox": zone["bbox"],
            "status": "pending_alert"
        })

    with open(OUTPUT_REPORT, "w") as f:
        json.dump(report, f, indent=2)

    print(f"[✓] Encroachment report saved → {OUTPUT_REPORT}")
    return report

# ─────────────────────────────────────────────
# STEP 6 — SUPABASE INTEGRATION (NEW: Upload + Insert)
# ─────────────────────────────────────────────


def resize_image_for_upload(image_path, max_size_mb=40):
    """Resize image to be under Supabase limit (default 40MB)"""
    img = cv2.imread(image_path)
    if img is None:
        return image_path  # fallback

    # Get current size
    height, width = img.shape[:2]
    print(f"[i] Original image size: {width}x{height}")

    # Calculate resize factor to keep it reasonable (e.g. max 2000px width)
    max_dimension = 2000
    if max(width, height) > max_dimension:
        scale = max_dimension / max(width, height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        img = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_AREA)
        print(f"[✓] Resized image to: {new_width}x{new_height}")

    # Save resized version
    resized_path = "labelled_change_map.png"
    cv2.imwrite(resized_path, img, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"[✓] Saved resized image: {resized_path}")
    return resized_path


def upload_and_insert_to_supabase(zones, labelled_path):
    """
    Resize image first, then upload to Supabase Storage and insert reports.
    """
    """
    TEAM NOTE: New function — uploads labelled map to Supabase Storage,
    then inserts one report per zone. Triggers backend alert via POST /report.
    """
    # Upload image to Storage (bucket: 'encroachment-images')
    # Resize image to avoid "Payload too large" error
    resized_path = resize_image_for_upload(labelled_path)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"ndwi_change_{timestamp}.png"
    bucket = "encroachment-images"   # Make sure this matches exactly

    try:
        with open(resized_path, "rb") as f:
            upload_res = supabase.storage.from_(bucket).upload(
                filename, f, {"content-type": "image/png"}
            )

        public_url = supabase.storage.from_(bucket).get_public_url(filename)
        print(f"[✓] Image uploaded successfully → {public_url}")

        # Insert one report per zone
        for zone in zones:
            data = {
                "id": str(uuid.uuid4()),
                "type": zone["type"].lower().replace(" ", "_"),
                "description": f"Auto-detected {zone['type']} via NDWI — {zone['confidence']}% confidence, {zone['area_px']} px",
                "latitude": zone.get("latitude"),
                "longitude": zone.get("longitude"),
                "image_url": public_url,
                "source": "satellite",
                "status": "pending",
                "escalation_level": 1,
                "reminder_sent": False,
                "confidence": zone["confidence"],
                "area_px": zone["area_px"]
            }

            insert_res = supabase.table("reports").insert(data).execute()

            if insert_res.data:
                print(f"[✓] Inserted satellite report for zone {zone['id']}")
            else:
                print(f"[✗] Insert failed for zone {zone['id']}: {insert_res.error}")

    except Exception as e:
        print(f"[✗] Supabase upload/insert error: {e}")

# ─────────────────────────────────────────────
# MAIN PIPELINE (updated to call new Supabase func)
# ─────────────────────────────────────────────

def main():
    print("\n=== ArenIQ — NDWI Encroachment Detection Pipeline ===\n")

    # Step 1: Load images
    img_prev, img_curr = load_ndwi_images(NDWI_PREVIOUS, NDWI_CURRENT)

    # Step 2: Detect changed regions
    diff, thresh = compute_change_map(img_prev, img_curr)
    cv2.imwrite(OUTPUT_CHANGE_MAP, thresh)
    print(f"[✓] Binary change map saved → {OUTPUT_CHANGE_MAP}")

    # Step 3: Extract distinct encroachment zones (now with lat/lon)
    zones, labels = extract_encroachment_zones(thresh, img_curr.shape)

    if not zones:
        print("\n[✓] No significant encroachments detected in this period.")
        return

    # Step 4: Classify each zone
    clf = build_classifier()
    zones = classify_zones(zones, diff, clf)

    # Step 5: Save visual output and JSON report
    generate_labelled_map(img_curr, zones, labels)
    report = generate_report(zones)

    # Step 6: NEW — Upload to Supabase + insert reports
    upload_and_insert_to_supabase(zones, OUTPUT_LABELLED)

    print(f"\n=== Detection Complete ===")
    print(f"    Zones detected : {report['total_zones']}")
    for z in report["encroachments"]:
        print(f"    [{z['zone_id']}] {z['type']} — {z['confidence']}% confidence")
    print(f"\n    Report → {OUTPUT_REPORT}")
    print(f"    Map    → {OUTPUT_LABELLED}\n")
    print("TEAM NOTE: Reports now live in Supabase — check dashboard for realtime updates!")

if __name__ == "__main__":
    main()