#!/usr/bin/env python3
"""
Test script for LIN Expense Management API endpoints
"""

import requests
import json
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "tu"
EMAIL = "tu@gmail.com"
PASSWORD = "t"

def test_expense_endpoints():
    """Test all expense-related endpoints"""
    
    # Step 1: Register and login to get token
    print("🔑 Step 1: Authentication")
    
    # Register user
    register_data = {
        "full_name": "Test User",
        "username": USERNAME,
        "email": EMAIL,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=register_data)
        if response.status_code == 201:
            print("✅ User registered successfully")
        else:
            print("ℹ️ User might already exist, proceeding with login")
    except Exception as e:
        print(f"⚠️ Registration error: {e}")
    
    # Login to get token
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
            print("✅ Login successful, token obtained")
        else:
            print(f"❌ Login failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 2: Test expense creation
    print("\n💰 Step 2: Create Expenses")
    
    # Create sample expenses
    sample_expenses = [
        {
            "amount": 12.50,
            "currency": "USD",
            "category": "food",
            "subcategory": "coffee",
            "merchant": "Starbucks",
            "description": "Morning coffee",
            "date": datetime.now().isoformat(),
            "payment_method": "credit_card",
            "tags": ["morning", "caffeine"]
        },
        {
            "amount": 35.75,
            "currency": "USD",
            "category": "food",
            "subcategory": "dinner",
            "merchant": "Italian Restaurant",
            "description": "Dinner with friends",
            "date": (datetime.now() - timedelta(days=1)).isoformat(),
            "payment_method": "credit_card",
            "tags": ["dinner", "social"]
        },
        {
            "amount": 15.00,
            "currency": "USD",
            "category": "transport",
            "subcategory": "taxi",
            "merchant": "Uber",
            "description": "Ride to work",
            "date": (datetime.now() - timedelta(days=2)).isoformat(),
            "payment_method": "digital_wallet",
            "tags": ["commute"]
        }
    ]
    
    created_expense_ids = []
    
    for i, expense_data in enumerate(sample_expenses):
        try:
            response = requests.post(f"{BASE_URL}/expenses", json=expense_data, headers=headers)
            if response.status_code == 201:
                expense = response.json()["data"]
                created_expense_ids.append(expense["id"])
                print(f"✅ Created expense {i+1}: ${expense['amount']} for {expense['category']}")
            else:
                print(f"❌ Failed to create expense {i+1}: {response.text}")
        except Exception as e:
            print(f"❌ Error creating expense {i+1}: {e}")
    
    # Step 3: Test getting expenses
    print("\n📋 Step 3: Retrieve Expenses")
    
    try:
        response = requests.get(f"{BASE_URL}/expenses", headers=headers)
        if response.status_code == 200:
            expenses_data = response.json()
            expenses = expenses_data["data"]
            print(f"✅ Retrieved {len(expenses)} expenses")
            print(f"ℹ️ Total pages: {expenses_data['meta']['pages']}")
        else:
            print(f"❌ Failed to retrieve expenses: {response.text}")
    except Exception as e:
        print(f"❌ Error retrieving expenses: {e}")
    
    # Step 4: Test expense filtering
    print("\n🔍 Step 4: Filter Expenses")
    
    try:
        # Filter by category
        response = requests.get(f"{BASE_URL}/expenses?category=food", headers=headers)
        if response.status_code == 200:
            food_expenses = response.json()["data"]
            print(f"✅ Found {len(food_expenses)} food expenses")
        
        # Filter by amount range
        response = requests.get(f"{BASE_URL}/expenses?min_amount=20&max_amount=50", headers=headers)
        if response.status_code == 200:
            filtered_expenses = response.json()["data"]
            print(f"✅ Found {len(filtered_expenses)} expenses in $20-$50 range")
    except Exception as e:
        print(f"❌ Error filtering expenses: {e}")
    
    # Step 5: Test specific expense retrieval
    print("\n🎯 Step 5: Get Specific Expense")
    
    if created_expense_ids:
        try:
            expense_id = created_expense_ids[0]
            response = requests.get(f"{BASE_URL}/expenses/{expense_id}", headers=headers)
            if response.status_code == 200:
                expense = response.json()["data"]
                print(f"✅ Retrieved expense: ${expense['amount']} at {expense['merchant']}")
            else:
                print(f"❌ Failed to retrieve specific expense: {response.text}")
        except Exception as e:
            print(f"❌ Error retrieving specific expense: {e}")
    
    # Step 6: Test expense update
    print("\n✏️ Step 6: Update Expense")
    
    if created_expense_ids:
        try:
            expense_id = created_expense_ids[0]
            update_data = {
                "amount": 13.00,
                "description": "Large morning coffee (updated)"
            }
            response = requests.put(f"{BASE_URL}/expenses/{expense_id}", json=update_data, headers=headers)
            if response.status_code == 200:
                updated_expense = response.json()["data"]
                print(f"✅ Updated expense: ${updated_expense['amount']} - {updated_expense['description']}")
            else:
                print(f"❌ Failed to update expense: {response.text}")
        except Exception as e:
            print(f"❌ Error updating expense: {e}")
    
    # # Step 7: Test natural language parsing (AI-powered)
    # print("\n🤖 Step 7: Parse Natural Language with AI")
    
    # test_phrases = [
    #     "I spent $25 on lunch at McDonald's",
    #     "Paid 50 dollars for gas yesterday",
    #     "Coffee cost me 4.50 this morning"
    # ]
    
    # for phrase in test_phrases:
    #     try:
    #         parse_data = {"text": phrase}
    #         response = requests.post(f"{BASE_URL}/expenses/ai/parse-text", json=parse_data, headers=headers)
    #         if response.status_code == 201:  # AI endpoints return 201 Created
    #             parsed = response.json()["data"]
    #             print(f"✅ Parsed: '{phrase}' → ${parsed['amount']} ({parsed['category']})")
    #         else:
    #             print(f"❌ Failed to parse: '{phrase}' - Status: {response.status_code}, Response: {response.text}")
    #     except Exception as e:
    #         print(f"❌ Error parsing: '{phrase}' - {e}")
    
    # Step 8: Test monthly expenses
    print("\n📅 Step 8: Get Monthly Expenses")
    
    try:
        current_year = datetime.now().year
        current_month = datetime.now().month
        response = requests.get(f"{BASE_URL}/expenses/monthly/{current_year}/{current_month}", headers=headers)
        if response.status_code == 200:
            monthly = response.json()["data"]
            print(f"✅ {current_month}/{current_year}: ${monthly['total_amount']:.2f} ({monthly['count']} expenses)")
        else:
            print(f"❌ Failed to get monthly expenses: {response.text}")
    except Exception as e:
        print(f"❌ Error getting monthly expenses: {e}")
    
    
    # Step 9: Test expense deletion
    print("\n🗑️ Step 9: Delete Expense")
    
    if created_expense_ids and len(created_expense_ids) > 1:
        try:
            expense_id = created_expense_ids[-1]  # Delete the last one
            response = requests.delete(f"{BASE_URL}/expenses/{expense_id}", headers=headers)
            if response.status_code == 200:
                deleted_expense = response.json()["data"]
                print(f"✅ Deleted expense: ${deleted_expense['amount']} at {deleted_expense['merchant']}")
            else:
                print(f"❌ Failed to delete expense: {response.text}")
        except Exception as e:
            print(f"❌ Error deleting expense: {e}")
    
    print("\n🎉 Expense API testing completed!")



if __name__ == "__main__":
    print("🧪 LIN Expense Management API Test Suite")
    print("=" * 50)
    test_expense_endpoints()
