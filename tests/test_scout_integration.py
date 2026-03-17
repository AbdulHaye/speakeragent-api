"""Integration test for the scout pipeline (dry run)."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agent.scraper import generate_search_queries, scrape_page, should_skip_url


def test_generate_queries():
    """Test search query generation."""
    import json
    profile_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'config', 'speaker_profiles', 'leigh_vinocur.json'
    )
    with open(profile_path) as f:
        profile = json.load(f)

    queries = generate_search_queries(profile)
    assert len(queries) == 10, f"Expected 10 queries, got {len(queries)}"
    for q in queries:
        assert isinstance(q, str)
        assert len(q) > 10
    print("✓ Generated 10 search queries:")
    for i, q in enumerate(queries):
        print(f"  {i+1}. {q}")


def test_should_skip_url():
    """Test URL filtering."""
    assert should_skip_url('https://www.linkedin.com/in/someone') is True
    assert should_skip_url('https://indeed.com/job/123') is True
    assert should_skip_url('https://example.com/file.pdf') is True
    assert should_skip_url('https://conference.org/speakers') is False
    assert should_skip_url('https://medicalconference.com/cfp') is False
    print("✓ URL filtering tests passed")


def test_scrape_known_page():
    """Test scraping a known public page."""
    result = scrape_page('https://httpbin.org/html', timeout=10)
    if result:
        assert result['url'] == 'https://httpbin.org/html'
        assert len(result['title']) > 0 or len(result['full_text']) > 0
        print(f"✓ Scrape test passed (title: {result['title'][:50]})")
    else:
        print("⊘ Scrape test skipped (network issue)")


if __name__ == '__main__':
    test_should_skip_url()
    test_generate_queries()
    test_scrape_known_page()
    print("\nAll integration tests passed!")
