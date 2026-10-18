import os
import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://bcverqvmibfzapllxvue.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SUPABASE_KEY:
    # Coba baca dari .env.local jika dijalankan lokal
    env_local_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    if os.path.exists(env_local_path):
        with open(env_local_path, "r", encoding="utf-8") as ef:
            for line in ef:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    SUPABASE_KEY = line.strip().split("=", 1)[1]
                    break
DEFAULT_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
STATE_FILE = os.environ.get(
    "TELEGRAM_STATE_FILE",
    os.path.join(DEFAULT_DATA_DIR, "notified_jobs.json")
)
MIN_SCORE_THRESHOLD = 6.0

def get_notified_job_ids():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return set(data.get("notified_ids", []))
        except Exception:
            return set()
    return set()

def save_notified_job_ids(ids_set):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        # Keep last 500 ids
        all_ids = list(ids_set)[-500:]
        json.dump({"notified_ids": all_ids, "updated_at": datetime.now().isoformat()}, f, indent=2)

def fetch_high_score_jobs():
    # Fetch jobs with score >= MIN_SCORE_THRESHOLD ordered by created_at desc
    url = f"{SUPABASE_URL}/rest/v1/jobs?score=gte.{MIN_SCORE_THRESHOLD}&order=created_at.desc&limit=15"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return json.loads(res.read().decode("utf-8"))
    except Exception as e:
        sys.stderr.write(f"Error fetching Supabase jobs: {e}\n")
        return []

def chunk_message(text: str, max_chars: int = 3800) -> list[str]:
    """
    Memecah pesan panjang menjadi beberapa chunk aman (maksimal max_chars).
    Menggunakan batas paragraf/blok lowongan ganda (\\n\\n) agar tidak membelah tag formatting Markdown.
    """
    if not text or len(text) <= max_chars:
        return [text] if text else []

    paragraphs = text.split("\n\n")
    chunks = []
    current_paragraphs = []
    current_length = 0

    for para in paragraphs:
        para_len = len(para) + (2 if current_paragraphs else 0)
        if current_length + para_len > max_chars and current_paragraphs:
            chunks.append("\n\n".join(current_paragraphs).strip())
            current_paragraphs = [para]
            current_length = len(para)
        else:
            current_paragraphs.append(para)
            current_length += para_len

    if current_paragraphs:
        chunks.append("\n\n".join(current_paragraphs).strip())

    return chunks

def format_telegram_alert(jobs_to_alert):
    if not jobs_to_alert:
        return ""

    lines = [
        "🚨 **RADAR MAGANGYOKK: LOKER BARU RELEVAN!**",
        f"Ditemukan **{len(jobs_to_alert)} lowongan baru** dengan skor kecocokan tinggi (≥ {MIN_SCORE_THRESHOLD}):",
        ""
    ]

    for job in jobs_to_alert:
        title = job.get("title", "Unknown Title")
        company = job.get("company", "Unknown Company")
        location = "Remote" if job.get("is_remote") else (job.get("location") or "Indonesia")
        score = job.get("score", 0)
        url = job.get("url", "#")
        
        # Edu target detection
        desc = (job.get("description") or "").lower()
        full_text = f"{title} {desc}".lower()
        if any(k in full_text for k in ["intern", "magang", "pkl", "mahasiswa", "student"]):
            target_badge = "🟢 Magang Mahasiswa"
        else:
            target_badge = "🟡 Fresh Graduate / Wisuda"

        lines.append(f"• **{title}** - *{company}*")
        lines.append(f"  🎯 Match Score: `{score:.1f}/10` · {target_badge}")
        lines.append(f"  📍 Lokasi: {location}")
        lines.append(f"  🔗 [Buka & Lamar Lowongan]({url})")
        lines.append("")

    lines.append("⚡ Buka dashboard di [MagangYokk](http://localhost:3000) untuk drag ke Kanban atau generate AI Cover Letter.")
    return "\n".join(lines)

def main():
    notified_ids = get_notified_job_ids()
    jobs = fetch_high_score_jobs()

    if not jobs:
        return

    # First run initialization: kalau state file belum ada, tandai yang lama sebagai seen
    # agar tidak spamming semua 30 loker lama sekaligus di detik pertama
    if not notified_ids:
        initial_ids = {j["id"] for j in jobs}
        save_notified_job_ids(initial_ids)
        # Ambil 1 loker terbaik sebagai sample alert pertama
        sample_job = max(jobs, key=lambda x: x.get("score") or 0)
        output = format_telegram_alert([sample_job])
        if output:
            for chunk in chunk_message(output, max_chars=3800):
                print(chunk)
        return

    new_jobs = []
    for j in jobs:
        job_id = j.get("id")
        if job_id and job_id not in notified_ids:
            new_jobs.append(j)
            notified_ids.add(job_id)

    if new_jobs:
        save_notified_job_ids(notified_ids)
        output = format_telegram_alert(new_jobs)
        if output:
            for chunk in chunk_message(output, max_chars=3800):
                print(chunk)

if __name__ == "__main__":
    main()
