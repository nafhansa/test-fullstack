echo "🧪 TESTING PHASE 2: RBAC Service"
echo "=================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

API_URL="http://localhost:3000"

print_header() {
  echo ""
  echo "$1"
}

# Login as admin first
print_header "🔐 Login as admin..."
LOGIN_RAW=$(curl -s -w "\n%{http_code}" -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}')

HTTP_CODE=$(echo "$LOGIN_RAW" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RAW" | sed '$d')
TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed (no token). HTTP $HTTP_CODE${NC}"
  echo "Response body: $LOGIN_BODY"
  exit 1
fi

echo -e "${GREEN}✅ Login: PASSED${NC}"
echo -e "Token: ${YELLOW}${TOKEN}${NC}"

print_header "1️⃣ Testing GET /api/users (List Users)..."
USERS_RAW=$(curl -s -w "\n%{http_code}" -X GET $API_URL/api/users \
  -H "Authorization: Bearer $TOKEN")
USERS_CODE=$(echo "$USERS_RAW" | tail -n1)
USERS_BODY=$(echo "$USERS_RAW" | sed '$d')

if echo "$USERS_BODY" | jq -e '. | length > 0' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ List Users: PASSED${NC}"
  echo "Total users: $(echo $USERS_BODY | jq '. | length')"
else
  echo -e "${RED}❌ List Users: FAILED (HTTP $USERS_CODE)${NC}"
  echo "Response: $USERS_BODY"
fi

print_header "2️⃣ Testing POST /api/users (Create User)..."
# Use a unique email per test run to avoid conflicts with existing records
RAND=$(date +%s)
TEST_EMAIL="rbac-${RAND}@test.com"
CREATE_RAW=$(curl -s -w "\n%{http_code}" -X POST $API_URL/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RBAC Test User",
    "email": "'"$TEST_EMAIL"'",
    "password": "test123",
    "role": "PEMBELI"
  }')

CREATE_CODE=$(echo "$CREATE_RAW" | tail -n1)
CREATE_BODY=$(echo "$CREATE_RAW" | sed '$d')
USER_ID=$(echo $CREATE_BODY | jq -r '.userId // empty')

if [ -n "$USER_ID" ]; then
  echo -e "${GREEN}✅ Create User: PASSED${NC}"
  echo "New User ID: $USER_ID"
  echo "Created Email: $TEST_EMAIL"
else
  echo -e "${RED}❌ Create User: FAILED (HTTP $CREATE_CODE)${NC}"
  echo "Response: $CREATE_BODY"
fi

print_header "3️⃣ Testing PUT /api/users/:id (Update User)..."
if [ -z "$USER_ID" ]; then
  echo -e "${YELLOW}⚠️  Skipping update: no USER_ID from create step${NC}"
else
  UPDATE_RAW=$(curl -i -s -w "\n%{http_code}" -X PUT $API_URL/api/users/$USER_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"RBAC Updated User","status":false}')

  # Separate HTTP code and body (note -i included headers in body)
  UPDATE_CODE=$(echo "$UPDATE_RAW" | tail -n1)
  UPDATE_BODY=$(echo "$UPDATE_RAW" | sed '$d')

  if echo "$UPDATE_BODY" | grep -iq "updated successfully" || echo "$UPDATE_BODY" | jq -e 'has("message") and .message | test("updated"; "i")' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Update User: PASSED${NC}"
  else
    echo -e "${RED}❌ Update User: FAILED (HTTP $UPDATE_CODE)${NC}"
    echo "Response: $UPDATE_BODY"
  fi
fi

print_header "4️⃣ Testing DELETE /api/users/:id (Delete User)..."
if [ -z "$USER_ID" ]; then
  echo -e "${YELLOW}⚠️  Skipping delete: no USER_ID from create step${NC}"
else
  DELETE_RAW=$(curl -i -s -w "\n%{http_code}" -X DELETE $API_URL/api/users/$USER_ID \
    -H "Authorization: Bearer $TOKEN")

  DELETE_CODE=$(echo "$DELETE_RAW" | tail -n1)
  DELETE_BODY=$(echo "$DELETE_RAW" | sed '$d')

  if echo "$DELETE_BODY" | grep -iq "deleted successfully" || echo "$DELETE_BODY" | jq -e 'has("message") and .message | test("deleted"; "i")' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Delete User: PASSED${NC}"
  else
    echo -e "${RED}❌ Delete User: FAILED (HTTP $DELETE_CODE)${NC}"
    echo "Response: $DELETE_BODY"
  fi
fi

echo ""
echo "=================================="
echo "✅ Phase 2 Testing Complete!"