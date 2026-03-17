"""Tests for the scoring engine."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agent.scoring import classify_triage, estimate_pay, _fallback_score


def test_triage_classification():
    assert classify_triage(65) == 'RED'
    assert classify_triage(80) == 'RED'
    assert classify_triage(100) == 'RED'
    assert classify_triage(64) == 'YELLOW'
    assert classify_triage(35) == 'YELLOW'
    assert classify_triage(50) == 'YELLOW'
    assert classify_triage(34) == 'GREEN'
    assert classify_triage(0) == 'GREEN'
    assert classify_triage(10) == 'GREEN'
    print("✓ Triage classification tests passed")


def test_pay_estimate():
    assert '$10,000' in estimate_pay('pharma')
    assert '$5,000' in estimate_pay('hospital')
    assert '$1,000' in estimate_pay('unknown')
    assert '$500' in estimate_pay('nonprofit')
    print("✓ Pay estimate tests passed")


def test_fallback_scoring():
    profile = {
        'full_name': 'Dr. Test',
        'topics': [
            {'topic': 'Emergency Medicine Leadership', 'description': 'test'},
            {'topic': 'Women in Healthcare', 'description': 'test'},
        ],
        'target_industries': ['Healthcare'],
        'target_geography': 'National (US)',
    }

    # High relevance scraped data
    scraped_high = {
        'title': 'National Emergency Medicine Conference 2026',
        'description': 'Join us for emergency medicine leadership talks',
        'full_text': 'emergency medicine leadership conference healthcare honorarium speaker fee',
        'location': 'Chicago, IL',
        'mentions_payment': True,
        'mentions_no_payment': False,
    }

    result = _fallback_score(scraped_high, profile)
    assert 0 <= result['match_score'] <= 100
    assert result['triage'] in ('RED', 'YELLOW', 'GREEN')
    assert result['best_topic'] != ''
    print(f"✓ Fallback scoring test passed (score={result['match_score']}, triage={result['triage']})")

    # Low relevance scraped data
    scraped_low = {
        'title': 'Cooking Show 2026',
        'description': 'Learn to cook pasta',
        'full_text': 'cooking pasta recipes chef kitchen volunteer speakers',
        'location': 'Tokyo, Japan',
        'mentions_payment': False,
        'mentions_no_payment': True,
    }

    result_low = _fallback_score(scraped_low, profile)
    assert result_low['match_score'] < result['match_score']
    print(f"✓ Low-relevance fallback test passed (score={result_low['match_score']})")


if __name__ == '__main__':
    test_triage_classification()
    test_pay_estimate()
    test_fallback_scoring()
    print("\nAll scoring tests passed!")
