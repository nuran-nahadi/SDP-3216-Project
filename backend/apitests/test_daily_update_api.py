"""
Tests for the Daily Update API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
import json


class TestDailyUpdateAPI:
    """Test cases for the Proactive Daily Update Agent feature."""
    
    # ============== Session Tests ==============
    
    def test_start_session(self, client: TestClient, auth_headers: dict):
        """Test starting a new daily update session."""
        response = client.post(
            "/daily-updates/sessions/start",
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "id" in data["data"]
        assert data["data"]["is_active"] is True
        assert data["data"]["categories_covered"] == []
        assert "greeting" in data["meta"]
    
    def test_get_active_session_none(self, client: TestClient, auth_headers: dict):
        """Test getting active session when none exists."""
        response = client.get(
            "/daily-updates/sessions/active",
            headers=auth_headers
        )
        
        # Should return 404 if no session exists
        assert response.status_code in [200, 404]
    
    def test_start_and_get_session(self, client: TestClient, auth_headers: dict):
        """Test starting a session and then retrieving it."""
        # Start session
        start_response = client.post(
            "/daily-updates/sessions/start",
            headers=auth_headers
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["data"]["id"]
        
        # Get active session
        get_response = client.get(
            "/daily-updates/sessions/active",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        assert get_response.json()["data"]["id"] == session_id
    
    def test_end_session(self, client: TestClient, auth_headers: dict):
        """Test ending a daily update session."""
        # Start session first
        start_response = client.post(
            "/daily-updates/sessions/start",
            headers=auth_headers
        )
        session_id = start_response.json()["data"]["id"]
        
        # End session
        end_response = client.post(
            f"/daily-updates/sessions/{session_id}/end",
            headers=auth_headers
        )
        
        assert end_response.status_code == 200
        data = end_response.json()
        assert data["data"]["is_active"] is False
        assert data["data"]["ended_at"] is not None
    
    def test_get_conversation_state(self, client: TestClient, auth_headers: dict):
        """Test getting conversation state."""
        # Start session
        start_response = client.post(
            "/daily-updates/sessions/start",
            headers=auth_headers
        )
        session_id = start_response.json()["data"]["id"]
        
        # Get state
        state_response = client.get(
            f"/daily-updates/sessions/{session_id}/state",
            headers=auth_headers
        )
        
        assert state_response.status_code == 200
        data = state_response.json()
        assert len(data["data"]["categories_status"]) == 4
        assert data["data"]["is_complete"] is False
    
    # ============== Chat Tests ==============
    
    def test_chat_with_ai(self, client: TestClient, auth_headers: dict):
        """Test chatting with the AI interviewer."""
        # Start session
        start_response = client.post(
            "/daily-updates/sessions/start",
            headers=auth_headers
        )
        session_id = start_response.json()["data"]["id"]
        
        # Send message
        chat_response = client.post(
            f"/daily-updates/sessions/{session_id}/chat",
            headers=auth_headers,
            json={
                "session_id": session_id,
                "user_message": "I finished the project report today."
            }
        )
        
        assert chat_response.status_code == 200
        data = chat_response.json()
        assert "ai_response" in data["data"]
        assert "created_entries" in data["data"]
    
    def test_chat_inactive_session(self, client: TestClient, auth_headers: dict):
        """Test chatting with an inactive session fails."""
        # Start and end session
        start_response = client.post(
            "/daily-updates/sessions/start",
            headers=auth_headers
        )
        session_id = start_response.json()["data"]["id"]
        
        client.post(
            f"/daily-updates/sessions/{session_id}/end",
            headers=auth_headers
        )
        
        # Try to chat
        chat_response = client.post(
            f"/daily-updates/sessions/{session_id}/chat",
            headers=auth_headers,
            json={
                "session_id": session_id,
                "user_message": "Test message"
            }
        )
        
        assert chat_response.status_code == 400
    
    # ============== Pending Updates Tests ==============
    
    def test_create_pending_update(self, client: TestClient, auth_headers: dict):
        """Test creating a pending update manually."""
        response = client.post(
            "/daily-updates/pending",
            headers=auth_headers,
            json={
                "category": "expense",
                "summary": "Lunch at Subway",
                "raw_text": "Had lunch at Subway for $10",
                "structured_data": {
                    "amount": 10.00,
                    "currency": "USD",
                    "merchant": "Subway",
                    "expense_category": "food"
                }
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["category"] == "expense"
        assert data["data"]["summary"] == "Lunch at Subway"
        assert data["data"]["status"] == "pending"
    
    def test_get_pending_updates(self, client: TestClient, auth_headers: dict):
        """Test listing pending updates."""
        # Create a pending update first
        client.post(
            "/daily-updates/pending",
            headers=auth_headers,
            json={
                "category": "task",
                "summary": "Complete report",
                "structured_data": {"status": "pending"}
            }
        )
        
        # Get list
        response = client.get(
            "/daily-updates/pending",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "meta" in data
    
    def test_get_pending_summary(self, client: TestClient, auth_headers: dict):
        """Test getting pending updates summary."""
        response = client.get(
            "/daily-updates/pending/summary",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_pending" in data["data"]
        assert "by_category" in data["data"]
    
    def test_edit_pending_update(self, client: TestClient, auth_headers: dict):
        """Test editing a pending update."""
        # Create pending update
        create_response = client.post(
            "/daily-updates/pending",
            headers=auth_headers,
            json={
                "category": "expense",
                "summary": "Coffee",
                "structured_data": {"amount": 5}
            }
        )
        update_id = create_response.json()["data"]["id"]
        
        # Edit it
        edit_response = client.patch(
            f"/daily-updates/pending/{update_id}",
            headers=auth_headers,
            json={
                "summary": "Coffee at Starbucks",
                "structured_data": {"amount": 5.50, "merchant": "Starbucks"}
            }
        )
        
        assert edit_response.status_code == 200
        data = edit_response.json()
        assert data["data"]["summary"] == "Coffee at Starbucks"
        assert data["data"]["structured_data"]["amount"] == 5.50
    
    def test_accept_pending_update(self, client: TestClient, auth_headers: dict):
        """Test accepting a pending update."""
        # Create pending expense
        create_response = client.post(
            "/daily-updates/pending",
            headers=auth_headers,
            json={
                "category": "expense",
                "summary": "Bus fare",
                "structured_data": {
                    "amount": 2.50,
                    "currency": "USD",
                    "category": "transport"
                }
            }
        )
        update_id = create_response.json()["data"]["id"]
        
        # Accept it
        accept_response = client.post(
            f"/daily-updates/pending/{update_id}/accept",
            headers=auth_headers
        )
        
        assert accept_response.status_code == 200
        data = accept_response.json()
        assert data["success"] is True
        assert "created_item_id" in data["data"]
    
    def test_reject_pending_update(self, client: TestClient, auth_headers: dict):
        """Test rejecting a pending update."""
        # Create pending update
        create_response = client.post(
            "/daily-updates/pending",
            headers=auth_headers,
            json={
                "category": "task",
                "summary": "Wrong task",
                "structured_data": {}
            }
        )
        update_id = create_response.json()["data"]["id"]
        
        # Reject it
        reject_response = client.post(
            f"/daily-updates/pending/{update_id}/reject",
            headers=auth_headers
        )
        
        assert reject_response.status_code == 200
        assert reject_response.json()["data"]["status"] == "rejected"
    
    def test_delete_pending_update(self, client: TestClient, auth_headers: dict):
        """Test deleting a pending update."""
        # Create pending update
        create_response = client.post(
            "/daily-updates/pending",
            headers=auth_headers,
            json={
                "category": "journal",
                "summary": "Test entry",
                "structured_data": {"content": "Test"}
            }
        )
        update_id = create_response.json()["data"]["id"]
        
        # Delete it
        delete_response = client.delete(
            f"/daily-updates/pending/{update_id}",
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200
        
        # Verify it's gone
        get_response = client.get(
            f"/daily-updates/pending/{update_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404
    
    def test_accept_all_pending(self, client: TestClient, auth_headers: dict):
        """Test accepting all pending updates at once."""
        # Create multiple pending updates
        for i in range(3):
            client.post(
                "/daily-updates/pending",
                headers=auth_headers,
                json={
                    "category": "expense",
                    "summary": f"Expense {i}",
                    "structured_data": {
                        "amount": 10 * (i + 1),
                        "currency": "USD",
                        "category": "other"
                    }
                }
            )
        
        # Accept all
        response = client.post(
            "/daily-updates/pending/accept-all",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "successful" in data["meta"]
    
    # ============== Filter Tests ==============
    
    def test_filter_pending_by_category(self, client: TestClient, auth_headers: dict):
        """Test filtering pending updates by category."""
        # Create different category updates
        for category in ["task", "expense", "event"]:
            client.post(
                "/daily-updates/pending",
                headers=auth_headers,
                json={
                    "category": category,
                    "summary": f"Test {category}",
                    "structured_data": {}
                }
            )
        
        # Filter by expense
        response = client.get(
            "/daily-updates/pending?category=expense",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        # All returned items should be expenses
        for item in response.json()["data"]:
            assert item["category"] == "expense"
    
    def test_filter_pending_by_status(self, client: TestClient, auth_headers: dict):
        """Test filtering pending updates by status."""
        response = client.get(
            "/daily-updates/pending?status=pending",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        # All returned items should be pending
        for item in response.json()["data"]:
            assert item["status"] == "pending"
