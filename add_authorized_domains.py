#!/usr/bin/env python3
"""
Script to add authorized domains to Firebase project using Admin SDK
"""
import json
import requests

# Load service account credentials
with open('/home/ubuntu/nexo/nexo-jtsky100-firebase-adminsdk-fbsvc-664c1d9a28.json', 'r') as f:
    service_account = json.load(f)

project_id = service_account['project_id']

print(f"Project ID: {project_id}")
print("\nNote: Firebase Admin SDK does not provide a direct API to manage authorized domains.")
print("Authorized domains must be managed through the Firebase Console.")
print("\nTo add authorized domains:")
print(f"1. Go to: https://console.firebase.google.com/project/{project_id}/authentication/settings")
print("2. Scroll to 'Authorized domains'")
print("3. Click 'Add domain'")
print("4. Add the following domains:")
print("   - nexo-jtsky100.web.app")
print("   - localhost (for local development)")
print("\nAlternatively, you can use the Firebase CLI:")
print(f"   firebase auth:export --project {project_id}")
