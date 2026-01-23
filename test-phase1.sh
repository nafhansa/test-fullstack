#!/bin/bash

echo "🧪 TESTING PHASE 1: Auth Service"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="http://localhost:3000"

echo ""
echo "1️⃣ Testing Register..."
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "role": "PEMBELI"
  }')

if echo $REGISTER_RESPONSE | grep -q "User registered successfully"; then
  echo -e "${GREEN}✅ Register: PASSED${NC}"
else
  echo -e "${RED}❌ Register: FAILED${NC}"
  echo "Response: $REGISTER_RESPONSE"
fi

echo ""
echo "2️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo -e "${GREEN}✅ Login: PASSED${NC}"
  echo "Token: ${TOKEN:0:50}..."
else
  echo -e "${RED}❌ Login: FAILED${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo ""
echo "3️⃣ Testing /me endpoint..."
ME_RESPONSE=$(curl -s -X GET $API_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN")

if echo $ME_RESPONSE | grep -q "user_id"; then
  echo -e "${GREEN}✅ /me: PASSED${NC}"
  echo "User: $(echo $ME_RESPONSE | jq -r '.email')"
else
  echo -e "${RED}❌ /me: FAILED${NC}"
  echo "Response: $ME_RESPONSE"
fi

echo ""
echo "4️⃣ Testing refresh-token..."
REFRESH_RESPONSE=$(curl -s -X POST $API_URL/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}")

NEW_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.token')

if [ "$NEW_TOKEN" != "null" ] && [ ! -z "$NEW_TOKEN" ]; then
  echo -e "${GREEN}✅ Refresh Token: PASSED${NC}"
  echo "New Token: ${NEW_TOKEN:0:50}..."
else
  echo -e "${RED}❌ Refresh Token: FAILED${NC}"
  echo "Response: $REFRESH_RESPONSE"
fi

echo ""
echo "================================="
echo "✅ Phase 1 Testing Complete!"