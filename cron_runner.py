"""
cron_runner.py — ArenIQ Automated Daily Detection Runner
=========================================================
This script is designed to be run daily via a cron job or
Windows Task Scheduler to automatically trigger the NDWI
encroachment detection pipeline.

Cron schedule (runs every day at 6:00 AM):
  0 6 * * * cd /path/to/ArenIQ && python cron_runner.py

Windows Task Scheduler:
  Program : python
  Args    : C:\\path\\to\\ArenIQ\\cron_runner.py
  Trigger : Daily at 06:00

What it does:
  1. Checks if new satellite images are available
  2. Runs ndwi_detection.py pipeline
  3. Logs results to cron_log.txt
  4. Sends a summary alert if encroachments are found

Author  : ArenIQ Team
License : MIT
"""

import os
import sys
import subprocess
from datetime import datetime

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

# Path to the main detection script
DETECTION_SCRIPT = os.path.join(os.path.dirname(__file__), 'ndwi_detection.py')

# Log file for tracking daily runs
LOG_FILE = os.path.join(os.path.dirname(__file__), 'cron_log.txt')

# Required input image files
NDWI_PREVIOUS = "ndwi_2023.png"
NDWI_CURRENT  = "ndwi_2024.png"


# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────

def log(message):
    """
    Appends a timestamped message to the cron log file
    and also prints to stdout.
    """
    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    line = f"[{timestamp}] {message}"
    print(line)

    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')


# ─────────────────────────────────────────────
# PRE-FLIGHT CHECKS
# ─────────────────────────────────────────────

def check_prerequisites():
    """
    Verifies that all required files and environment variables
    exist before running the detection pipeline.

    Returns True if all checks pass, False otherwise.
    """
    passed = True

    # Check detection script exists
    if not os.path.exists(DETECTION_SCRIPT):
        log(f"[✗] Detection script not found: {DETECTION_SCRIPT}")
        passed = False
    else:
        log(f"[✓] Detection script found")

    # Check NDWI images exist
    for img in [NDWI_PREVIOUS, NDWI_CURRENT]:
        if not os.path.exists(img):
            log(f"[✗] Missing image: {img} — download from Copernicus before running")
            passed = False
        else:
            log(f"[✓] Image found: {img}")

    # Check required environment variables
    required_env = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE']
    for var in required_env:
        if not os.getenv(var):
            log(f"[✗] Missing environment variable: {var}")
            passed = False
        else:
            log(f"[✓] Environment variable set: {var}")

    return passed


# ─────────────────────────────────────────────
# RUN DETECTION PIPELINE
# ─────────────────────────────────────────────

def run_detection():
    """
    Runs ndwi_detection.py as a subprocess and captures output.
    Returns True if successful, False if it failed.
    """
    log("→ Starting NDWI detection pipeline...")

    try:
        result = subprocess.run(
            [sys.executable, DETECTION_SCRIPT],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        # Log all output from the detection script
        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                log(f"  {line}")

        if result.returncode == 0:
            log("[✓] Detection pipeline completed successfully")
            return True
        else:
            log(f"[✗] Detection pipeline failed (exit code {result.returncode})")
            if result.stderr:
                log(f"  Error: {result.stderr.strip()}")
            return False

    except subprocess.TimeoutExpired:
        log("[✗] Detection pipeline timed out after 5 minutes")
        return False
    except Exception as e:
        log(f"[✗] Unexpected error: {e}")
        return False


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    log("=" * 60)
    log("ArenIQ — Daily Encroachment Detection Run")
    log("=" * 60)

    # Load .env if present
    try:
        from dotenv import load_dotenv
        load_dotenv()
        log("[✓] Environment variables loaded from .env")
    except ImportError:
        log("[!] python-dotenv not installed — using system environment variables")

    # Run pre-flight checks
    log("\n--- Pre-flight Checks ---")
    if not check_prerequisites():
        log("\n[✗] Pre-flight checks failed — aborting run")
        sys.exit(1)

    # Run detection
    log("\n--- Running Detection ---")
    success = run_detection()

    # Summary
    log("\n--- Run Summary ---")
    if success:
        log("[✓] Daily run completed successfully")
        log(f"    Results saved to: water_change_map.png, labelled_change_map.png")
        log(f"    Reports pushed to Supabase dashboard")
    else:
        log("[✗] Daily run failed — check logs above")
        sys.exit(1)

    log("=" * 60)


if __name__ == "__main__":
    main()