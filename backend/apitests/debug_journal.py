#!/usr/bin/env python3
"""
Debug script to test failing Journal API endpoints and get detailed error info
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0YzkyMjVmLTFlYWEtNDUwZC1hMWU1LWY5ZTcyZGNjZjgzMiIsImV4cCI6MTc2MzM5MTEyOH0.4Tof-5ADdnMZm4aNupEtwMjoXBqEYR2W92ATZnvnGqY"

headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

def test_endpoint(name, url, method="GET", data=None, params=None):
    """Test an endpoint and show detailed error information"""
    print(f"\n=== Testing {name} ===")
    print(f"URL: {url}")
    print(f"Method: {method}")
    if params:
        print(f"Params: {params}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params)
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
    print("🔍 Debug Journal API - Testing Failing Endpoints")
    
    # 1. Test journal statistics (Status 422)
    test_endpoint("Journal Statistics", f"{BASE_URL}/journal/stats")
    
    # 2. Test mood trends (Status 422)
    test_endpoint("Mood Trends", f"{BASE_URL}/journal/mood-trends", params={"days": 7})
    
    # 3. Test mood trends without parameters
    test_endpoint("Mood Trends (no params)", f"{BASE_URL}/journal/mood-trends")
    
    print("\n🎉 Debug complete!")