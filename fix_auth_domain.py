#!/usr/bin/env python3
"""
Add authorized domain to Firebase project using Identity Platform API
"""
import json
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

# Load service account credentials
SERVICE_ACCOUNT_FILE = '/home/ubuntu/nexo/nexo-jtsky100-firebase-adminsdk-fbsvc-664c1d9a28.json'

with open(SERVICE_ACCOUNT_FILE, 'r') as f:
    service_account_info = json.load(f)

project_id = service_account_info['project_id']

# Create credentials
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=['https://www.googleapis.com/auth/cloud-platform']
)

# Get access token
credentials.refresh(Request())
access_token = credentials.token

print(f"Project ID: {project_id}")
print(f"Access token obtained: {access_token[:20]}...")

# Identity Platform API endpoint
url = f"https://identitytoolkit.googleapis.com/v2/projects/{project_id}/config"

# Get current config
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

print("\nFetching current configuration...")
response = requests.get(url, headers=headers)

if response.status_code == 200:
    config = response.json()
    print("Current configuration retrieved successfully")
    
    # Check if authorizedDomains exists
    if 'authorizedDomains' in config:
        print(f"\nCurrent authorized domains: {config['authorizedDomains']}")
        
        # Add nexo-jtsky100.web.app if not present
        domains = config.get('authorizedDomains', [])
        new_domain = 'nexo-jtsky100.web.app'
        
        if new_domain not in domains:
            domains.append(new_domain)
            
            # Update config
            update_data = {
                'authorizedDomains': domains
            }
            
            print(f"\nAdding domain: {new_domain}")
            update_response = requests.patch(
                url,
                headers=headers,
                json=update_data,
                params={'updateMask': 'authorizedDomains'}
            )
            
            if update_response.status_code == 200:
                print(f"✅ Successfully added {new_domain} to authorized domains!")
            else:
                print(f"❌ Failed to update: {update_response.status_code}")
                print(update_response.text)
        else:
            print(f"✅ Domain {new_domain} is already authorized")
    else:
        print("⚠️  No authorizedDomains field in config")
        print("This might be managed through Firebase Console only")
else:
    print(f"❌ Failed to fetch config: {response.status_code}")
    print(response.text)
