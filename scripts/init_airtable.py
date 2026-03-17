"""Initialize Airtable tables (verify they exist and have correct fields).

NOTE: The Airtable Web API doesn't support creating tables programmatically
without the Metadata API (which requires Enterprise). This script verifies
that the existing tables have the expected fields.
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from config.settings import Settings


def verify_tables():
    """Verify the Airtable base has the expected tables and fields."""
    settings = Settings()

    headers = {
        'Authorization': f'Bearer {settings.AIRTABLE_API_KEY}',
        'Content-Type': 'application/json'
    }
    base_url = f'https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID}'

    # Check Conferences (Leads) table
    print(f"Checking '{settings.LEADS_TABLE}' table...")
    resp = requests.get(
        f'{base_url}/{settings.LEADS_TABLE}',
        headers=headers,
        params={'pageSize': 1},
        timeout=10
    )
    if resp.status_code == 200:
        print(f"  ✓ '{settings.LEADS_TABLE}' table exists")
        records = resp.json().get('records', [])
        if records:
            fields = records[0].get('fields', {})
            print(f"  Fields found: {list(fields.keys())}")
        else:
            print(f"  (table is empty)")
    else:
        print(f"  ✗ Error accessing '{settings.LEADS_TABLE}': {resp.status_code}")
        print(f"    {resp.text}")

    # Check Speakers table
    print(f"\nChecking '{settings.SPEAKERS_TABLE}' table...")
    resp = requests.get(
        f'{base_url}/{settings.SPEAKERS_TABLE}',
        headers=headers,
        params={'pageSize': 1},
        timeout=10
    )
    if resp.status_code == 200:
        print(f"  ✓ '{settings.SPEAKERS_TABLE}' table exists")
        records = resp.json().get('records', [])
        if records:
            fields = records[0].get('fields', {})
            print(f"  Fields found: {list(fields.keys())}")
        else:
            print(f"  (table is empty)")
    elif resp.status_code == 404:
        print(f"  ✗ '{settings.SPEAKERS_TABLE}' table not found.")
        print(f"    You need to create it manually in Airtable.")
        print(f"    Required fields: full_name, email, professional_title,")
        print(f"    credentials, years_experience, topics_json, book_title,")
        print(f"    niche_keywords, min_honorarium, target_geography,")
        print(f"    plan_tier, created_at, speaker_id")
    else:
        print(f"  ✗ Error: {resp.status_code} - {resp.text}")

    print("\nExpected fields for Conferences (Leads) table:")
    expected = [
        'Conference Name', 'Date Found', 'Triage Status', 'Match Score',
        'Pay Estimate', 'Event Date', 'Event Location', 'Conference URL',
        'Contact Name', 'Contact Title', 'Contact Email', 'Contact LinkedIn',
        'Suggested Talk', 'The Hook', 'CTA', 'Status', 'speaker_id'
    ]
    for f in expected:
        print(f"  - {f}")


if __name__ == '__main__':
    verify_tables()
