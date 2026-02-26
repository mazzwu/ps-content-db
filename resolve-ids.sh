#!/bin/bash
# Run this on YOUR local machine to look up the 3 Graph API IDs you need.
# Set these environment variables before running:
#   export TENANT_ID="your-tenant-id"
#   export CLIENT_ID="your-client-id"
#   export CLIENT_SECRET="your-client-secret"

if [ -z "$TENANT_ID" ] || [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
  echo "ERROR: Please set TENANT_ID, CLIENT_ID, and CLIENT_SECRET environment variables first."
  echo ""
  echo "  export TENANT_ID=\"your-tenant-id\""
  echo "  export CLIENT_ID=\"your-client-id\""
  echo "  export CLIENT_SECRET=\"your-client-secret\""
  exit 1
fi

echo "=== Step 1: Getting access token ==="
TOKEN=$(curl -s -X POST \
  "https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=https://graph.microsoft.com/.default" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token','FAILED'))" 2>/dev/null)

if [ "$TOKEN" = "FAILED" ] || [ -z "$TOKEN" ]; then
  echo "ERROR: Could not get access token. Check your credentials."
  exit 1
fi
echo "Got access token."
echo ""

echo "=== Step 2: Getting SharePoint Site ID ==="
echo "---"
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://graph.microsoft.com/v1.0/sites/pretiumsquared.sharepoint.com:/sites/PretiumSquared" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'error' in data:
    print('ERROR:', json.dumps(data['error'], indent=2))
else:
    print('Site Name:', data.get('displayName'))
    print('SITE_ID:', data.get('id'))
" 2>/dev/null
echo ""

echo "=== Step 3: Getting Drive ID ==="
SITE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://graph.microsoft.com/v1.0/sites/pretiumsquared.sharepoint.com:/sites/PretiumSquared" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

echo "---"
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drives" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'error' in data:
    print('ERROR:', json.dumps(data['error'], indent=2))
else:
    for d in data.get('value', []):
        print(f\"Drive Name: \\\"{d['name']}\\\" | DRIVE_ID: {d['id']}\")
" 2>/dev/null
echo ""

echo "=== Step 4: Searching for Content Database.xlsx in each drive ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drives" \
  | python3 -c "import sys,json; [print(d['id']) for d in json.load(sys.stdin).get('value',[])]" 2>/dev/null \
  | while read DRIVE_ID; do
    curl -s -H "Authorization: Bearer $TOKEN" \
      "https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drives/${DRIVE_ID}/root/search(q='Content%20Database')" \
      | python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data.get('value', []):
    if '.xlsx' in item.get('name', ''):
        print(f\"File: {item['name']}\")
        print(f\"DRIVE_ID: '${DRIVE_ID}'\")
        print(f\"FILE_ID: {item['id']}\")
" 2>/dev/null
done

echo ""
echo "=== Done! Copy the SITE_ID, DRIVE_ID, and FILE_ID values above ==="
