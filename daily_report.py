"""
daily_report.py — ArenIQ Daily Admin Summary Report
====================================================
Sends a daily digest to the admin at 8 AM covering:
  - Total detections from the past 24 hours
  - Breakdown by encroachment type
  - Pending / resolved / escalated counts
  - Critical unresolved reports
  - Links to dashboard

Delivery channels:
  1. Email (via Gmail SMTP or any SMTP server)
  2. Ntfy.sh push notification (summary)

Schedule: Run this at 8 AM daily via cron or Windows Task Scheduler.
  Cron  : 0 8 * * * cd /path/to/ArenIQ && python daily_report.py
  Windows: Set trigger to 08:00 daily in Task Scheduler

Author  : ArenIQ Team
License : MIT
"""

import os
import json
import smtplib
import requests
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ─────────────────────────────────────────────
# CONFIG — fill these in your .env file
# ─────────────────────────────────────────────

SUPABASE_URL          = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE")

# Email config
SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER")       # your Gmail address
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")   # Gmail App Password (not your login password)
ADMIN_EMAIL   = os.getenv("ADMIN_EMAIL")     # who receives the report

# Ntfy.sh config
NTFY_ADMIN_TOPIC = os.getenv("NTFY_ADMIN_TOPIC", "areniq-admin-daily")

# Dashboard URL (shown in email)
DASHBOARD_URL = os.getenv("DASHBOARD_URL", "http://localhost:5173/dashboard")

# ─────────────────────────────────────────────
# SUPABASE CLIENT
# ─────────────────────────────────────────────

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)


# ─────────────────────────────────────────────
# FETCH TODAY'S DATA FROM SUPABASE
# ─────────────────────────────────────────────

def fetch_daily_data():
    """Fetch all reports from the past 24 hours + overall stats."""
    now = datetime.now(timezone.utc)
    since = (now - timedelta(hours=24)).isoformat()

    # New reports in last 24h
    new_res = supabase.table("reports") \
        .select("*") \
        .gte("created_at", since) \
        .order("created_at", desc=True) \
        .execute()
    new_reports = new_res.data or []

    # All-time stats
    total_res    = supabase.table("reports").select("*", count="exact", head=True).execute()
    pending_res  = supabase.table("reports").select("*", count="exact", head=True).eq("status", "pending").execute()
    resolved_res = supabase.table("reports").select("*", count="exact", head=True).eq("status", "resolved").execute()
    critical_res = supabase.table("reports").select("*", count="exact", head=True).eq("status", "critical").execute()
    escalated_res= supabase.table("reports").select("*", count="exact", head=True).eq("status", "escalated").execute()

    # Critical unresolved reports (for alert section)
    critical_detail = supabase.table("reports") \
        .select("*") \
        .eq("status", "critical") \
        .order("created_at", desc=True) \
        .limit(5) \
        .execute()

    return {
        "new_reports"     : new_reports,
        "total"           : total_res.count or 0,
        "pending"         : pending_res.count or 0,
        "resolved"        : resolved_res.count or 0,
        "critical"        : critical_res.count or 0,
        "escalated"       : escalated_res.count or 0,
        "critical_detail" : critical_detail.data or [],
        "generated_at"    : now.strftime("%d %b %Y, %I:%M %p UTC"),
        "date_label"      : now.strftime("%d %B %Y"),
    }


# ─────────────────────────────────────────────
# BUILD TYPE BREAKDOWN
# ─────────────────────────────────────────────

TYPE_LABELS = {
    "construction" : "🏗️  Construction",
    "sand_mining"  : "⛏️  Sand Mining",
    "waste_dumping": "🗑️  Waste Dumping",
    "land_filling" : "🌍  Land Filling",
    "other"        : "❓  Other",
}

def get_type_breakdown(reports):
    counts = {}
    for r in reports:
        t = r.get("type", "other")
        counts[t] = counts.get(t, 0) + 1
    return counts


# ─────────────────────────────────────────────
# BUILD HTML EMAIL
# ─────────────────────────────────────────────

def build_html_email(data):
    new_reports   = data["new_reports"]
    type_breakdown = get_type_breakdown(new_reports)

    satellite_count = sum(1 for r in new_reports if r.get("source") == "satellite")
    citizen_count   = sum(1 for r in new_reports if r.get("source") == "citizen")

    # Type breakdown rows
    breakdown_rows = ""
    for t, count in type_breakdown.items():
        label = TYPE_LABELS.get(t, t)
        breakdown_rows += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">{label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:bold;">{count}</td>
        </tr>"""

    if not breakdown_rows:
        breakdown_rows = '<tr><td colspan="2" style="padding:12px;color:#94a3b8;text-align:center;">No new detections today</td></tr>'

    # New report rows
    report_rows = ""
    for r in new_reports[:10]:  # Show max 10
        status_color = {
            "pending"    : "#f59e0b",
            "resolved"   : "#10b981",
            "critical"   : "#ef4444",
            "escalated"  : "#f97316",
            "acknowledged": "#3b82f6",
        }.get(r.get("status", "pending"), "#94a3b8")

        report_rows += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;">{r.get('type','—').replace('_',' ').title()}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;">{r.get('source','—').title()}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;">{r.get('latitude','—')}, {r.get('longitude','—')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;">
            <span style="background:{status_color};color:white;padding:2px 8px;border-radius:999px;font-size:11px;">{r.get('status','—').upper()}</span>
          </td>
        </tr>"""

    if not report_rows:
        report_rows = '<tr><td colspan="4" style="padding:12px;color:#94a3b8;text-align:center;">No new reports in the last 24 hours</td></tr>'

    # Critical alerts section
    critical_section = ""
    if data["critical_detail"]:
        critical_rows = ""
        for r in data["critical_detail"]:
            critical_rows += f"""
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #fecaca;font-size:12px;">#{str(r['id'])[:8]}…</td>
              <td style="padding:8px 12px;border-bottom:1px solid #fecaca;font-size:12px;">{r.get('type','—').replace('_',' ').title()}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #fecaca;font-size:12px;">{r.get('latitude','—')}, {r.get('longitude','—')}</td>
            </tr>"""

        critical_section = f"""
        <div style="margin-top:24px;">
          <h3 style="color:#ef4444;font-size:16px;margin-bottom:12px;">🔴 Critical Unresolved Reports ({data['critical']})</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fff5f5;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#fee2e2;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#991b1b;">Report ID</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#991b1b;">Type</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#991b1b;">Location</th>
              </tr>
            </thead>
            <tbody>{critical_rows}</tbody>
          </table>
        </div>"""

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0c4a6e,#065f46);border-radius:16px 16px 0 0;padding:32px;">
              <p style="margin:0;color:#bae6fd;font-size:11px;letter-spacing:3px;text-transform:uppercase;">ArenIQ — Waterbody Protection</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;font-weight:700;">Daily Monitoring Report</h1>
              <p style="margin:8px 0 0;color:#a7f3d0;font-size:14px;">{data['date_label']}</p>
            </td>
          </tr>

          <!-- Stats Row -->
          <tr>
            <td style="background:#ffffff;padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:16px;background:#f0f9ff;border-radius:12px;margin:4px;">
                    <p style="margin:0;font-size:32px;font-weight:700;color:#0369a1;">{len(new_reports)}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">New Today</p>
                  </td>
                  <td style="width:8px;"></td>
                  <td style="text-align:center;padding:16px;background:#fefce8;border-radius:12px;">
                    <p style="margin:0;font-size:32px;font-weight:700;color:#b45309;">{data['pending']}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Pending</p>
                  </td>
                  <td style="width:8px;"></td>
                  <td style="text-align:center;padding:16px;background:#f0fdf4;border-radius:12px;">
                    <p style="margin:0;font-size:32px;font-weight:700;color:#15803d;">{data['resolved']}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Resolved</p>
                  </td>
                  <td style="width:8px;"></td>
                  <td style="text-align:center;padding:16px;background:#fff1f2;border-radius:12px;">
                    <p style="margin:0;font-size:32px;font-weight:700;color:#be123c;">{data['critical']}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Critical</p>
                  </td>
                </tr>
              </table>

              <!-- Source breakdown -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td style="text-align:center;padding:12px;background:#f8fafc;border-radius:8px;">
                    <span style="font-size:13px;color:#475569;">🛰️ <strong>{satellite_count}</strong> Satellite &nbsp;&nbsp; 📱 <strong>{citizen_count}</strong> Citizen &nbsp;&nbsp; ⬆️ <strong>{data['escalated']}</strong> Escalated</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Type Breakdown -->
          <tr>
            <td style="background:#ffffff;padding:0 24px 24px;">
              <h3 style="font-size:16px;color:#0f172a;margin-bottom:12px;">Today's Detection Breakdown</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;">Encroachment Type</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:#475569;">Count</th>
                  </tr>
                </thead>
                <tbody>{breakdown_rows}</tbody>
              </table>
            </td>
          </tr>

          <!-- Recent Reports Table -->
          <tr>
            <td style="background:#ffffff;padding:0 24px 24px;">
              <h3 style="font-size:16px;color:#0f172a;margin-bottom:12px;">New Reports (Last 24 Hours)</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;">Type</th>
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;">Source</th>
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;">Location</th>
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;">Status</th>
                  </tr>
                </thead>
                <tbody>{report_rows}</tbody>
              </table>
            </td>
          </tr>

          <!-- Critical Alerts -->
          {"<tr><td style='background:#ffffff;padding:0 24px 24px;'>" + critical_section + "</td></tr>" if critical_section else ""}

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff;padding:0 24px 32px;text-align:center;">
              <a href="{DASHBOARD_URL}" style="display:inline-block;background:#0c4a6e;color:#ffffff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">Open Dashboard →</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">ArenIQ — Chengalpattu District Pilot · Report generated at {data['generated_at']}</p>
              <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">This is an automated report. Do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    return html


# ─────────────────────────────────────────────
# SEND EMAIL
# ─────────────────────────────────────────────

def send_email(data, html_body):
    if not SMTP_USER or not SMTP_PASSWORD or not ADMIN_EMAIL:
        print("[!] Email not configured — skipping email. Set SMTP_USER, SMTP_PASSWORD, ADMIN_EMAIL in .env")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"ArenIQ Daily Report — {data['date_label']} | {len(data['new_reports'])} new detection(s)"
    msg["From"]    = f"ArenIQ Monitor <{SMTP_USER}>"
    msg["To"]      = ADMIN_EMAIL

    # Plain text fallback
    plain = f"""ArenIQ Daily Report — {data['date_label']}

New detections today : {len(data['new_reports'])}
Pending              : {data['pending']}
Resolved             : {data['resolved']}
Critical             : {data['critical']}
Escalated            : {data['escalated']}

Open dashboard: {DASHBOARD_URL}

Generated at {data['generated_at']}
"""
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, ADMIN_EMAIL, msg.as_string())
        print(f"[✓] Daily report email sent to {ADMIN_EMAIL}")
        return True
    except Exception as e:
        print(f"[✗] Email failed: {e}")
        return False


# ─────────────────────────────────────────────
# SEND NTFY PUSH SUMMARY
# ─────────────────────────────────────────────

def send_ntfy_summary(data):
    new_count = len(data["new_reports"])
    body = (
        f"📊 Daily Report - {data['date_label']}\n"
        f"New detections: {new_count}\n"
        f"Pending: {data['pending']} | Resolved: {data['resolved']} | Critical: {data['critical']}\n"
        f"Open: {DASHBOARD_URL}"
    )
    try:
        response = requests.post(
            f"https://ntfy.sh/{NTFY_ADMIN_TOPIC}",
            data=body.encode("utf-8"),
            headers={
                "Title"   : f"ArenIQ Daily - {new_count} new report(s)",
                "Priority": "default",
                "Tags"    : "satellite,water,chart_with_upwards_trend",
            },
        )
        if response.ok:
            print(f"[✓] Ntfy summary sent to topic: {NTFY_ADMIN_TOPIC}")
        else:
            print(f"[✗] Ntfy failed: {response.status_code}")
    except Exception as e:
        print(f"[✗] Ntfy error: {e}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    print(f"\n=== ArenIQ Daily Report — {datetime.now().strftime('%d %b %Y %H:%M')} ===\n")

    print("[→] Fetching data from Supabase...")
    data = fetch_daily_data()

    print(f"[✓] Stats: {len(data['new_reports'])} new today | "
          f"{data['pending']} pending | {data['resolved']} resolved | {data['critical']} critical")

    print("[→] Building email...")
    html = build_html_email(data)

    print("[→] Sending email...")
    send_email(data, html)

    print("[→] Sending Ntfy push notification...")
    send_ntfy_summary(data)

    print("\n[✓] Daily report complete.\n")


if __name__ == "__main__":
    main()