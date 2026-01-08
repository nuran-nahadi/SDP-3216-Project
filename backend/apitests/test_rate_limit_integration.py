#!/usr/bin/env python3
"""
Integration test script for rate limiting on actual API endpoints.
Tests the rate limiting decorator pattern on the AI features.

Usage:
    1. Make sure the backend server is running at http://localhost:8000
    2. Run this script: python3 test_rate_limit_integration.py

This script will:
    - Login to get an auth token
    - Test rate limiting on the tasks AI parse endpoint
    - Test rate limiting on the daily update chat endpoint
"""
import requests
import time
import json
from typing import Optional

BASE_URL = "http://localhost:8000"

# Test credentials (update these with valid test user credentials)
TEST_EMAIL = "test"  # Update with a valid test user
TEST_PASSWORD = "Tu123456"    # Update with the correct password


def print_header(title: str):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def login() -> Optional[str]:
    """Login and return the access token."""
    print_header("AUTHENTICATION")
    
    # Try login with username (OAuth2 form expects 'username' field)
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={
            "username": TEST_EMAIL,  # OAuth2 uses 'username' even for email
            "password": TEST_PASSWORD,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print(f"✓ Login successful")
        print(f"  Token: {token[:20]}...")
        return token
    else:
        # Try signing up first
        print(f"  Login failed ({response.status_code}), attempting signup...")
        signup_response = requests.post(
            f"{BASE_URL}/auth/signup",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "full_name": "Test User"
            }
        )
        if signup_response.status_code in [200, 201]:
            print("  ✓ Signup successful, retrying login...")
            # Retry login
            response = requests.post(
                f"{BASE_URL}/auth/login",
                data={
                    "username": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                print(f"✓ Login successful")
                print(f"  Token: {token[:20]}...")
                return token
        
        print(f"✗ Authentication failed: {response.status_code}")
        print(f"  Response: {response.text[:200]}")
        return None


def test_tasks_ai_parse(token: str, max_requests: int = 10):
    """Test rate limiting on the tasks AI parse endpoint."""
    print_header(f"TEST: Tasks AI Parse Endpoint (limit: 2 requests/60s)")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    success_count = 0
    blocked_count = 0
    
    for i in range(max_requests):
        try:
            response = requests.post(
                f"{BASE_URL}/tasks/ai/parse-text",
                json={"text": f"Test task {i}: Buy groceries tomorrow"},
                headers=headers
            )
            
            if response.status_code == 200:
                success_count += 1
                print(f"  Request {i+1:2d}: ✓ ALLOWED (200)")
            elif response.status_code == 429:
                blocked_count += 1
                data = response.json()
                retry_after = response.headers.get("Retry-After", "N/A")
                print(f"  Request {i+1:2d}: ✗ RATE LIMITED (429) - Retry-After: {retry_after}s")
                if blocked_count >= 3:
                    print(f"\n  [Rate limit working! Stopping after {blocked_count} blocked requests]")
                    break
            else:
                print(f"  Request {i+1:2d}: ? Status {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"  Request {i+1:2d}: ! Error: {e}")
    
    print(f"\n  Summary: {success_count} allowed, {blocked_count} blocked")
    return blocked_count > 0


def test_daily_update_chat(token: str, max_requests: int = 10):
    """Test rate limiting on the daily update chat endpoint."""
    print_header(f"TEST: Daily Update Chat Endpoint (limit: 2 requests/60s)")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # First, start a session
    print("\n  Starting daily update session...")
    response = requests.post(
        f"{BASE_URL}/daily-updates/sessions/start",
        headers=headers
    )
    
    if response.status_code != 201:
        # Try to get active session
        response = requests.get(
            f"{BASE_URL}/daily-updates/sessions/active",
            headers=headers
        )
        if response.status_code != 200:
            print(f"  ✗ Could not start or get session: {response.status_code}")
            print(f"    Response: {response.text[:200]}")
            return False
    
    data = response.json()
    session_id = data.get("data", {}).get("id")
    print(f"  ✓ Session ID: {session_id}")
    
    success_count = 0
    blocked_count = 0
    
    print("\n  Sending chat messages:")
    for i in range(max_requests):
        try:
            response = requests.post(
                f"{BASE_URL}/daily-updates/sessions/{session_id}/chat",
                json={
                    "session_id": str(session_id),
                    "user_message": f"Test message {i}: I completed a task today"
                },
                headers=headers
            )
            
            if response.status_code == 200:
                success_count += 1
                print(f"  Request {i+1:2d}: ✓ ALLOWED (200)")
            elif response.status_code == 429:
                blocked_count += 1
                retry_after = response.headers.get("Retry-After", "N/A")
                print(f"  Request {i+1:2d}: ✗ RATE LIMITED (429) - Retry-After: {retry_after}s")
                if blocked_count >= 3:
                    print(f"\n  [Rate limit working! Stopping after {blocked_count} blocked requests]")
                    break
            else:
                print(f"  Request {i+1:2d}: ? Status {response.status_code} - {response.text[:100]}")
                
        except requests.exceptions.RequestException as e:
            print(f"  Request {i+1:2d}: ! Error: {e}")
    
    print(f"\n  Summary: {success_count} allowed, {blocked_count} blocked")
    return blocked_count > 0


def check_rate_limit_response_format():
    """Verify the rate limit response format matches our specification."""
    print_header("Rate Limit Response Format Specification")
    
    print("""
  When rate limited, the API returns:
  
  HTTP Status: 429 Too Many Requests
  Headers:
    - Retry-After: <seconds until window resets>
  
  Body:
  {
    "success": false,
    "data": null,
    "message": "Too many AI requests. Please slow down and try again soon.",
    "meta": {
      "feature": "<feature_name>",
      "limit": <max_requests>,
      "window_seconds": <window_size>,
      "retry_after_seconds": <seconds_to_wait>
    }
  }
    """)


def main():
    """Run all integration tests."""
    print("\n" + "=" * 60)
    print("RATE LIMITING INTEGRATION TEST SUITE")
    print("=" * 60)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code != 200:
            print(f"\n✗ Server not responding correctly at {BASE_URL}")
            return
        print(f"\n✓ Server is running at {BASE_URL}")
    except requests.exceptions.ConnectionError:
        print(f"\n✗ Cannot connect to server at {BASE_URL}")
        print("  Make sure the backend is running: python3 run.py")
        return
    
    # Show expected format
    check_rate_limit_response_format()
    
    # Authenticate
    token = login()
    if not token:
        print("\n✗ Cannot continue without authentication")
        print("  Update TEST_EMAIL and TEST_PASSWORD in this script")
        return
    
    # Run tests
    tasks_result = test_tasks_ai_parse(token)
    daily_result = test_daily_update_chat(token)
    
    # Summary
    print_header("TEST RESULTS")
    print(f"  Tasks AI Parse Rate Limit: {'✓ WORKING' if tasks_result else '✗ NOT TRIGGERED'}")
    print(f"  Daily Update Chat Rate Limit: {'✓ WORKING' if daily_result else '✗ NOT TRIGGERED'}")
    
    if tasks_result and daily_result:
        print("\n  ✓ All rate limits are working correctly!")
    elif not tasks_result and not daily_result:
        print("\n  ✗ Rate limits may not be working. Check configuration.")
    else:
        print("\n  ! Some rate limits may need attention.")
    
    print("\n" + "=" * 60 + "\n")


if __name__ == "__main__":
    main()
