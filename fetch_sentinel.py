"""
fetch_sentinel.py — ArenIQ Automated Sentinel-2 Image Fetcher
=============================================================
Automatically downloads the latest Sentinel-2 satellite images
for Chengalpattu District from the Copernicus Data Space Ecosystem.

This script is called by cron_runner.py before running ndwi_detection.py
so the pipeline always uses fresh, real satellite data.

How it works:
  1. Connects to Copernicus Data Space API using your free account
  2. Searches for latest Sentinel-2 L2A images over Chengalpattu
  3. Downloads the Green (B03) and NIR (B08) bands
  4. Computes NDWI = (B03 - B08) / (B03 + B08)
  5. Saves as grayscale PNGs for ndwi_detection.py to process

Requirements:
  pip install sentinelsat rasterio numpy opencv-python python-dotenv

Copernicus Account:
  Register free at: https://dataspace.copernicus.eu
  Add credentials to .env:
    COPERNICUS_USER=your-email
    COPERNICUS_PASSWORD=your-password

Author  : ArenIQ Team
License : MIT
"""

import os
import cv2
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

# Copernicus credentials from .env
COPERNICUS_USER     = os.getenv("COPERNICUS_USER")
COPERNICUS_PASSWORD = os.getenv("COPERNICUS_PASSWORD")

# Chengalpattu District bounding box (WGS84)
# Format: (min_lon, min_lat, max_lon, max_lat)
CHENGALPATTU_BBOX = (79.6, 12.1, 80.3, 12.9)

# Sentinel-2 settings
PLATFORM        = "SENTINEL-2"
PRODUCT_TYPE    = "S2MSI2A"       # Level 2A = surface reflectance (best for NDWI)
MAX_CLOUD_COVER = 30              # Skip images with >30% cloud cover
DOWNLOAD_DIR    = Path("sentinel_downloads")  # Temp folder for raw downloads

# Output NDWI images (fed into ndwi_detection.py)
NDWI_CURRENT  = "ndwi_2024.png"   # Latest image
NDWI_PREVIOUS = "ndwi_2023.png"   # One year earlier for comparison

# ─────────────────────────────────────────────
# CONNECT TO COPERNICUS
# ─────────────────────────────────────────────

def connect_to_copernicus():
    """
    Connects to the Copernicus Data Space Ecosystem API.
    Uses sentinelsat library (open source, Apache 2.0).

    Returns:
        SentinelAPI instance
    """
    try:
        from sentinelsat import SentinelAPI
    except ImportError:
        raise ImportError(
            "sentinelsat not installed. Run: pip install sentinelsat"
        )

    if not COPERNICUS_USER or not COPERNICUS_PASSWORD:
        raise ValueError(
            "Copernicus credentials missing. Add to .env:\n"
            "  COPERNICUS_USER=your-email\n"
            "  COPERNICUS_PASSWORD=your-password"
        )

    print(f"[→] Connecting to Copernicus as {COPERNICUS_USER}...")

    api = SentinelAPI(
        COPERNICUS_USER,
        COPERNICUS_PASSWORD,
        "https://apihub.copernicus.eu/apihub"
    )

    print("[✓] Connected to Copernicus Data Space")
    return api


# ─────────────────────────────────────────────
# SEARCH FOR IMAGES
# ─────────────────────────────────────────────

def search_sentinel_images(api, date_from, date_to):
    """
    Searches for Sentinel-2 L2A images over Chengalpattu District
    within the given date range.

    Args:
        api       : SentinelAPI instance
        date_from : Start date (datetime)
        date_to   : End date (datetime)

    Returns:
        GeoDataFrame of matching products, sorted by cloud cover
    """
    from sentinelsat import geojson_to_wkt
    from shapely.geometry import box

    # Create bounding box polygon for Chengalpattu
    footprint = geojson_to_wkt(
        box(*CHENGALPATTU_BBOX).__geo_interface__
    )

    print(f"[→] Searching for images from {date_from.date()} to {date_to.date()}...")

    products = api.query(
        footprint,
        date=(date_from, date_to),
        platformname=PLATFORM,
        producttype=PRODUCT_TYPE,
        cloudcoverpercentage=(0, MAX_CLOUD_COVER),
    )

    if not products:
        print(f"[!] No images found for this date range with <{MAX_CLOUD_COVER}% cloud cover")
        return None

    # Convert to dataframe and sort by cloud cover (least cloudy first)
    products_df = api.to_dataframe(products)
    products_df = products_df.sort_values("cloudcoverpercentage")

    print(f"[✓] Found {len(products_df)} image(s) — using least cloudy one "
          f"({products_df.iloc[0]['cloudcoverpercentage']:.1f}% cloud cover)")

    return products_df


# ─────────────────────────────────────────────
# DOWNLOAD IMAGE
# ─────────────────────────────────────────────

def download_image(api, product_id, output_dir):
    """
    Downloads a single Sentinel-2 product to the output directory.

    Args:
        api        : SentinelAPI instance
        product_id : UUID of the product to download
        output_dir : Path to save the downloaded files

    Returns:
        Path to the downloaded .SAFE folder
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"[→] Downloading image {product_id}...")
    print(f"    This may take a few minutes depending on your connection.")

    api.download(product_id, directory_path=output_dir)

    # Find the .SAFE folder that was just downloaded
    safe_dirs = list(output_dir.glob("*.SAFE"))
    if not safe_dirs:
        raise FileNotFoundError("Download succeeded but .SAFE folder not found")

    safe_path = safe_dirs[-1]  # Most recently modified
    print(f"[✓] Downloaded: {safe_path.name}")
    return safe_path


# ─────────────────────────────────────────────
# EXTRACT BANDS + COMPUTE NDWI
# ─────────────────────────────────────────────

def compute_ndwi_from_safe(safe_path, output_path):
    """
    Extracts Green (B03) and NIR (B08) bands from a Sentinel-2 .SAFE folder,
    computes NDWI, and saves as a grayscale PNG.

    NDWI = (Green - NIR) / (Green + NIR)
      - Values near +1 = water
      - Values near -1 = land/vegetation
    Scaled to 0-255 grayscale: bright = water, dark = land

    Args:
        safe_path   : Path to the .SAFE folder
        output_path : Where to save the NDWI grayscale PNG
    """
    try:
        import rasterio
        from rasterio.enums import Resampling
    except ImportError:
        raise ImportError("rasterio not installed. Run: pip install rasterio")

    # Find B03 (Green) and B08 (NIR) band files inside .SAFE
    # Sentinel-2 L2A stores 10m bands in GRANULE/.../IMG_DATA/R10m/
    band_paths = {
        "B03": None,
        "B08": None,
    }

    for band_name in band_paths:
        matches = list(safe_path.rglob(f"*_{band_name}_10m.jp2"))
        if matches:
            band_paths[band_name] = matches[0]
        else:
            # Fallback: search without resolution suffix
            matches = list(safe_path.rglob(f"*{band_name}*.jp2"))
            if matches:
                band_paths[band_name] = matches[0]

    if not band_paths["B03"] or not band_paths["B08"]:
        raise FileNotFoundError(
            f"Could not find B03/B08 bands in {safe_path}. "
            f"Found: {list(safe_path.rglob('*.jp2'))}"
        )

    print(f"[✓] Found B03 (Green): {band_paths['B03'].name}")
    print(f"[✓] Found B08 (NIR)  : {band_paths['B08'].name}")

    # Read both bands
    with rasterio.open(band_paths["B03"]) as src:
        green = src.read(1).astype(np.float32)

    with rasterio.open(band_paths["B08"]) as src:
        nir = src.read(
            1,
            out_shape=(green.shape[0], green.shape[1]),
            resampling=Resampling.bilinear
        ).astype(np.float32)

    # Compute NDWI: (Green - NIR) / (Green + NIR)
    # Add small epsilon to avoid division by zero
    epsilon = 1e-10
    ndwi = (green - nir) / (green + nir + epsilon)

    # Scale from [-1, 1] to [0, 255] for grayscale PNG
    # NDWI = 1.0 → 255 (bright = water)
    # NDWI = -1.0 → 0   (dark = land)
    ndwi_scaled = ((ndwi + 1) / 2 * 255).astype(np.uint8)

    # Save as grayscale PNG
    cv2.imwrite(str(output_path), ndwi_scaled)
    print(f"[✓] NDWI image saved → {output_path}")

    # Print water coverage stats
    water_pixels = np.sum(ndwi > 0)
    total_pixels = ndwi.size
    water_pct = (water_pixels / total_pixels) * 100
    print(f"    Water coverage: {water_pct:.1f}% of image")

    return ndwi_scaled


# ─────────────────────────────────────────────
# MAIN — FETCH BOTH IMAGES
# ─────────────────────────────────────────────

def fetch_ndwi_pair():
    """
    Downloads two Sentinel-2 images for Chengalpattu:
      1. Current  — latest available image (within last 30 days)
      2. Previous — same time period one year ago

    Saves them as ndwi_2024.png and ndwi_2023.png for ndwi_detection.py.
    """
    print("\n=== ArenIQ — Sentinel-2 Image Fetcher ===\n")

    api = connect_to_copernicus()

    today    = datetime.utcnow()
    one_year = timedelta(days=365)

    # Date ranges
    current_from  = today - timedelta(days=30)
    current_to    = today
    previous_from = current_from - one_year
    previous_to   = current_to  - one_year

    results = {}

    for label, date_from, date_to, output_file in [
        ("current",  current_from,  current_to,  NDWI_CURRENT),
        ("previous", previous_from, previous_to, NDWI_PREVIOUS),
    ]:
        print(f"\n--- Fetching {label.upper()} image ---")

        products_df = search_sentinel_images(api, date_from, date_to)

        if products_df is None:
            print(f"[!] Skipping {label} image — no suitable images found")
            continue

        # Use the least cloudy product
        best_product = products_df.iloc[0]
        product_id   = best_product.name

        # Download
        safe_path = download_image(api, product_id, DOWNLOAD_DIR / label)

        # Compute NDWI and save
        compute_ndwi_from_safe(safe_path, Path(output_file))
        results[label] = output_file

    # Summary
    print("\n=== Fetch Complete ===")
    if "current" in results and "previous" in results:
        print(f"[✓] Both images ready:")
        print(f"    Current  → {NDWI_CURRENT}")
        print(f"    Previous → {NDWI_PREVIOUS}")
        print(f"\n    Run ndwi_detection.py to detect encroachments!")
        return True
    else:
        print("[!] One or both images could not be downloaded.")
        print("    Check your Copernicus credentials and try again.")
        return False


if __name__ == "__main__":
    fetch_ndwi_pair()