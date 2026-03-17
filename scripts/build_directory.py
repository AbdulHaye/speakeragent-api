#!/usr/bin/env python3
"""Multi-agent conference + podcast directory builder.

Pipeline:  Researcher → Devil's Advocate → Editor
Output:    config/seed_urls.json  (compatible with _load_seed_urls)

Usage:
    python scripts/build_directory.py
    python scripts/build_directory.py --profile config/speaker_profiles/leigh_vinocur.json
    python scripts/build_directory.py --profile config/speaker_profiles/my_speaker.json --output config/seed_urls.json
"""

import argparse
import json
import os
import sys
from datetime import date
from pathlib import Path

import anthropic

# Use the most capable model for research & editorial judgment
MODEL = "claude-opus-4-6"

CATEGORIES = [
    "conference_directories",   # aggregator sites listing many conferences
    "healthcare_medical",       # medical / health conferences
    "leadership_corporate",     # leadership, business, corporate wellness
    "women_diversity",          # women in leadership / diversity events
    "podcast_directories",      # general podcast guest-booking directories
    "podcast_networks_health",  # health / medicine podcast networks
    "speaker_bureaus",          # speaker bureau & marketplace platforms
    "event_platforms",          # eventbrite-style platforms with CFP listings
]


# ── Helpers ──────────────────────────────────────────────────────────────────

def load_profile(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        print(f"ERROR: Profile not found: {path}")
        sys.exit(1)
    with open(p) as f:
        return json.load(f)


def _call(client: anthropic.Anthropic, system: str, user: str, label: str) -> str:
    """Call Claude and return the text response."""
    bar = "=" * 60
    print(f"\n{bar}\n[{label}] Running...\n{bar}")
    resp = client.messages.create(
        model=MODEL,
        max_tokens=8192,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    result = resp.content[0].text
    print(f"[{label}] Done — {len(result):,} chars, "
          f"{resp.usage.input_tokens} in / {resp.usage.output_tokens} out tokens")
    return result


def _extract_json(text: str) -> dict:
    """Extract the first complete JSON object from a string."""
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in output")
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start : i + 1])
    raise ValueError("Malformed JSON in output — unmatched braces")


# ── Agent 1: Researcher ───────────────────────────────────────────────────────

RESEARCHER_SYSTEM = """You are an expert at discovering speaking opportunities for professional speakers.
Your task is to compile a comprehensive master list of URLs across these source types:

1. Conference DIRECTORIES — aggregator sites that list many conferences (e.g., conferenceindex.org, 10times.com)
2. Individual high-value conferences with open speaker applications or call-for-proposals
3. Podcast DIRECTORIES and networks that actively book interview guests
4. Speaker bureaus and speaker marketplace platforms
5. Corporate event / association meeting platforms with CFP listings

Guidelines:
- Prioritize sources with open submission processes (CFP pages, guest booking forms)
- Focus on US-based or international sources accepting US speakers
- Include sub-pages when more specific (e.g., /call-for-speakers, /apply)
- All URLs must be real and publicly accessible (no login walls for the listing itself)
- Aim for 12–20 URLs per category

Output ONLY a valid JSON object. No markdown, no explanation, just JSON:
{
  "conference_directories": ["url", ...],
  "healthcare_medical": ["url", ...],
  "leadership_corporate": ["url", ...],
  "women_diversity": ["url", ...],
  "podcast_directories": ["url", ...],
  "podcast_networks_health": ["url", ...],
  "speaker_bureaus": ["url", ...],
  "event_platforms": ["url", ...]
}"""


def run_researcher(client: anthropic.Anthropic, profile: dict) -> str:
    topics = "; ".join(t["topic"] for t in profile.get("topics", []))
    industries = ", ".join(profile.get("target_industries", []))
    differentiators = "; ".join(profile.get("unique_differentiators", []))

    user = f"""Speaker profile:
- Name: {profile.get("full_name")}
- Title: {profile.get("professional_title")}
- Topics: {topics}
- Target industries: {industries}
- Differentiators: {differentiators}
- Geography: {profile.get("target_geography", "National (US)")}

Generate a master directory of URLs where this speaker could find speaking and podcast guest opportunities.
Prioritize sources that are a strong fit for their background in emergency medicine, healthcare leadership,
resilience, and women in medicine."""

    return _call(client, RESEARCHER_SYSTEM, user, "RESEARCHER")


# ── Agent 2: Devil's Advocate ─────────────────────────────────────────────────

ADVOCATE_SYSTEM = """You are a ruthless quality-control reviewer for a speaker lead generation system.
Your job is to challenge the researcher's URL list and remove anything that fails these tests:

REJECT if:
- The URL is likely dead or the domain has changed
- It's a pure corporate conference with no external speaker submissions (invite-only)
- It's a generic homepage with no path to a CFP/guest-booking page
- It duplicates another URL already in the list (keep the more specific one)
- It's a podcast directory that is inactive, spam-heavy, or <1k active shows
- It's a paywalled directory (speakers must pay just to be listed)
- It's off-target for a medical/healthcare/leadership speaker

APPROVE if the URL provides a genuine, accessible pathway to a speaking or guest appearance.

Also suggest up to 10 additional URLs the researcher missed.

Output ONLY a valid JSON object:
{
  "approved": {
    "conference_directories": ["url", ...],
    "healthcare_medical": ["url", ...],
    "leadership_corporate": ["url", ...],
    "women_diversity": ["url", ...],
    "podcast_directories": ["url", ...],
    "podcast_networks_health": ["url", ...],
    "speaker_bureaus": ["url", ...],
    "event_platforms": ["url", ...]
  },
  "rejected": [
    {"url": "...", "reason": "..."}
  ],
  "suggestions": ["url", ...]
}"""


def run_devil_advocate(client: anthropic.Anthropic, researcher_output: str, profile: dict) -> str:
    user = f"""Review the following URL list compiled for: {profile.get("full_name")} ({profile.get("professional_title")})

{researcher_output}

Apply strict quality control. Be critical. Only approve URLs you are confident provide
an active, accessible pathway to speaking or podcast guest opportunities."""

    return _call(client, ADVOCATE_SYSTEM, user, "DEVIL'S ADVOCATE")


# ── Agent 3: Editor ───────────────────────────────────────────────────────────

EDITOR_SYSTEM = """You are the final editor producing the master URL list for a speaker lead generation system.

Your job:
1. Start from the devil's advocate APPROVED list
2. Incorporate valid SUGGESTIONS that weren't in the approved list
3. Deduplicate — if two URLs point to the same resource, keep the more specific one
4. Normalize all URLs: must start with https://, no trailing spaces, valid format
5. Flatten all categories into a single deduplicated "urls" array as well
6. Sort each category alphabetically for readability

Output ONLY a valid JSON object:
{
  "categories": {
    "conference_directories": ["url", ...],
    "healthcare_medical": ["url", ...],
    "leadership_corporate": ["url", ...],
    "women_diversity": ["url", ...],
    "podcast_directories": ["url", ...],
    "podcast_networks_health": ["url", ...],
    "speaker_bureaus": ["url", ...],
    "event_platforms": ["url", ...]
  },
  "urls": ["all unique urls flattened and sorted"]
}"""


def run_editor(client: anthropic.Anthropic, researcher_output: str, advocate_output: str) -> dict:
    user = f"""Researcher output:
{researcher_output}

---

Devil's advocate review:
{advocate_output}

---

Produce the final clean master URL list."""

    result = _call(client, EDITOR_SYSTEM, user, "EDITOR")
    return _extract_json(result)


# ── Main pipeline ─────────────────────────────────────────────────────────────

def build_directory(
    profile_path: str = "config/speaker_profiles/leigh_vinocur.json",
    output_path: str = "config/seed_urls.json",
):
    api_key = os.getenv("CLAUDE_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: Set CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable")
        sys.exit(1)

    profile = load_profile(profile_path)
    client = anthropic.Anthropic(api_key=api_key)

    print(f"Building directory for: {profile.get('full_name')}")
    print(f"Profile path:           {profile_path}")
    print(f"Output path:            {output_path}")

    # Stage 1 — Research
    research_raw = run_researcher(client, profile)

    # Stage 2 — Devil's advocate critique
    advocate_raw = run_devil_advocate(client, research_raw, profile)

    # Stage 3 — Editor produces final list
    final = run_editor(client, research_raw, advocate_raw)

    # Build output compatible with _load_seed_urls (reads "urls" key)
    urls = final.get("urls", [])
    # Fallback: flatten categories if editor omitted the flat array
    if not urls:
        seen = set()
        for cat_urls in final.get("categories", {}).values():
            for u in cat_urls:
                if u not in seen:
                    seen.add(u)
                    urls.append(u)

    output = {
        "description": (
            f"Master conference + podcast directory for {profile.get('full_name')}. "
            "Built by multi-agent pipeline: researcher → devil's advocate → editor."
        ),
        "last_updated": date.today().isoformat(),
        "source": "scripts/build_directory.py",
        "categories": final.get("categories", {}),
        "urls": sorted(set(urls)),
    }

    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    total = len(output["urls"])
    print(f"\n{'='*60}")
    print(f"COMPLETE — {total} unique URLs written to {output_path}")
    print(f"{'='*60}")
    for cat, cat_urls in output.get("categories", {}).items():
        print(f"  {cat:<30} {len(cat_urls):>3} URLs")

    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Build master conference + podcast directory via multi-agent pipeline"
    )
    parser.add_argument(
        "--profile",
        default="config/speaker_profiles/leigh_vinocur.json",
        help="Path to speaker profile JSON",
    )
    parser.add_argument(
        "--output",
        default="config/seed_urls.json",
        help="Output path for seed_urls.json",
    )
    args = parser.parse_args()
    build_directory(args.profile, args.output)
