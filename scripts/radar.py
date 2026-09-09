import os
import sys
import json
import logging
import urllib.request
import urllib.error
from datetime import datetime

# Supress noisy logs
logging.getLogger("jobspy").setLevel(logging.ERROR)
logging.getLogger("urllib3").setLevel(logging.ERROR)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.stderr.write("[Scraper Fatal] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.\n")
    sys.exit(1)

def push_to_supabase(jobs_payload):
    """
    Push jobs payload via Supabase REST API (service_role).
    Uses upsert on conflict (url).
    """
    if not jobs_payload:
        return 0

    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/jobs"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    req = urllib.request.Request(endpoint, data=json.dumps(jobs_payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return len(jobs_payload)
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        sys.stderr.write(f"[Scraper Error] Push ke Supabase gagal: {e.code} - {err_msg}\n")
        return 0
    except Exception as e:
        sys.stderr.write(f"[Scraper Error] Network error: {e}\n")
        return 0

def is_palembang(loc_str):
    if not loc_str:
        return False
    loc = loc_str.lower()
    return "palembang" in loc or "sumatera selatan" in loc or "south sumatra" in loc

def is_remote(loc_str, title_str, is_remote_col):
    if is_remote_col:
        return True
    combined = f"{loc_str or ''} {title_str or ''}".lower()
    return any(k in combined for k in ["remote", "wfh", "work from home", "telecommute"])

def has_compensation(row):
    min_amt = row.get("min_amount")
    max_amt = row.get("max_amount")
    if (min_amt and min_amt > 0) or (max_amt and max_amt > 0):
        return True
    
    desc = str(row.get("description", "")).lower()
    paid_keywords = ["uang saku", "gaji", "stipend", "allowance", "paid", "remunerasi", "idr", "rp ", "benefit"]
    return any(k in desc for k in paid_keywords)

def score_job(title, desc):
    t = str(title).lower()
    d = str(desc).lower()
    combined = f"{t} {d}"

    # Pastikan relevan dengan Software / Web Development
    is_software = any(k in combined for k in [
        "developer", "programmer", "software", "frontend", "front-end", 
        "backend", "back-end", "fullstack", "full-stack", "web", "react", "laravel", "php", "javascript", "typescript"
    ])
    
    # Negative non-IT filters
    is_irrelevant = any(k in t for k in ["mine", "geologist", "plumbing", "sanitary", "mechanical", "civil", "nurse", "sales", "accounting"])
    if not is_software or is_irrelevant:
        return 1.0, [], {}

    score = 4.0
    reasons = []
    breakdown = {}

    # Target Stack Boosts & Breakdown dictionary
    has_react = any(k in combined for k in ["react", "next.js", "nextjs"])
    breakdown["react_nextjs"] = has_react
    if has_react:
        score += 2.0
        reasons.append("React/Next.js")

    has_laravel = any(k in combined for k in ["laravel", "php"])
    breakdown["laravel_php"] = has_laravel
    if has_laravel:
        score += 2.0
        reasons.append("Laravel/PHP")

    has_ts = "typescript" in combined
    breakdown["typescript"] = has_ts
    if has_ts:
        score += 1.0
        reasons.append("TypeScript")

    has_db = any(k in combined for k in ["supabase", "postgresql", "postgres", "mysql"])
    breakdown["db_modern"] = has_db
    if has_db:
        score += 1.0
        reasons.append("Modern DB (Postgres/Supabase/MySQL)")

    score = min(score, 10.0)
    return score, reasons, breakdown

def run():
    try:
        from jobspy import scrape_jobs
    except ImportError:
        sys.stderr.write("[Scraper Error] python-jobspy is not installed.\n")
        sys.exit(1)

    # Scrape Indonesia target web development internships
    queries = [
        "internship web developer",
        "intern software engineer",
        "magang web developer"
    ]
    
    all_jobs_payload = []
    
    for query in queries:
        try:
            jobs_df = scrape_jobs(
                site_name=["linkedin"],
                search_term=query,
                location="Indonesia",
                results_wanted=15,
                hours_old=48,
                country_indeed="indonesia"
            )
        except Exception as e:
            sys.stderr.write(f"[Scraper Warning] Scrape query '{query}' failed: {e}\n")
            continue

        if jobs_df is None or jobs_df.empty:
            continue

        for _, row in jobs_df.iterrows():
            url = row.get("job_url")
            if not url:
                continue

            title = str(row.get("title", "Internship"))
            desc = str(row.get("description", ""))
            company = str(row.get("company", "Company"))
            location = str(row.get("location", ""))
            is_remote_flag = bool(row.get("is_remote", False))

            is_pal = is_palembang(location)
            is_rem = is_remote(location, title, is_remote_flag)

            # Saring wilayah sesuai preferensi Aji (Remote atau Palembang)
            if not (is_pal or is_rem):
                continue

            score, reasons, breakdown = score_job(title, desc)
            if score < 5.0:
                continue

            # Fallback salary parse
            min_a = row.get("min_amount")
            max_a = row.get("max_amount")
            salary_str = None
            if min_a and max_a:
                salary_str = f"IDR {min_a:,.0f} - {max_a:,.0f}"
            elif min_a:
                salary_str = f"IDR {min_a:,.0f}+"

            payload = {
                "title": title,
                "company": company,
                "location": location or ("Remote" if is_rem else "Indonesia"),
                "is_remote": is_rem,
                "url": url,
                "source": "linkedin",
                "score": score,
                "score_breakdown": breakdown,
                "is_paid": has_compensation(row),
                "description": desc[:3000] if desc else None
            }
            all_jobs_payload.append(payload)

    if all_jobs_payload:
        pushed_count = push_to_supabase(all_jobs_payload)
        print(f"Successfully processed {len(all_jobs_payload)} relevant jobs. Pushed {pushed_count} jobs to Supabase.")
    else:
        print("No new relevant jobs found in this run.")

if __name__ == "__main__":
    run()
