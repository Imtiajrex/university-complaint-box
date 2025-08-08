#!/usr/bin/env python3
"""
Backend smoke tests for University Complaint Box API
Tests all endpoints with proper authentication flow
"""

import requests
import time
import json
import os
import sys

# Get the base URL from environment or use default
PREVIEW_HOST = os.getenv('PREVIEW_PROXY_SERVICE_SERVICE_HOST', 'localhost')
BASE_URL = f"http://{PREVIEW_HOST}"

def wait_for_backend(max_wait=20):
    """Wait for backend to be ready"""
    print(f"Waiting for backend at {BASE_URL} to be ready...")
    for i in range(max_wait):
        try:
            response = requests.get(f"{BASE_URL}/api/health", timeout=2)
            if response.status_code == 200:
                print(f"✅ Backend ready after {i+1} seconds")
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(1)
    print(f"❌ Backend not ready after {max_wait} seconds")
    return False

def test_health_check():
    """Test 1: Health check endpoint"""
    print("\n🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected status 'ok', got {data}"
        print("✅ Health check passed")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_register_student():
    """Test 2: Register student"""
    print("\n🔍 Testing student registration...")
    try:
        payload = {
            "name": "Student One",
            "email": "student1@example.com", 
            "password": "password123",
            "role": "student",
            "department": "computer-science",
            "studentId": "STU1001"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, f"No access_token in response: {data}"
        print("✅ Student registration passed")
        return data["access_token"]
    except Exception as e:
        print(f"❌ Student registration failed: {e}")
        return None

def test_auth_me(token):
    """Test 3: Get current user info"""
    print("\n🔍 Testing /api/auth/me...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("role") == "student", f"Expected role 'student', got {data.get('role')}"
        assert data.get("email") == "student1@example.com", f"Expected email 'student1@example.com', got {data.get('email')}"
        print("✅ Auth me passed")
        return data
    except Exception as e:
        print(f"❌ Auth me failed: {e}")
        return None

def test_create_complaint(token):
    """Test 4: Create complaint"""
    print("\n🔍 Testing complaint creation...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "title": "Library WiFi slow",
            "description": "WiFi is very slow especially in the evening, causing issues to submit assignments.",
            "category": "technical",
            "department": "it-services",
            "isAnonymous": False
        }
        response = requests.post(f"{BASE_URL}/api/complaints", json=payload, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, f"No complaint id in response: {data}"
        assert data.get("title") == "Library WiFi slow", f"Title mismatch: {data.get('title')}"
        print("✅ Complaint creation passed")
        return data["id"]
    except Exception as e:
        print(f"❌ Complaint creation failed: {e}")
        return None

def test_list_complaints(token):
    """Test 5: List complaints"""
    print("\n🔍 Testing complaint listing...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/complaints", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) == 1, f"Expected 1 complaint, got {len(data)}"
        print("✅ Complaint listing passed")
        return True
    except Exception as e:
        print(f"❌ Complaint listing failed: {e}")
        return False

def test_register_admin():
    """Test 6: Register admin"""
    print("\n🔍 Testing admin registration...")
    try:
        payload = {
            "name": "Admin One",
            "email": "admin1@example.com",
            "password": "password123", 
            "role": "admin",
            "department": "it-services"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, f"No access_token in response: {data}"
        print("✅ Admin registration passed")
        return data["access_token"]
    except Exception as e:
        print(f"❌ Admin registration failed: {e}")
        return None

def test_admin_auth_me(token):
    """Test 7: Admin auth me"""
    print("\n🔍 Testing admin /api/auth/me...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("role") == "admin", f"Expected role 'admin', got {data.get('role')}"
        print("✅ Admin auth me passed")
        return True
    except Exception as e:
        print(f"❌ Admin auth me failed: {e}")
        return False

def test_admin_update_status(admin_token, complaint_id):
    """Test 8: Admin update complaint status"""
    print("\n🔍 Testing admin status update...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.patch(f"{BASE_URL}/api/complaints/{complaint_id}/status?new_status=in-progress", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "in-progress", f"Expected status 'in-progress', got {data.get('status')}"
        print("✅ Admin status update passed")
        return True
    except Exception as e:
        print(f"❌ Admin status update failed: {e}")
        return False

def test_admin_add_response(admin_token, complaint_id):
    """Test 9: Admin add response"""
    print("\n🔍 Testing admin response addition...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        payload = {"content": "We're looking into it"}
        response = requests.post(f"{BASE_URL}/api/complaints/{complaint_id}/responses", json=payload, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert len(data.get("responses", [])) == 1, f"Expected 1 response, got {len(data.get('responses', []))}"
        print("✅ Admin response addition passed")
        return True
    except Exception as e:
        print(f"❌ Admin response addition failed: {e}")
        return False

def test_student_add_feedback(student_token, complaint_id):
    """Test 10: Student add feedback"""
    print("\n🔍 Testing student feedback addition...")
    try:
        headers = {"Authorization": f"Bearer {student_token}"}
        payload = {"rating": 4, "comment": "Thanks"}
        response = requests.post(f"{BASE_URL}/api/complaints/{complaint_id}/feedback", json=payload, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("feedback") is not None, f"Expected feedback to be present: {data}"
        assert data.get("feedback", {}).get("rating") == 4, f"Expected rating 4, got {data.get('feedback', {}).get('rating')}"
        print("✅ Student feedback addition passed")
        return True
    except Exception as e:
        print(f"❌ Student feedback addition failed: {e}")
        return False

def test_negative_student_status_update(student_token, complaint_id):
    """Test 11: Negative test - student tries to update status"""
    print("\n🔍 Testing negative case - student status update...")
    try:
        headers = {"Authorization": f"Bearer {student_token}"}
        response = requests.patch(f"{BASE_URL}/api/complaints/{complaint_id}/status?new_status=resolved", headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("✅ Negative test passed - student correctly denied status update")
        return True
    except Exception as e:
        print(f"❌ Negative test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting University Complaint Box Backend Smoke Tests")
    print(f"🌐 Base URL: {BASE_URL}")
    
    # Wait for backend
    if not wait_for_backend():
        print("❌ Backend not ready, exiting")
        sys.exit(1)
    
    # Test sequence
    tests_passed = 0
    total_tests = 11
    
    # Test 1: Health check
    if test_health_check():
        tests_passed += 1
    
    # Test 2: Register student
    student_token = test_register_student()
    if student_token:
        tests_passed += 1
    else:
        print("❌ Cannot continue without student token")
        sys.exit(1)
    
    # Test 3: Student auth me
    if test_auth_me(student_token):
        tests_passed += 1
    
    # Test 4: Create complaint
    complaint_id = test_create_complaint(student_token)
    if complaint_id:
        tests_passed += 1
    else:
        print("❌ Cannot continue without complaint ID")
        sys.exit(1)
    
    # Test 5: List complaints
    if test_list_complaints(student_token):
        tests_passed += 1
    
    # Test 6: Register admin
    admin_token = test_register_admin()
    if admin_token:
        tests_passed += 1
    else:
        print("❌ Cannot continue without admin token")
        sys.exit(1)
    
    # Test 7: Admin auth me
    if test_admin_auth_me(admin_token):
        tests_passed += 1
    
    # Test 8: Admin update status
    if test_admin_update_status(admin_token, complaint_id):
        tests_passed += 1
    
    # Test 9: Admin add response
    if test_admin_add_response(admin_token, complaint_id):
        tests_passed += 1
    
    # Test 10: Student add feedback
    if test_student_add_feedback(student_token, complaint_id):
        tests_passed += 1
    
    # Test 11: Negative test
    if test_negative_student_status_update(student_token, complaint_id):
        tests_passed += 1
    
    # Summary
    print(f"\n📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed!")
        return True
    else:
        print(f"❌ {total_tests - tests_passed} tests failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)