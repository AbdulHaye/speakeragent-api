"""Tests for the Airtable client."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.api.airtable import clean_payload, AirtableAPI
from config.settings import Settings


def test_clean_payload():
    """Test that empty/invalid fields are stripped."""
    payload = {
        'Conference Name': 'Test Conference',
        'Date Found': '2026-02-22',
        'Event Date': '',          # Should be removed
        'Match Score': '75',       # Should become int
        'Contact Email': None,     # Should be removed
        'Contact Name': 'TBD',     # Should be removed
        'Pay Estimate': 'N/A',     # Should be removed
        'Triage Status': 'RED',
        'Event Location': 'Virtual',
    }

    cleaned = clean_payload(payload)

    assert cleaned['Conference Name'] == 'Test Conference'
    assert cleaned['Date Found'] == '2026-02-22'
    assert 'Event Date' not in cleaned
    assert cleaned['Match Score'] == 75
    assert isinstance(cleaned['Match Score'], int)
    assert 'Contact Email' not in cleaned
    assert 'Contact Name' not in cleaned
    assert 'Pay Estimate' not in cleaned
    assert cleaned['Triage Status'] == 'RED'
    assert cleaned['Event Location'] == 'Virtual'
    print("✓ Clean payload tests passed")


def test_clean_payload_bad_date():
    """Ensure non-ISO dates are stripped."""
    payload = {
        'Event Date': 'March 2026',  # Not YYYY-MM-DD
        'Date Found': '2026-02-22',
    }
    cleaned = clean_payload(payload)
    assert 'Event Date' not in cleaned
    assert cleaned['Date Found'] == '2026-02-22'
    print("✓ Bad date stripping test passed")


def test_airtable_health_check():
    """Live test: verify Airtable connection."""
    try:
        settings = Settings()
    except ValueError as e:
        print(f"⊘ Skipping live test (missing env vars): {e}")
        return

    airtable = AirtableAPI(
        api_key=settings.AIRTABLE_API_KEY,
        base_id=settings.AIRTABLE_BASE_ID,
        leads_table=settings.LEADS_TABLE,
    )
    result = airtable.health_check()
    if result:
        print("✓ Airtable health check passed")
    else:
        print("✗ Airtable health check FAILED")


if __name__ == '__main__':
    test_clean_payload()
    test_clean_payload_bad_date()
    test_airtable_health_check()
    print("\nAll Airtable tests passed!")
