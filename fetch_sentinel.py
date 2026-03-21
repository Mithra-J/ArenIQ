"""
fetch_sentinel.py — ArenIQ Automated Sentinel-2 Image Fetcher
=============================================================
Downloads latest Sentinel-2 images for Chengalpattu District
using the Copernicus Data Space Ecosystem API (CDSE).

Author  : ArenIQ Team
License : MIT
"""

import os
import cv2
import zipfile
import requests
import numpy as np
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

COPERNICUS_USER     = os.getenv("COPERNICUS_USER")
COPERNICUS_PASSWORD = os.getenv("COPERNICUS_PASSWORD")

# Chengalpattu District bounding box (WGS84)
BBOX = {
    "north": 12.9,
    "south": 12.1,
    "west" : 79.6,
    "east" : 80.3,
}

MAX_CLOUD_COVER = 30
DOWNLOAD_DIR    = Path("sentinel_downloads")
NDWI_CURRENT    = "ndwi_2024.png"
NDWI_PREVIOUS   = "ndwi_2023.png"

# Copernicus Data Space API endpoints
AUTH_URL      = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
SEARCH_URL    = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
DOWNLOAD_BASE = "https://zipper.dataspace.copernicus.eu/odata/v1/Products"


# ─────────────────────────────────────────────
# AUTHENTICATION
# ─────────────────────────────────────────────

def get_access_token():
    """
    Gets OAuth2 access token from Copernicus Data Space.
    """
    if not COPERNICUS_USER or not COPERNICUS_PASSWORD:
        raise ValueError(
            "Copernicus credentials missing!\n"
            "Add to .env:\n"
            "  COPERNICUS_USER=your-email\n"
            "  COPERNICUS_PASSWORD=your-password"
        )

    print(f"[→] Authenticating as {COPERNICUS_USER}...")

    response = requests.post(AUTH_URL, data={
        "grant_type": "password",
        "username"  : COPERNICUS_USER,
        "password"  : COPERNICUS_PASSWORD,
        "client_id" : "cdse-public",
    })

    if response.status_code != 200:
        raise Exception(f"Authentication failed: {response.status_code} {response.text}")

    token = response.json()["access_token"]
    print("[✓] Authentication successful")
    return token


# ─────────────────────────────────────────────
# SEARCH FOR IMAGES
# ─────────────────────────────────────────────

def search_images(date_from, date_to):
    """
    Searches for Sentinel-2 images over Chengalpattu using OData API.
    """
    polygon = (
        f"POLYGON(("
        f"{BBOX['west']} {BBOX['south']},"
        f"{BBOX['east']} {BBOX['south']},"
        f"{BBOX['east']} {BBOX['north']},"
        f"{BBOX['west']} {BBOX['north']},"
        f"{BBOX['west']} {BBOX['south']}"
        f"))"
    )

    date_from_str = date_from.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    date_to_str   = date_to.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    print(f"[→] Searching {date_from.date()} to {date_to.date()}...")

    params = {
        "$filter": (
            f"Collection/Name eq 'SENTINEL-2' and "
            f"ContentDate/Start gt {date_from_str} and "
            f"ContentDate/Start lt {date_to_str} and "
            f"OData.CSC.Intersects(area=geography'SRID=4326;{polygon}')"
        ),
        "$top": "5",
        "$orderby": "ContentDate/Start desc",
    }

    response = requests.get(SEARCH_URL, params=params)

    if response.status_code != 200:
        print(f"[✗] Search failed: {response.status_code}")
        print(f"    Error: {response.text}")
        return []

    products = response.json().get("value", [])
    print(f"[✓] Found {len(products)} image(s)")
    return products


# ─────────────────────────────────────────────
# DOWNLOAD IMAGE
# ─────────────────────────────────────────────

def download_image(product, token, output_dir):
    """
    Downloads a Sentinel-2 product zip file using OAuth2 token.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    product_id   = product["Id"]
    product_name = product["Name"]
    output_path  = output_dir / f"{product_name}.zip"

    if output_path.exists():
        print(f"[✓] Already downloaded: {product_name}")
        return output_path

    print(f"[→] Downloading {product_name}...")
    print(f"    This may take several minutes (files are ~800MB)...")

    url = f"{DOWNLOAD_BASE}({product_id})/$value"

    with requests.get(
        url,
        headers={"Authorization": f"Bearer {token}"},
        stream=True,
        timeout=600
    ) as response:
        if response.status_code != 200:
            print(f"[✗] Download failed: {response.status_code}")
            return None

        total      = int(response.headers.get("content-length", 0))
        downloaded = 0

        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=65536):
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = (downloaded / total) * 100
                    mb  = downloaded / (1024 * 1024)
                    print(f"\r    {pct:.1f}% ({mb:.0f} MB)", end="", flush=True)

    print(f"\n[✓] Downloaded → {output_path}")
    return output_path


# ─────────────────────────────────────────────
# FIND BANDS IN ZIP
# ─────────────────────────────────────────────

def find_bands(zip_file):
    """
    Finds B03 (Green) and B08 (NIR) band files inside a Sentinel-2 zip.
    Supports both L2A (10m) and L1C formats.
    """
    all_files = zip_file.namelist()
    b03_file = b08_file = None

    # Priority 1: L2A 10m bands
    for name in all_files:
        if "B03_10m.jp2" in name:
            b03_file = name
        elif "B08_10m.jp2" in name:
            b08_file = name

    # Priority 2: L1C or other resolution bands
    if not b03_file or not b08_file:
        for name in all_files:
            if name.endswith(".jp2"):
                if "B03" in name and not b03_file:
                    b03_file = name
                elif "B08" in name and not b08_file:
                    b08_file = name

    # Priority 3: Any jp2 with band reference
    if not b03_file or not b08_file:
        for name in all_files:
            if name.endswith(".jp2"):
                if "_B03" in name and not b03_file:
                    b03_file = name
                elif "_B08" in name and not b08_file:
                    b08_file = name

    return b03_file, b08_file


# ─────────────────────────────────────────────
# EXTRACT BANDS + COMPUTE NDWI
# ─────────────────────────────────────────────

def compute_ndwi_from_zip(zip_path, output_path):
    """
    Extracts B03 (Green) and B08 (NIR) bands from the downloaded zip,
    computes NDWI = (Green - NIR) / (Green + NIR),
    and saves as grayscale PNG for ndwi_detection.py.

    NDWI > 0 = water, NDWI < 0 = land/vegetation
    Scaled to 0-255: bright = water, dark = land
    """
    try:
        import rasterio
        from rasterio.enums import Resampling
    except ImportError:
        raise ImportError("Run: pip install rasterio")

    print(f"[→] Extracting bands from zip...")

    with zipfile.ZipFile(zip_path, 'r') as z:
        b03_file, b08_file = find_bands(z)

        if not b03_file or not b08_file:
            print("[✗] Could not find B03/B08 bands in zip")
            print(f"    Available jp2 files: {[n for n in z.namelist() if n.endswith('.jp2')][:5]}")
            return None

        print(f"[✓] Found B03: {b03_file.split('/')[-1]}")
        print(f"[✓] Found B08: {b08_file.split('/')[-1]}")

        z.extract(b03_file, zip_path.parent)
        z.extract(b08_file, zip_path.parent)

    b03_path = zip_path.parent / b03_file
    b08_path = zip_path.parent / b08_file

    # Read Green band
    with rasterio.open(b03_path) as src:
        green = src.read(1).astype(np.float32)

    # Read NIR band (resample to match green resolution if needed)
    with rasterio.open(b08_path) as src:
        nir = src.read(
            1,
            out_shape=(green.shape[0], green.shape[1]),
            resampling=Resampling.bilinear
        ).astype(np.float32)

    # Compute NDWI = (Green - NIR) / (Green + NIR)
    epsilon  = 1e-10
    ndwi     = (green - nir) / (green + nir + epsilon)

    # Scale [-1, 1] → [0, 255] grayscale
    ndwi_scaled = ((ndwi + 1) / 2 * 255).astype(np.uint8)

    cv2.imwrite(str(output_path), ndwi_scaled)

    water_pct = (np.sum(ndwi > 0) / ndwi.size) * 100
    print(f"[✓] NDWI saved → {output_path}")
    print(f"    Water coverage: {water_pct:.1f}%")

    return ndwi_scaled


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def fetch_ndwi_pair():
    print("\n=== ArenIQ — Sentinel-2 Fetcher (Copernicus CDSE API) ===\n")

    token = get_access_token()
    today = datetime.now(timezone.utc)

    pairs = [
        ("current",  today - timedelta(days=30),       today,                       NDWI_CURRENT),
        ("previous", today - timedelta(days=30 + 365), today - timedelta(days=365), NDWI_PREVIOUS),
    ]

    results = {}

    for label, date_from, date_to, output_file in pairs:
        print(f"\n--- Fetching {label.upper()} image ---")

        products = search_images(date_from, date_to)
        if not products:
            print(f"[!] No images found for {label}")
            continue

        best = products[0]
        print(f"    Product: {best['Name']}")

        zip_path = download_image(best, token, DOWNLOAD_DIR / label)
        if zip_path:
            ndwi = compute_ndwi_from_zip(zip_path, Path(output_file))
            if ndwi is not None:
                results[label] = output_file

    print("\n=== Summary ===")
    if len(results) == 2:
        print(f"[✓] Both NDWI images ready!")
        print(f"    {NDWI_CURRENT}  — current period")
        print(f"    {NDWI_PREVIOUS} — previous period")
        print(f"\n    Next step: python ndwi_detection.py")
        return True
    else:
        print(f"[!] {len(results)}/2 images fetched")
        return False


if __name__ == "__main__":
    fetch_ndwi_pair()