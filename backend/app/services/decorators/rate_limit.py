"""Generic rate-limiting helpers implemented as decorators."""
from __future__ import annotations

import inspect
import threading
import time
from functools import wraps
from typing import Any, Callable, Dict, Optional


class RateLimitExceededError(RuntimeError):
    """Raised when an invoker exceeds the configured rate limit."""

    def __init__(self, feature: str, limit: int, window_seconds: int, retry_after: float) -> None:
        super().__init__(f"Rate limit exceeded for '{feature}'")
        self.feature = feature
        self.limit = limit
        self.window_seconds = window_seconds
        self.retry_after = max(0.0, retry_after)


class InMemoryRateLimiter:
    """Simple token bucket style limiter backed by an in-memory store."""

    def __init__(self, requests: int, window_seconds: int) -> None:
        if window_seconds <= 0:
            raise ValueError("window_seconds must be positive")
        self.requests = requests
        self.window_seconds = window_seconds
        self._lock = threading.Lock()
        self._buckets: Dict[str, tuple[int, float]] = {}

    
    
    
    def check(self, key: str) -> Optional[float]:
        """Return retry-after seconds when blocked else None."""
        if self.requests <= 0:
            return None  

        now = time.monotonic()
        with self._lock:
            count, window_start = self._buckets.get(key, (0, now))
            elapsed = now - window_start
            
            # reset
            if elapsed >= self.window_seconds:
                count = 0
                window_start = now
                elapsed = 0.0

            # limit
            if count >= self.requests:
                retry_after = self.window_seconds - elapsed
                return max(0.0, retry_after)

            # ++
            self._buckets[key] = (count + 1, window_start)
            return None


class RateLimitManager:
    """Coordinates decorators backed by shared limiter instances."""

    def __init__(self, default_requests: int, default_window_seconds: int) -> None:
        self.default_requests = default_requests
        self.default_window_seconds = default_window_seconds
        self._limiters: Dict[str, InMemoryRateLimiter] = {}
        self._lock = threading.Lock()

    
    # _limiters = {
    #       "expenses:parse_text": InMemoryRateLimiter(10, 60),
    #       "daily_update:chat":   InMemoryRateLimiter(20, 300),
    # }
    
    def _limiter(
        self,
        feature: str,
        requests: Optional[int],
        window_seconds: Optional[int],
    ) -> InMemoryRateLimiter:
        req = requests if requests is not None else self.default_requests
        window = window_seconds if window_seconds is not None else self.default_window_seconds
        with self._lock:
            limiter = self._limiters.get(feature)
            if limiter is None or limiter.requests != req or limiter.window_seconds != window:
                limiter = InMemoryRateLimiter(req, window)
                self._limiters[feature] = limiter
            return limiter

    
    
    
    
    def decorator(
        self,
        feature: str,
        *,
        key_func: Optional[Callable[..., str]] = None,
        key_param: Optional[str] = None,
        identity_attr: Optional[str] = "id",
        fallback_key: str = "global",
        requests: Optional[int] = None,
        window_seconds: Optional[int] = None,
    ) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        
        limiter = self._limiter(feature, requests, window_seconds)      # picks the feature specific limiter 

        def _key_builder(func: Callable[..., Any]) -> Callable[[tuple[Any, ...], Dict[str, Any]], str]:
            signature = inspect.signature(func)

            def _builder(args: tuple[Any, ...], kwargs: Dict[str, Any]) -> str:
                if key_func:
                    return key_func(*args, **kwargs)

                if key_param:
                    bound = signature.bind_partial(*args, **kwargs)
                    if key_param in bound.arguments:
                        value = bound.arguments[key_param]
                        if identity_attr and hasattr(value, identity_attr):
                            value = getattr(value, identity_attr)
                        if value is not None:
                            return str(value)

                return fallback_key

            return _builder

        
        #  applied per request 
        def _decorator(func: Callable[..., Any]) -> Callable[..., Any]:
            key_builder = _key_builder(func)

            def _enforce(args: tuple[Any, ...], kwargs: Dict[str, Any]) -> None:
                
                
                key = key_builder(args, kwargs)
                retry_after = limiter.check(key)
                if retry_after is not None:
                    raise RateLimitExceededError(
                        feature,
                        limiter.requests,
                        limiter.window_seconds,
                        retry_after,
                    )

            
            
            if inspect.iscoroutinefunction(func):

                @wraps(func)
                async def _async_wrapper(*args: Any, **kwargs: Any) -> Any:
                    _enforce(args, kwargs)
                    return await func(*args, **kwargs)

                return _async_wrapper

            @wraps(func)
            def _sync_wrapper(*args: Any, **kwargs: Any) -> Any:
                _enforce(args, kwargs)
                return func(*args, **kwargs)

            return _sync_wrapper

        return _decorator