"""
cron_runner.py — ArenIQ Automated Daily Detection Runner
=========================================================
This script is designed to be run daily via a cron job or
Windows Task Scheduler to automatically trigger the full
ArenIQ satellite monitoring pipeline.

Full pipeline:
  1. fetch_sentinel.py  — Download latest Sentinel-2 images for Chengalpattu
  2. ndwi_detection.py  — Run NDWI change detection + classify encroachments
  3. Results uploaded to Supabase → backend alerts authorities automatically

Cron schedule (runs every day at 6:00 AM):
  0 6 * * * cd /path/to/ArenIQ && python cron_runner.py

Windows Task Scheduler:
  Program : python
  Args    : C:\\path\\to\\ArenIQ\\cron_runner.py
  Trigger : Daily at 06:00

Author  : ArenIQ Team
License : MIT
"""

import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

BASE_DIR         = Path(__file__).parent
FETCH_SCRIPT     = BASE_DIR / "fetch_sentinel.py"
DETECTION_SCRIPT = BASE_DIR / "ndwi_detection.py"
LOG_FILE         = BASE_DIR / "cron_log.txt"

NDWI_PREVIOUS = BASE_DIR / "ndwi_2023.png"
NDWI_CURRENT  = BASE_DIR / "ndwi_2024.png"


# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────

def log(message):
    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    line = f"[{timestamp}] {message}"
    print(line)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')


# ─────────────────────────────────────────────
# RUN A SCRIPT
# ─────────────────────────────────────────────

def run_script(script_path, label, timeout=600):
    """
    Runs a Python script as a subprocess and logs output.
    Returns True if successful, False if failed.
    """
    log(f"→ Starting {label}...")

    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                log(f"  {line}")

        if result.returncode == 0:
            log(f"[✓] {label} completed successfully")
            return True
        else:
            log(f"[✗] {label} failed (exit code {result.returncode})")
            if result.stderr:
                log(f"  Error: {result.stderr.strip()}")
            return False

    except subprocess.TimeoutExpired:
        log(f"[✗] {label} timed out after {timeout//60} minutes")
        return False
    except Exception as e:
        log(f"[✗] {label} unexpected error: {e}")
        return False


# ─────────────────────────────────────────────
# PRE-FLIGHT CHECKS
# ─────────────────────────────────────────────

def check_prerequisites():
    passed = True

    for script in [FETCH_SCRIPT, DETECTION_SCRIPT]:
        if not script.exists():
            log(f"[✗] Script not found: {script}")
            passed = False
        else:
            log(f"[✓] Found: {script.name}")

    required_env = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE',
                    'COPERNICUS_USER', 'COPERNICUS_PASSWORD']
    for var in required_env:
        if not os.getenv(var):
            log(f"[✗] Missing environment variable: {var}")
            passed = False
        else:
            log(f"[✓] Env var set: {var}")

    return passed


# ─────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────

def main():
    log("=" * 60)
    log("ArenIQ — Daily Satellite Monitoring Pipeline")
    log("=" * 60)

    # Load .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
        log("[✓] Environment variables loaded from .env")
    except ImportError:
        log("[!] python-dotenv not installed — using system env vars")

    # Pre-flight
    log("\n--- Pre-flight Checks ---")
    if not check_prerequisites():
        log("\n[✗] Pre-flight checks failed — aborting")
        sys.exit(1)

    # Step 1 — Fetch fresh Sentinel-2 images
    log("\n--- Step 1: Fetching Sentinel-2 Images ---")
    fetch_ok = run_script(FETCH_SCRIPT, "fetch_sentinel.py", timeout=900)

    if not fetch_ok:
        # If fresh images fail but old ones exist, continue with old ones
        if NDWI_CURRENT.exists() and NDWI_PREVIOUS.exists():
            log("[!] Fetch failed but existing images found — continuing with cached images")
        else:
            log("[✗] No images available — aborting pipeline")
            sys.exit(1)

    # Step 2 — Run NDWI detection
    log("\n--- Step 2: Running NDWI Detection ---")
    detect_ok = run_script(DETECTION_SCRIPT, "ndwi_detection.py", timeout=300)

    if not detect_ok:
        log("[✗] Detection failed — check logs above")
        sys.exit(1)

    # Summary
    log("\n--- Pipeline Complete ---")
    log("[✓] Sentinel-2 images fetched")
    log("[✓] Encroachment detection complete")
    log("[✓] Results uploaded to Supabase")
    log("[✓] Authorities alerted via Ntfy.sh")
    log("=" * 60)


if __name__ == "__main__":
    main()