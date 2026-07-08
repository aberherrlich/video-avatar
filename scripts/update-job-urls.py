#!/usr/bin/env python3
"""
update-job-urls.py

purpose: fetch current job URLs from karriere.hypoport.de and update demo2.html
input: none (reads from karriere.hypoport.de)
output: updates jobUrls array in demo2.html with current URLs + validation date
dependencies: urllib (stdlib), re (stdlib)
"""

import urllib.request
import re
from datetime import datetime
from pathlib import Path

CAREERS_URL = 'https://karriere.hypoport.de/jobs'
DEMO2_PATH = Path(__file__).parent.parent / 'demo2.html'

def fetch_job_urls():
    """Fetch all job URLs from karriere.hypoport.de/jobs listing page."""
    try:
        with urllib.request.urlopen(CAREERS_URL, timeout=10) as response:
            html = response.read().decode('utf-8')

        # extract all job URLs from href="/jobs/..."
        pattern = r'href="(/jobs/[^"]+)"'
        job_paths = re.findall(pattern, html)

        # convert to full URLs
        job_urls = [f'https://karriere.hypoport.de{path}' for path in job_paths]

        # deduplicate and sort
        job_urls = sorted(set(job_urls))

        return job_urls
    except Exception as e:
        print(f'Error fetching jobs: {e}')
        return []

def update_demo2(job_urls):
    """Update jobUrls array in demo2.html with new URLs and validation date."""
    if not job_urls:
        print('No job URLs fetched. Skipping update.')
        return False

    with open(DEMO2_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # format job URLs as JavaScript array
    today = datetime.now().strftime('%Y-%m-%d')
    urls_js = '[\n\n' + ',\n\n'.join(f"            '{url}'" for url in job_urls) + ',\n\n        ]'

    # replace old jobUrls array and update validation comment
    old_pattern = r'// -> job url pool \(active postings only, validated [\d\-]+\)\s*const jobUrls = \[[\s\S]*?\];'
    new_const = f"""// -> job url pool (active postings only, validated {today})
        const jobUrls = {urls_js};"""

    content = re.sub(old_pattern, new_const, content)

    with open(DEMO2_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Updated {DEMO2_PATH.name} with {len(job_urls)} job URLs (validated {today})')
    return True

if __name__ == '__main__':
    job_urls = fetch_job_urls()
    if job_urls:
        update_demo2(job_urls)
    else:
        print('Failed to fetch job URLs.')
        exit(1)
