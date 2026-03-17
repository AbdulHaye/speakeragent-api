"""Seed Dr. Leigh Vinocur's profile into the Speakers table."""

import json
import sys
import os
from datetime import date

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import Settings
from src.api.airtable import AirtableAPI


def seed_leigh_vinocur():
    """Insert Dr. Leigh's profile into the Speakers table."""
    settings = Settings()
    airtable = AirtableAPI(
        api_key=settings.AIRTABLE_API_KEY,
        base_id=settings.AIRTABLE_BASE_ID,
        leads_table=settings.LEADS_TABLE,
        speakers_table=settings.SPEAKERS_TABLE,
    )

    # Load profile from JSON
    profile_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'config', 'speaker_profiles', 'leigh_vinocur.json'
    )
    with open(profile_path) as f:
        profile = json.load(f)

    speaker_id = 'leigh_vinocur'

    # Check if already exists
    existing = airtable.get_speaker(speaker_id)
    if existing:
        print(f"Speaker '{speaker_id}' already exists (record ID: {existing['id']})")
        return existing['id']

    # Build Airtable record
    fields = {
        'speaker_id': speaker_id,
        'full_name': profile['full_name'],
        'professional_title': profile['professional_title'],
        'credentials': profile['credentials'],
        'years_experience': profile['years_experience'],
        'topics_json': json.dumps(profile['topics']),
        'book_title': profile['book_title'],
        'niche_keywords': ', '.join(profile['discussion_points']),
        'min_honorarium': profile['min_honorarium'],
        'target_geography': profile['target_geography'],
        'plan_tier': 'Pro',
        'created_at': date.today().isoformat(),
    }

    result = airtable.create_speaker(fields)
    if result:
        record_id = result.get('id', 'unknown')
        print(f"Seeded speaker '{profile['full_name']}' (record ID: {record_id})")
        return record_id
    else:
        print("Failed to seed speaker. Check logs for Airtable errors.")
        print("If the Speakers table doesn't exist, create it in Airtable first.")
        return None


if __name__ == '__main__':
    seed_leigh_vinocur()
