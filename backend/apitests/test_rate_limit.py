#!/usr/bin/env python3
"""
Test script to verify the rate limiting decorator pattern implementation.
This script tests both the core decorator functionality and the AI rate limit wrapper.
"""
import asyncio
import time

# Test the core rate limiting components
from app.services.decorators.rate_limit import (
    RateLimitManager,
    RateLimitExceededError,
    InMemoryRateLimiter,
)


def test_in_memory_rate_limiter():
    """Test the InMemoryRateLimiter directly."""
    print("\n" + "=" * 60)
    print("TEST 1: InMemoryRateLimiter (3 requests per 5 seconds)")
    print("=" * 60)
    
    limiter = InMemoryRateLimiter(requests=3, window_seconds=5)
    
    for i in range(5):
        result = limiter.check("user_123")
        if result is None:
            print(f"  Request {i+1}: ✓ ALLOWED")
        else:
            print(f"  Request {i+1}: ✗ BLOCKED (retry after {result:.2f}s)")
    
    print("\n  [Waiting 5 seconds for window to reset...]\n")
    time.sleep(5)
    
    result = limiter.check("user_123")
    if result is None:
        print(f"  Request 6: ✓ ALLOWED (window reset)")
    else:
        print(f"  Request 6: ✗ BLOCKED (retry after {result:.2f}s)")


def test_rate_limit_manager_sync():
    """Test the RateLimitManager with synchronous functions."""
    print("\n" + "=" * 60)
    print("TEST 2: RateLimitManager with Sync Function (2 requests per 3s)")
    print("=" * 60)
    
    manager = RateLimitManager(default_requests=2, default_window_seconds=3)
    
    @manager.decorator("sync_feature", key_param="user_id")
    def process_request(user_id: str, data: str) -> str:
        return f"Processed '{data}' for user {user_id}"
    
    user_id = "test_user"
    
    for i in range(4):
        try:
            result = process_request(user_id, f"data_{i}")
            print(f"  Request {i+1}: ✓ {result}")
        except RateLimitExceededError as e:
            print(f"  Request {i+1}: ✗ BLOCKED - {e.feature} (retry after {e.retry_after:.2f}s)")


def test_rate_limit_manager_async():
    """Test the RateLimitManager with asynchronous functions."""
    print("\n" + "=" * 60)
    print("TEST 3: RateLimitManager with Async Function (2 requests per 3s)")
    print("=" * 60)
    
    manager = RateLimitManager(default_requests=2, default_window_seconds=3)
    
    @manager.decorator("async_feature", key_param="user_id")
    async def async_process_request(user_id: str, data: str) -> str:
        await asyncio.sleep(0.01)  # Simulate async work
        return f"Async processed '{data}' for user {user_id}"
    
    async def run_async_test():
        user_id = "async_user"
        
        for i in range(4):
            try:
                result = await async_process_request(user_id, f"data_{i}")
                print(f"  Request {i+1}: ✓ {result}")
            except RateLimitExceededError as e:
                print(f"  Request {i+1}: ✗ BLOCKED - {e.feature} (retry after {e.retry_after:.2f}s)")
    
    asyncio.run(run_async_test())


def test_per_user_isolation():
    """Test that rate limits are isolated per user."""
    print("\n" + "=" * 60)
    print("TEST 4: Per-User Rate Limit Isolation")
    print("=" * 60)
    
    manager = RateLimitManager(default_requests=2, default_window_seconds=60)
    
    @manager.decorator("user_isolated_feature", key_param="user_id")
    def isolated_request(user_id: str) -> str:
        return f"Processed for {user_id}"
    
    # User A makes 3 requests (2 allowed, 1 blocked)
    print("\n  User A:")
    for i in range(3):
        try:
            result = isolated_request("user_A")
            print(f"    Request {i+1}: ✓ ALLOWED")
        except RateLimitExceededError:
            print(f"    Request {i+1}: ✗ BLOCKED")
    
    # User B should still be able to make requests
    print("\n  User B (separate limit):")
    for i in range(3):
        try:
            result = isolated_request("user_B")
            print(f"    Request {i+1}: ✓ ALLOWED")
        except RateLimitExceededError:
            print(f"    Request {i+1}: ✗ BLOCKED")


def test_custom_key_function():
    """Test using a custom key function for rate limiting."""
    print("\n" + "=" * 60)
    print("TEST 5: Custom Key Function")
    print("=" * 60)
    
    manager = RateLimitManager(default_requests=2, default_window_seconds=60)
    
    # Custom key function that extracts user ID from a dict
    def extract_user_key(request: dict) -> str:
        return request.get("user_id", "anonymous")
    
    @manager.decorator("custom_key_feature", key_func=extract_user_key)
    def handle_request(request: dict) -> str:
        return f"Handled request for {request.get('user_id')}"
    
    for i in range(3):
        try:
            result = handle_request({"user_id": "custom_user", "data": f"payload_{i}"})
            print(f"  Request {i+1}: ✓ {result}")
        except RateLimitExceededError as e:
            print(f"  Request {i+1}: ✗ BLOCKED (retry after {e.retry_after:.2f}s)")


def test_ai_rate_limit_wrapper():
    """Test the AI-specific rate limit wrapper."""
    print("\n" + "=" * 60)
    print("TEST 6: AI Rate Limit Wrapper")
    print("=" * 60)
    
    from app.services.ai_rate_limit import ai_rate_limit
    from app.core.config import settings
    
    print(f"  AI Rate Limit Enabled: {settings.ai_rate_limit_enabled}")
    print(f"  Default Requests/Window: {settings.ai_rate_limit_requests_per_window}")
    print(f"  Default Window Seconds: {settings.ai_rate_limit_window_seconds}")
    print(f"  Daily Update Requests: {settings.daily_update_rate_limit_requests}")
    print(f"  Daily Update Window: {settings.daily_update_rate_limit_window_seconds}")
    
    # Test with custom limits (2 requests per 3 seconds for quick testing)
    @ai_rate_limit("test_ai_feature", key_param="user_id", requests=2, window_seconds=3)
    def ai_request(user_id: str, query: str) -> str:
        return f"AI processed '{query}' for {user_id}"
    
    print("\n  Testing AI rate limit (2 requests per 3s):")
    for i in range(4):
        try:
            result = ai_request("ai_user", f"query_{i}")
            print(f"    Request {i+1}: ✓ {result}")
        except RateLimitExceededError as e:
            print(f"    Request {i+1}: ✗ BLOCKED - {e.feature} (retry after {e.retry_after:.2f}s)")


def test_exception_details():
    """Test that RateLimitExceededError contains useful details."""
    print("\n" + "=" * 60)
    print("TEST 7: Exception Details")
    print("=" * 60)
    
    manager = RateLimitManager(default_requests=1, default_window_seconds=10)
    
    @manager.decorator("exception_test", key_param="user_id")
    def single_request(user_id: str) -> str:
        return "OK"
    
    # First request should pass
    single_request("exc_user")
    print("  First request: ✓ ALLOWED")
    
    # Second request should fail with detailed exception
    try:
        single_request("exc_user")
    except RateLimitExceededError as e:
        print(f"  Second request: ✗ BLOCKED")
        print(f"    - Feature: {e.feature}")
        print(f"    - Limit: {e.limit} requests")
        print(f"    - Window: {e.window_seconds} seconds")
        print(f"    - Retry After: {e.retry_after:.2f} seconds")


def main():
    """Run all rate limiting tests."""
    print("\n" + "=" * 60)
    print("RATE LIMITING DECORATOR PATTERN - TEST SUITE")
    print("=" * 60)
    
    test_in_memory_rate_limiter()
    test_rate_limit_manager_sync()
    test_rate_limit_manager_async()
    test_per_user_isolation()
    test_custom_key_function()
    test_ai_rate_limit_wrapper()
    test_exception_details()
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
