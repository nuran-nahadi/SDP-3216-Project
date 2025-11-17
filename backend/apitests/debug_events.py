#!/usr/bin/env python3
"""
Debug script to test failing Events API endpoints and get detailed error info
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0YzkyMjVmLTFlYWEtNDUwZC1hMWU1LWY5ZTcyZGNjZjgzMiIsImV4cCI6MTc2MzM5MTEyOH0.4Tof-5ADdnMZm4aNupEtwMjoXBqEYR2W92ATZnvnGqY"

headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

def test_endpoint(name, url, method="GET", data=None):
    """Test an endpoint and show detailed error information"""
    print(f"\n=== Testing {name} ===")
    print(f"URL: {url}")
    print(f"Method: {method}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        # Print raw response text first
        print(f"Raw Response: {response.text[:500]}...")
        
        # Try to parse JSON
        try:
            json_data = response.json()
            print(f"JSON Response: {json.dumps(json_data, indent=2, default=str)}")
        except ValueError as e:
            print(f"JSON Parse Error: {e}")
            
    except Exception as e:
        print(f"Request Error: {e}")

# Test the failing endpoints
if __name__ == "__main__":
    print("🔍 Debug Events API - Testing Failing Endpoints")
    
    # 1. Test get all events (Status 500)
    test_endpoint("Get All Events", f"{BASE_URL}/events/")
    
    # 2. Test calendar view (Status 500)
    now = datetime.now()
    test_endpoint("Calendar View", f"{BASE_URL}/events/calendar/{now.year}/{now.month}")
    
    # 3. Test upcoming events (Status 422)
    test_endpoint("Upcoming Events", f"{BASE_URL}/events/upcoming")
    
    # 4. Test with query parameters
    test_endpoint("Upcoming Events with days=7", f"{BASE_URL}/events/upcoming?days=7")
    
    print("\n🎉 Debug complete!")