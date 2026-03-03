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
  6. Output a labelled change map and a JSON report for the alert engine

Satellite Source : Sentinel-2 (ESA Copernicus — free & open access)
Band used        : Green (B3) and NIR (B8) for NDWI computation
NDWI Formula     : (Green - NIR) / (Green + NIR)
  - NDWI > 0   → water present
  - NDWI < 0   → land / vegetation
  - A drop in NDWI over time → potential encroachment

Author  : ArenIQ Team
License : MIT
"""

import cv2
import numpy as np
import json
import os
from dotenv import load_dotenv
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from supabase import create_client, Client


# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

# Paths to the pre-computed NDWI grayscale images
# These are generated from Sentinel-2 Band 3 (Green) and Band 8 (NIR)
# using: NDWI = (Green - NIR) / (Green + NIR), then scaled to 0-255
NDWI_PREVIOUS = "ndwi_2023.png"   # Baseline image (older period)
NDWI_CURRENT  = "ndwi_2024.png"   # Current image (latest period)

# Change detection threshold (0–255)
# Pixels with absolute difference > this value are flagged as changed.
# Value 30 is calibrated for Sentinel-2 10m resolution imagery.
# Lower = more sensitive (more false positives)
# Higher = less sensitive (may miss small encroachments)
CHANGE_THRESHOLD = 30

# Minimum contiguous pixel area to count as an encroachment zone
# Filters out noise and isolated changed pixels
MIN_ENCROACHMENT_AREA_PX = 50

# Output files
OUTPUT_CHANGE_MAP  = "water_change_map.png"    # Binary change mask
OUTPUT_LABELLED    = "labelled_change_map.png" # Colour-coded by type
OUTPUT_REPORT      = "encroachment_report.json"


load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
    raise ValueError("Supabase environment variables not set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)


# ─────────────────────────────────────────────
# STEP 1 — LOAD NDWI IMAGES
# ─────────────────────────────────────────────

def load_ndwi_images(path_prev, path_curr):
    """
    Load two NDWI grayscale images for comparison.

    NDWI images are single-channel (grayscale) where:
      - Bright pixels (high value) = water-dominant areas
      - Dark pixels  (low value)   = land / non-water areas

    Args:
        path_prev (str): Path to the previous period NDWI image
        path_curr (str): Path to the current period NDWI image

    Returns:
        tuple: (img_prev, img_curr) as numpy arrays
    """
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
# STEP 2 — IMAGE DIFFERENCING
# ─────────────────────────────────────────────

def compute_change_map(img_prev, img_curr, threshold=CHANGE_THRESHOLD):
    """
    Subtract previous NDWI from current NDWI to find changed regions.

    cv2.absdiff computes absolute pixel-wise difference:
      diff[i,j] = |current[i,j] - previous[i,j]|

    A high diff value at a pixel means that location changed significantly
    between the two time periods — indicating possible encroachment.

    Thresholding converts the continuous diff image into a binary mask:
      - 255 (white) = significant change detected
      - 0   (black) = no significant change

    Args:
        img_prev  : Previous period NDWI image (grayscale numpy array)
        img_curr  : Current period NDWI image (grayscale numpy array)
        threshold : Pixel difference value above which change is flagged

    Returns:
        diff   : Raw difference image
        thresh : Binary change mask
    """
    diff = cv2.absdiff(img_prev, img_curr)

    # THRESH_BINARY: pixels > threshold → 255, else → 0
    _, thresh = cv2.threshold(diff, threshold, 255, cv2.THRESH_BINARY)

    changed_pixels = np.count_nonzero(thresh)
    print(f"[✓] Change detection complete — {changed_pixels} changed pixels flagged")

    return diff, thresh


# ─────────────────────────────────────────────
# STEP 3 — EXTRACT ENCROACHMENT ZONES
# ─────────────────────────────────────────────

def extract_encroachment_zones(thresh, min_area=MIN_ENCROACHMENT_AREA_PX):
    """
    Find distinct contiguous regions of change in the binary mask.

    Uses connected component analysis (cv2.connectedComponentsWithStats)
    to group adjacent changed pixels into labelled blobs.
    Each blob = one potential encroachment site.

    Small blobs below min_area are discarded as noise
    (e.g. sensor artifacts, cloud shadows, minor water level fluctuation).

    Args:
        thresh   : Binary change mask from compute_change_map()
        min_area : Minimum blob size in pixels to keep

    Returns:
        zones (list of dicts): Each zone has:
            - id       : unique zone number
            - area_px  : size in pixels
            - bbox     : bounding box (x, y, w, h)
            - centroid : (cx, cy) centre pixel
    """
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        thresh, connectivity=8
    )

    zones = []
    # Label 0 is the background — skip it
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < min_area:
            continue  # Too small — likely noise

        x = int(stats[i, cv2.CC_STAT_LEFT])
        y = int(stats[i, cv2.CC_STAT_TOP])
        w = int(stats[i, cv2.CC_STAT_WIDTH])
        h = int(stats[i, cv2.CC_STAT_HEIGHT])
        cx, cy = int(centroids[i][0]), int(centroids[i][1])

        zones.append({
            "id"      : i,
            "area_px" : int(area),
            "bbox"    : (x, y, w, h),
            "centroid": (cx, cy)
        })

    print(f"[✓] {len(zones)} encroachment zone(s) identified after noise filtering")
    return zones, labels


# ─────────────────────────────────────────────
# STEP 4 — CLASSIFY ENCROACHMENT TYPE
# ─────────────────────────────────────────────

def build_classifier():
    """
    Build and train a Random Forest Classifier for encroachment type detection.

    Random Forest was chosen because:
      - Handles small, imbalanced training sets well
      - Robust to noisy satellite image features
      - Interpretable feature importance scores
      - Fast inference for per-zone classification

    Features used per zone:
      - mean_diff    : average pixel change intensity (higher = more abrupt change)
      - area_px      : size of the changed region
      - aspect_ratio : width/height ratio (linear features → sand mining / roads)

    Classes:
      0 = Construction / Building
      1 = Sand Mining
      2 = Waste Dumping
      3 = Land Filling

    NOTE: This is trained on synthetic prototype data.
    Replace X_train / y_train with real labeled field data for production use.
    """
    # Synthetic training data: [mean_diff, area_px, aspect_ratio]
    X_train = np.array([
        # Construction (large area, high diff, near-square shape)
        [180, 500, 1.1], [160, 620, 1.3], [190, 480, 0.9],
        # Sand Mining (linear shape, high diff, elongated)
        [200, 300, 3.5], [210, 280, 4.0], [195, 320, 3.2],
        # Waste Dumping (small area, moderate diff, irregular)
        [100, 120, 1.8], [110, 100, 2.1], [95,  130, 1.6],
        # Land Filling (very large area, moderate diff)
        [140, 900, 1.2], [130, 850, 1.0], [145, 920, 1.4],
    ])

    y_train = [
        "Construction", "Construction", "Construction",
        "Sand Mining",  "Sand Mining",  "Sand Mining",
        "Waste Dumping","Waste Dumping","Waste Dumping",
        "Land Filling", "Land Filling", "Land Filling",
    ]

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    print("[✓] Random Forest Classifier trained")
    return clf


def classify_zones(zones, diff, clf):
    """
    Classify each encroachment zone using the trained Random Forest model.

    For each zone we extract simple features from the raw diff image
    and predict the encroachment type.

    Args:
        zones : List of zone dicts from extract_encroachment_zones()
        diff  : Raw pixel difference image
        clf   : Trained RandomForestClassifier

    Returns:
        zones with added 'type' and 'confidence' fields
    """
    for zone in zones:
        x, y, w, h = zone["bbox"]

        # Crop the diff image to this zone's bounding box
        roi = diff[y:y+h, x:x+w]

        mean_diff    = float(np.mean(roi))
        area_px      = zone["area_px"]
        aspect_ratio = round(w / h, 2) if h > 0 else 1.0

        features = np.array([[mean_diff, area_px, aspect_ratio]])
        prediction   = clf.predict(features)[0]
        probabilities = clf.predict_proba(features)[0]
        confidence   = round(float(np.max(probabilities)) * 100, 1)

        zone["type"]       = prediction
        zone["confidence"] = confidence
        # After classification
        supabase.table("reports").insert({
            "type": classification,           # e.g. "construction"
            "description": "Auto-detected via satellite",
            "latitude": centroid_lat,
            "longitude": centroid_lon,
            "image_url": uploaded_ndwi_diff_url,  # if you upload diff image to storage
            "source": "satellite",
            "status": "pending"
        }).execute()

        print(f"  Zone {zone['id']:02d} → {prediction} ({confidence}% confidence) | "
              f"area={area_px}px | aspect={aspect_ratio}")

    return zones


# ─────────────────────────────────────────────
# STEP 5 — GENERATE OUTPUTS
# ─────────────────────────────────────────────

# Colour map for each encroachment type (BGR format for OpenCV)
TYPE_COLOURS = {
    "Construction" : (0,   0,   255),  # Red
    "Sand Mining"  : (0,   165, 255),  # Orange
    "Waste Dumping": (0,   255, 255),  # Yellow
    "Land Filling" : (255, 0,   0),    # Blue
}

def generate_labelled_map(img_curr, zones, labels):
    """
    Draw colour-coded bounding boxes on the current image for each zone.

    Each encroachment type gets a distinct colour so authorities can
    quickly identify the nature of the issue at a glance.
    """
    output = cv2.cvtColor(img_curr, cv2.COLOR_GRAY2BGR)

    for zone in zones:
        x, y, w, h = zone["bbox"]
        colour = TYPE_COLOURS.get(zone["type"], (255, 255, 255))
        label  = f"{zone['type']} ({zone['confidence']}%)"

        cv2.rectangle(output, (x, y), (x+w, y+h), colour, 2)
        cv2.putText(output, label, (x, y - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, colour, 1)

    cv2.imwrite(OUTPUT_LABELLED, output)
    print(f"[✓] Labelled map saved → {OUTPUT_LABELLED}")


def generate_report(zones):
    """
    Save a structured JSON report for consumption by the Node.js alert engine.

    The backend reads this file, maps each zone's centroid to the responsible
    authority (by GPS boundary lookup), and dispatches push alerts via Ntfy.sh.
    """
    report = {
        "generated_at"       : datetime.utcnow().isoformat() + "Z",
        "total_zones"        : len(zones),
        "encroachments"      : []
    }

    for zone in zones:
        report["encroachments"].append({
            "zone_id"   : zone["id"],
            "type"      : zone["type"],
            "confidence": zone["confidence"],
            "area_px"   : zone["area_px"],
            "centroid"  : zone["centroid"],
            "bbox"      : zone["bbox"],
            "status"    : "pending_alert"
        })

    with open(OUTPUT_REPORT, "w") as f:
        json.dump(report, f, indent=2)

    print(f"[✓] Encroachment report saved → {OUTPUT_REPORT}")
    return report


# ─────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────

def main():
    print("\n=== ArenIQ — NDWI Encroachment Detection Pipeline ===\n")

    # Step 1: Load images
    img_prev, img_curr = load_ndwi_images(NDWI_PREVIOUS, NDWI_CURRENT)

    # Step 2: Detect changed regions
    diff, thresh = compute_change_map(img_prev, img_curr)
    cv2.imwrite(OUTPUT_CHANGE_MAP, thresh)
    print(f"[✓] Binary change map saved → {OUTPUT_CHANGE_MAP}")

    # Step 3: Extract distinct encroachment zones
    zones, labels = extract_encroachment_zones(thresh)

    if not zones:
        print("\n[✓] No significant encroachments detected in this period.")
        return

    # Step 4: Classify each zone
    clf = build_classifier()
    zones = classify_zones(zones, diff, clf)

    # Step 5: Save visual output and JSON report
    generate_labelled_map(img_curr, zones, labels)
    report = generate_report(zones)

    print(f"\n=== Detection Complete ===")
    print(f"    Zones detected : {report['total_zones']}")
    for z in report["encroachments"]:
        print(f"    [{z['zone_id']}] {z['type']} — {z['confidence']}% confidence")
    print(f"\n    Report → {OUTPUT_REPORT}")
    print(f"    Map    → {OUTPUT_LABELLED}\n")


if __name__ == "__main__":
    main()