#!/usr/bin/env python3
"""
Quick Health Check Test Script
Run this after starting the backend to verify all services are healthy
"""
import requests
import json

print("🔍 Testing PresAI Health Checks...\n")

try:
    # Test basic health
    print("1️⃣  Basic Health Check...")
    response = requests.get("http://localhost:8000/health", timeout=5)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}\n")
    
    # Test detailed health
    print("2️⃣  Detailed Health Check...")
    response = requests.get("http://localhost:8000/health/detailed", timeout=10)
    data = response.json()
    
    print(f"   Overall Status: {data['status'].upper()}")
    print(f"   Checks Passed: {data['summary']['passed']}/{data['summary']['total_checks']}")
    
    if data['summary']['warnings'] > 0:
        print(f"   ⚠️  Warnings: {data['summary']['warnings']}")
    
    if data['summary']['errors'] > 0:
        print(f"   ❌ Errors: {data['summary']['errors']}")
    
    print("\n   Detailed Results:")
    print("   " + "-" * 60)
    for check in data['checks']:
        icon = "✅" if check['status'] == 'ok' else ("⚠️" if check['status'] == 'warning' else "❌")
        print(f"   {icon} {check['name']}: {check['message']}")
        if check.get('details'):
            for key, value in check['details'].items():
                if isinstance(value, list):
                    print(f"      • {key}: {', '.join(value[:3])}{'...' if len(value) > 3 else ''}")
                else:
                    print(f"      • {key}: {value}")
    
    print("   " + "-" * 60)
    
    # Show recommendations
    errors = [c for c in data['checks'] if c['status'] == 'error']
    if errors:
        print("\n❌ FAILED CHECKS - Action Required:")
        for check in errors:
            print(f"   • {check['name']}: {check['message']}")
            print(f"     → Check your .env configuration for this service")
    
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to backend server!")
    print("   Make sure it's running: cd backend && uv run python main.py")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n✨ Done!")
