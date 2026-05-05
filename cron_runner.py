"""
cron_runner.py — ArenIQ Automated Daily Detection Runner
=========================================================
Full pipeline — runs every day at 8:00 AM:
  1. fetch_sentinel.py  — Download latest Sentinel-2 images
  2. ndwi_detection.py  — NDWI change detection + classify encroachments
  3. daily_report.py    — Send admin summary email + Ntfy push

Cron (Linux/Mac):
  0 8 * * * cd /path/to/ArenIQ && python cron_runner.py >> cron_log.txt 2>&1

Windows Task Scheduler:
  Program : python
  Args    : C:\\path\\to\\ArenIQ\\cron_runner.py
  Start in: C:\\path\\to\\ArenIQ
  Trigger : Daily at 08:00

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
REPORT_SCRIPT    = BASE_DIR / "daily_report.py"    # NEW
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

    for script in [FETCH_SCRIPT, DETECTION_SCRIPT, REPORT_SCRIPT]:
        if not script.exists():
            log(f"[✗] Script not found: {script}")
            passed = False
        else:
            log(f"[✓] Found: {script.name}")

    required_env = [
        'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE',
        'COPERNICUS_USER', 'COPERNICUS_PASSWORD',
    ]
    optional_env = ['SMTP_USER', 'SMTP_PASSWORD', 'ADMIN_EMAIL']

    for var in required_env:
        if not os.getenv(var):
            log(f"[✗] Missing required env: {var}")
            passed = False
        else:
            log(f"[✓] Env set: {var}")

    for var in optional_env:
        if not os.getenv(var):
            log(f"[!] Optional env not set (email will be skipped): {var}")
        else:
            log(f"[✓] Env set: {var}")

    return passed


# ─────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────

def main():
    log("=" * 60)
    log("ArenIQ — Daily Pipeline (8 AM Run)")
    log("=" * 60)

    try:
        from dotenv import load_dotenv
        load_dotenv()
        log("[✓] .env loaded")
    except ImportError:
        log("[!] python-dotenv not installed — using system env vars")

    log("\n--- Pre-flight Checks ---")
    if not check_prerequisites():
        log("\n[✗] Pre-flight failed — aborting")
        sys.exit(1)

    # ── Step 1: Fetch Sentinel-2 images ──
    log("\n--- Step 1: Fetching Sentinel-2 Images ---")
    fetch_ok = run_script(FETCH_SCRIPT, "fetch_sentinel.py", timeout=900)

    if not fetch_ok:
        if NDWI_CURRENT.exists() and NDWI_PREVIOUS.exists():
            log("[!] Fetch failed — continuing with cached images")
        else:
            log("[✗] No images available — aborting")
            # Still send report even if detection failed (admin should know)
            log("\n--- Step 3: Sending Daily Report (detection skipped) ---")
            run_script(REPORT_SCRIPT, "daily_report.py", timeout=60)
            sys.exit(1)

    # ── Step 2: Run NDWI detection ──
    log("\n--- Step 2: Running NDWI Detection ---")
    detect_ok = run_script(DETECTION_SCRIPT, "ndwi_detection.py", timeout=300)

    if not detect_ok:
        log("[✗] Detection failed — sending report anyway so admin is aware")

    # ── Step 3: Send daily admin report ── (always runs)
    log("\n--- Step 3: Sending Daily Admin Report ---")
    run_script(REPORT_SCRIPT, "daily_report.py", timeout=60)

    # ── Summary ──
    log("\n--- Pipeline Complete ---")
    log("[✓] Sentinel-2 images fetched")
    log(f"[{'✓' if detect_ok else '✗'}] Encroachment detection")
    log("[✓] Daily admin report sent")
    log("[✓] Authorities alerted via Ntfy.sh")
    log("=" * 60)


if __name__ == "__main__":
    main()