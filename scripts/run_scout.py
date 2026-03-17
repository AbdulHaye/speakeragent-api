"""CLI entry point for running the scout pipeline."""

import argparse
import logging
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agent.scout import run_scout


def main():
    parser = argparse.ArgumentParser(description='SpeakerAgent.AI Scout')
    parser.add_argument(
        '--speaker-profile',
        default='config/speaker_profiles/leigh_vinocur.json',
        help='Path to speaker profile JSON file'
    )
    parser.add_argument(
        '--speaker-id',
        default='leigh_vinocur',
        help='Speaker ID for Airtable filtering'
    )
    parser.add_argument(
        '--max-leads',
        type=int,
        default=None,
        help='Max leads to process (overrides settings)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without pushing to Airtable'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable debug logging'
    )

    args = parser.parse_args()

    # Setup logging
    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        datefmt='%H:%M:%S',
    )

    print("=" * 60)
    print("  SpeakerAgent.AI — Scout Pipeline")
    print("=" * 60)
    print(f"  Profile: {args.speaker_profile}")
    print(f"  Speaker ID: {args.speaker_id}")
    print(f"  Dry Run: {args.dry_run}")
    print("=" * 60)

    summary = run_scout(
        profile_path=args.speaker_profile,
        speaker_id=args.speaker_id,
        max_leads=args.max_leads,
        dry_run=args.dry_run,
    )

    if 'error' in summary:
        print(f"\nERROR: {summary['error']}")
        sys.exit(1)

    print(f"\nDone! Pushed {summary['pushed']} leads to Airtable.")
    return summary


if __name__ == '__main__':
    main()
