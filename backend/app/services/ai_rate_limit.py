"""AI-specific rate limit decorator utilities."""
from __future__ import annotations

from typing import Any, Callable, Optional

from app.core.config import settings
from app.services.decorators.rate_limit import RateLimitManager


_ai_rate_limit_manager = RateLimitManager(
    default_requests=settings.ai_rate_limit_requests_per_window,
    default_window_seconds=settings.ai_rate_limit_window_seconds,
)


def ai_rate_limit(
    feature: str,
    *,
    key_func: Optional[Callable[..., str]] = None,
    key_param: Optional[str] = None,
    identity_attr: Optional[str] = "id",
    fallback_key: str = "global",
    requests: Optional[int] = None,
    window_seconds: Optional[int] = None,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Return a decorator applying the configured AI rate limit."""

    if not settings.ai_rate_limit_enabled:
        def _passthrough(func: Callable[..., Any]) -> Callable[..., Any]:
            return func
        return _passthrough

    return _ai_rate_limit_manager.decorator(
        feature,
        key_func=key_func,
        key_param=key_param,
        identity_attr=identity_attr,
        fallback_key=fallback_key,
        requests=requests,
        window_seconds=window_seconds,
    )
