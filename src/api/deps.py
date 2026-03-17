"""Shared FastAPI dependencies — importable by any API module without circular imports."""

import os
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader

_api_key_header = APIKeyHeader(name='X-API-Key', auto_error=False)

# Max speaker personas per account per plan tier.
# Free and Starter are capped at 1; only Pro allows multiple.
TIER_MAX_PERSONAS: dict[str, int] = {
    'Free': 1,
    'Starter': 1,
    'Pro': 3,
}


def verify_api_key(key: Optional[str] = Depends(_api_key_header)):
    """Require a valid X-API-Key header on protected endpoints."""
    expected = os.getenv('API_KEY', '')
    if not expected:
        raise HTTPException(status_code=503, detail="API_KEY not configured")
    if key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
