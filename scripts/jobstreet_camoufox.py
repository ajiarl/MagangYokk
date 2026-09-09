import os
import sys
import json
import re
import urllib.request
from datetime import datetime
from bs4 import BeautifulSoup
from camoufox.sync_api import Camoufox

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://bcverqvmibfzapllxvue.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_KEY:
    env_file = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    SUPABASE_KEY = line.strip().split("=", 1)[1]
                    break

USER_SKILLS = ["next.js", "react", "typescript", "laravel", "php", "supabase", "mysql", "tailwind"]

def calculate_match_score(title, desc, location, is_remote):
    text = f"{title} {desc}".lower()
    matched_skills = {}
    skill_score = 0
    for s in USER_SKILLS:
        if s in text:
            matched_skills[s] = True
            skill_score += 1
        else:
            matched_skills[s] = False

    base_score = 5.0
    if is_remote:
        base_score += 2.0
    elif "palembang" in location.lower():
        base_score += 2.0

    skill_boost = min(3.0, skill_score * 0.75)
    final_score = min(10.0, base_score + skill_boost)
    return round(final_score, 1), matched_skills

def fetch_existing_urls():
    url = f"{SUPABASE_URL}/rest/v1/jobs?select=url"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode("utf-8"))
            return set(d["url"] for d in data)
    except Exception as e:
        sys.stderr.write(f"Error fetching existing urls: {e}\n")
        return set()

def scrape_jobstreet():
    print("[*] Launching Camoufox stealth browser for Jobstreet Indonesia...")
    existing_urls = fetch_existing_urls()
    print(f"[*] Found {len(existing_urls)} existing job URLs in database.")

    queries = [
        "https://id.jobstreet.com/id/internship-web-developer-jobs",
        "https://id.jobstreet.com/id/junior-web-developer-jobs"
    ]

    new_jobs = []

    with Camoufox(headless=True) as browser:
        page = browser.new_page()

        for q_url in queries:
            print(f"[*] Navigating to: {q_url}")
            try:
                page.goto(q_url, timeout=40000)
                page.wait_for_timeout(4000)
            except Exception as e:
                print(f"[!] Timeout loading {q_url}: {e}")
                continue

            soup = BeautifulSoup(page.content(), "html.parser")
            articles = soup.find_all("article")
            print(f"[*] Parsed {len(articles)} job cards.")

            for art in articles:
                title_elem = art.find("a", {"data-automation": "jobTitle"}) or art.find("h3") or art.find("a")
                if not title_elem:
                    continue

                raw_title = title_elem.text.strip()
                rel_url = title_elem.get("href", "")
                if not rel_url:
                    continue

                full_url = f"https://id.jobstreet.com{rel_url.split('?')[0]}"
                if full_url in existing_urls:
                    continue

                comp_elem = art.find("a", {"data-automation": "jobCompany"})
                company = comp_elem.text.strip() if comp_elem else "Perusahaan di Jobstreet"

                loc_elem = art.find("a", {"data-automation": "jobLocation"})
                location = loc_elem.text.strip() if loc_elem else "Indonesia"

                # Snippet description
                desc_text = art.text.replace("\n", " ").strip()
                is_remote = "remote" in desc_text.lower() or "work from home" in desc_text.lower()

                score, breakdown = calculate_match_score(raw_title, desc_text, location, is_remote)

                job_payload = {
                    "title": raw_title,
                    "company": company,
                    "location": location,
                    "is_remote": is_remote,
                    "is_paid": True,
                    "description": desc_text[:1000],
                    "url": full_url,
                    "source": "jobstreet",
                    "score": score,
                    "score_breakdown": breakdown,
                    "scraped_at": datetime.now().isoformat()
                }

                new_jobs.append(job_payload)
                existing_urls.add(full_url)

    print(f"[*] Scraped {len(new_jobs)} brand new unique jobs from Jobstreet.")
    return new_jobs

def push_jobs_to_supabase(jobs):
    if not jobs:
        print("[*] No new jobs to insert.")
        return 0

    url = f"{SUPABASE_URL}/rest/v1/jobs"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    # Batch insert by 20
    inserted = 0
    batch_size = 20
    for i in range(0, len(jobs), batch_size):
        batch = jobs[i:i + batch_size]
        data = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                if res.status in (200, 201):
                    inserted += len(batch)
        except Exception as e:
            sys.stderr.write(f"Error inserting batch: {e}\n")

    print(f"[✓] Successfully inserted {inserted} jobs to Supabase.")
    return inserted

def main():
    jobs = scrape_jobstreet()
    if jobs:
        push_jobs_to_supabase(jobs)

if __name__ == "__main__":
    main()
