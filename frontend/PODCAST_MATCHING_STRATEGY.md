# Podcast Matching Strategy

## Sourcing Podcast Data

We pull podcast data from three places:

1. **Apify Podcast Scraper** (already built) — scrapes Apple Podcasts and Spotify directories using the speaker's keywords. Returns show name, host, description, categories, and episode count.

2. **Listen Notes API** — the largest podcast search engine (3M+ shows). We'd search by keyword and genre, then filter for active shows accepting guests. Free tier covers 300 requests/month.

3. **Podcast Index API** — free, open-source directory with 4M+ feeds. Good for finding niche and independent shows that don't surface on the big platforms.

We also run Google searches like `"{speaker's niche}" podcast "be a guest"` to catch shows with open guest application pages.

All results land in the existing **Conferences** table with `Event Type = "Podcast"` — no new tables needed.

## Matching Speakers to Shows

We reuse the existing Claude-powered scoring pipeline with podcast-specific criteria:

| Criteria | Weight | What We Look At |
|----------|--------|-----------------|
| Topic Relevance | 30% | Do the show's episodes and description match the speaker's topics? |
| Audience Fit | 25% | Does the podcast's audience overlap with the speaker's target industries? |
| Show Quality | 15% | Episode count, publishing frequency, estimated listenership |
| Guest Fit | 15% | Are past guests at a similar level to this speaker? |
| Recency | 10% | Has the show published in the last 30 days? |
| Accessibility | 5% | Is there a guest application form or host contact info? |

Scoring thresholds stay the same: GREEN (65+), YELLOW (35–64), RED (below 35). We generate pitches for GREEN and YELLOW matches — referencing recent episodes and suggesting 2–3 topic angles.

## Architecture

The flow mirrors what we already have for conferences:

```
Speaker Profile → Query Generator → [Apify, Listen Notes, Podcast Index]
    → Claude Scorer → Verifier → Pitch Generator → Airtable (Conferences table)
```

Key decisions:

- **No new tables.** Podcasts go in the Conferences table with a type flag. The dashboard already filters by event type.
- **Podcast scoring already exists.** `_score_podcast_with_claude()` in `scoring.py` handles podcast-specific evaluation.
- **Deduplication built in.** `lead_exists()` prevents re-scoring the same show across runs.
- **Async scraping.** Apify runs can take up to 30 minutes. The existing polling approach handles this.

## What Needs to Change

- `podcast_scraper.py` — add Listen Notes and Podcast Index as data sources alongside Apify
- `scraper.py` — extend `generate_search_queries()` for podcast-specific search terms
- `settings.py` — add `LISTEN_NOTES_API_KEY` and `PODCAST_INDEX_KEY` env vars
- `pitch.py` — add a podcast pitch variant that references recent episodes
