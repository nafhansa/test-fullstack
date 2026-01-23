#!/usr/bin/env bash

# Clean, readable microservices integration test script
# Runs through: Auth -> RBAC -> Products -> Cart -> Transactions

set -u

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

API_URL="http://localhost:3000"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Shared test data
ADMIN_TOKEN=""
USER_TOKEN=""
PRODUCT_ID=""
NEW_PRODUCT_ID=""
RBAC_USER_ID=""
TRANSACTION_ID=""
BILLING_CODE=""

print_header() {
  printf "\n${CYAN}========================================${NC}\n"
  printf "${CYAN}%s${NC}\n" "$1"
  printf "${CYAN}========================================${NC}\n"
}

print_subheader() {
  printf "\n${BLUE}▶ %s${NC}\n" "$1"
}

run_test() {
  local name="$1"; shift
  local response="$1"; shift
  local expected="$1"; shift || true

  ((TOTAL_TESTS++))

  if [ -n "$expected" ] && echo "$response" | grep -q "$expected"; then
    printf "${GREEN}✅ %s: PASSED${NC}\n" "$name"
    ((PASSED_TESTS++))
    return 0
  else
    printf "${RED}❌ %s: FAILED${NC}\n" "$name"
    if [ -n "$response" ]; then
      printf "${YELLOW}Response: %s${NC}\n" "${response}" | sed -n '1,6p'
    fi
    ((FAILED_TESTS++))
    return 1
  fi
}

# Helper for curl requests with JSON and optional Authorization
http() {
  local method="$1"; shift
  local url="$1"; shift
  local token=""; local data="";
  while (("$#")); do
    case "$1" in
      -H) shift; ;; # accept raw headers if needed
      --token) token="$2"; shift 2; ;;
      --data) data="$2"; shift 2; ;;
      *) shift; ;;
    #!/usr/bin/env bash

    # Clean, readable microservices integration test script
    # Runs through: Auth -> RBAC -> Products -> Cart -> Transactions

    set -u

    # Colors
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    NC='\033[0m'

    API_URL="http://localhost:3000"

    # Counters
    TOTAL_TESTS=0
    PASSED_TESTS=0
    FAILED_TESTS=0

    # Shared test data
    ADMIN_TOKEN=""
    USER_TOKEN=""
    PRODUCT_ID=""
    NEW_PRODUCT_ID=""
    RBAC_USER_ID=""
    TRANSACTION_ID=""
    BILLING_CODE=""

    print_header() {
        printf "\n${CYAN}========================================${NC}\n"
        printf "${CYAN}%s${NC}\n" "$1"
        printf "${CYAN}========================================${NC}\n"
    }

    print_subheader() {
        printf "\n${BLUE}▶ %s${NC}\n" "$1"
    }

    run_test() {
        local name="$1"; shift
        local response="$1"; shift
        local expected="$1"; shift || true

        ((TOTAL_TESTS++))

        if [ -n "$expected" ] && echo "$response" | grep -q "$expected"; then
            printf "${GREEN}✅ %s: PASSED${NC}\n" "$name"
            ((PASSED_TESTS++))
            return 0
        else
            printf "${RED}❌ %s: FAILED${NC}\n" "$name"
            if [ -n "$response" ]; then
                printf "${YELLOW}Response: %s${NC}\n" "${response}" | sed -n '1,6p'
            fi
            ((FAILED_TESTS++))
            return 1
        fi
    }

    # Helper for curl requests with JSON and optional Authorization
    http() {
        local method="$1"; shift
        local url="$1"; shift
        local token=""; local data="";
        while (("$#")); do
            case "$1" in
                -H) shift; ;; # accept raw headers if needed
                --token) token="$2"; shift 2; ;;
                --data) data="$2"; shift 2; ;;
                *) shift; ;;
            esac
        done

        local auth_header=( )
        if [ -n "$token" ]; then
            auth_header=( -H "Authorization: Bearer ${token}" )
        fi

        if [ -n "$data" ]; then
            curl -s -X "$method" "$url" -H "Content-Type: application/json" "${auth_header[@]}" -d "$data"
        else
            curl -s -X "$method" "$url" "${auth_header[@]}"
        fi
    }

    # ------------------ PHASE 1: AUTH ------------------
    test_auth_service() {
        print_header "PHASE 1: AUTH"

        # Login as admin first (needed to create RBAC users)
        print_subheader "Login as admin"
        LOGIN_RESP=$(http POST "$API_URL/api/auth/login" --data '{ "email": "admin@test.com", "password": "admin123" }')
        ADMIN_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.token')
        if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
            run_test "Admin Login" "$LOGIN_RESP" "token" || { printf "${RED}Admin token required. Aborting tests.${NC}\n"; exit 1; }
        else
            run_test "Admin Login" "$LOGIN_RESP" "token"
        fi

        # Create a fresh test user via RBAC (ensures active account and predictable credentials)
        print_subheader "Create test user via RBAC (Admin)"
        RAND=$(date +%s)
        TEST_EMAIL="test-${RAND}@example.com"
        TEST_PASS="test123"
        RBAC_PAYLOAD=$(cat <<EOF
    { "name":"Test User ${RAND}", "username":"testuser${RAND}", "email":"${TEST_EMAIL}", "password":"${TEST_PASS}", "role":"PEMBELI", "status":"ACTIVE" }
    EOF
    )
        CREATE_RBAC_RESP=$(http POST "$API_URL/api/users" --token "$ADMIN_TOKEN" --data "$RBAC_PAYLOAD")
        run_test "Create RBAC User" "$CREATE_RBAC_RESP" "successfully"
        RBAC_USER_ID=$(echo "$CREATE_RBAC_RESP" | jq -r '.userId' 2>/dev/null || true)

        # Now login as that user to obtain USER_TOKEN (used for cart/transaction tests)
        print_subheader "Login as test user"
        USER_LOGIN_RESP=$(http POST "$API_URL/api/auth/login" --data "{ \"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASS}\" }")
        USER_TOKEN=$(echo "$USER_LOGIN_RESP" | jq -r '.token' 2>/dev/null || true)
        if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" = "null" ]; then
            # If login failed, show response and continue (some environments may auto-provision users)
            run_test "User Login" "$USER_LOGIN_RESP" "token" || true
        else
            run_test "User Login" "$USER_LOGIN_RESP" "token"
        fi

        # Admin /me and token refresh checks
        print_subheader "Get /me (admin)"
        ME_RESP=$(http GET "$API_URL/api/auth/me" --token "$ADMIN_TOKEN")
        run_test "Get Me" "$ME_RESP" "email"

        print_subheader "Refresh Token (admin)"
        REFRESH_RESP=$(http POST "$API_URL/api/auth/refresh-token" --data "{ \"token\": \"$ADMIN_TOKEN\" }")
        NEW_TOKEN=$(echo "$REFRESH_RESP" | jq -r '.token' 2>/dev/null || true)
        if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "null" ]; then
            run_test "Refresh Token" "$REFRESH_RESP" "token"
        else
            run_test "Refresh Token" "$REFRESH_RESP" "token" || true
        fi
    }
  fi

  print_subheader "Get transaction history"
  HISTORY_RESP=$(http GET "$API_URL/api/transactions/history" --token "$USER_TOKEN")
  run_test "Transaction History" "$HISTORY_RESP" "kode_billing"

  if [ -n "$TRANSACTION_ID" ] && [ "$TRANSACTION_ID" != "null" ]; then
    print_subheader "Get transaction detail"
    DETAIL_RESP=$(http GET "$API_URL/api/transactions/$TRANSACTION_ID" --token "$USER_TOKEN")
    run_test "Get Transaction Detail" "$DETAIL_RESP" "kode_billing"
  fi

  if [ -n "$BILLING_CODE" ] && [ "$BILLING_CODE" != "null" ]; then
    print_subheader "Pay transaction (admin)"
    PAY_RESP=$(http POST "$API_URL/api/transactions/pay" --token "$ADMIN_TOKEN" --data "{\"kode_billing\": \"$BILLING_CODE\"}")
    run_test "Pay Transaction" "$PAY_RESP" "Payment successful"
  fi
}

# ------------------ MAIN ------------------
main() {
  clear
  printf "${CYAN}=== MICROSERVICES TEST SUITE ===${NC}\n"
  printf "API Gateway: %s\n\n" "$API_URL"

  # Quick gateway check
  print_subheader "Checking API Gateway"
  if http GET "$API_URL/" | grep -qE "no Route matched|no Service matched|Kong"; then
    printf "${GREEN}✅ API Gateway seems up${NC}\n"
  else
    printf "${RED}❌ API Gateway not responding; aborting tests${NC}\n"
    exit 1
  fi

  test_auth_service
  test_rbac_service
  test_product_service
  test_cart_service
  test_transaction_service

  print_header "TEST SUMMARY"
  printf "Total: %s | Passed: %s | Failed: %s\n" "$TOTAL_TESTS" "$PASSED_TESTS" "$FAILED_TESTS"
  if [ "$FAILED_TESTS" -eq 0 ]; then
    printf "${GREEN}ALL TESTS PASSED${NC}\n"
  else
    printf "${YELLOW}%s tests failed${NC}\n" "$FAILED_TESTS"
  fi
}

main
#!/bin/bash

# ============================================
# COMPLETE ALL-IN-ONE TEST SCRIPT
# Testing: Auth, RBAC, Products, Transactions, Cart
# ============================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

API_URL="http://localhost:3000"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Global variables for test data
ADMIN_TOKEN=""
USER_TOKEN=""
PRODUCT_ID=""
CART_ITEM_ID=""
TRANSACTION_ID=""
BILLING_CODE=""
TEST_USER_ID=""

print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

print_subheader() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
}

run_test() {
    local test_name="$1"
    local response="$2"
    local expected="$3"
    
    ((TOTAL_TESTS++))
    
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}❌ $test_name: FAILED${NC}"
        echo -e "${YELLOW}Response: $response${NC}"
        ((FAILED_TESTS++))
        return 1
    fi
}

# ============================================
# PHASE 1: AUTH SERVICE
# ============================================
test_auth_service() {
    print_header "PHASE 1: AUTH SERVICE TESTING"
    
    # Test 1: Register new user
    print_subheader "1. Testing Register (PEMBELI)"
    RAND=$(date +%s)
    TEST_EMAIL="test-${RAND}@example.com"
    
    REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Test User ${RAND}\",
            \"username\": \"testuser${RAND}\",
            \"email\": \"${TEST_EMAIL}\",
            \"password\": \"test123\",
            \"role\": \"PEMBELI\"
        }")
    
    if run_test "Register User" "$REGISTER_RESPONSE" "successfully"; then
        TEST_USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.userId')
        echo "   User ID: $TEST_USER_ID"
        echo "   Email: $TEST_EMAIL"
    fi
    
    # Test 2: Login as Admin
    print_subheader "2. Testing Login (Admin)"
    LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@test.com",
            "password": "admin123"
        }')
    
    ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
    
    if [ "$ADMIN_TOKEN" != "null" ] && [ ! -z "$ADMIN_TOKEN" ]; then
        run_test "Admin Login" "$LOGIN_RESPONSE" "token"
        echo "   Token: ${ADMIN_TOKEN:0:50}..."
    else
        run_test "Admin Login" "$LOGIN_RESPONSE" "token"
        echo -e "${RED}⛔ Cannot continue without admin token!${NC}"
        exit 1
    fi
    
    # Test 3: Login as User (PEMBELI)
    print_subheader "3. Testing Login (PEMBELI)"
    USER_LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{
            "email": "user@test.com",
            "password": "user123"
        }')
    
    USER_TOKEN=$(echo $USER_LOGIN_RESPONSE | jq -r '.token')
    
    if [ "$USER_TOKEN" != "null" ] && [ ! -z "$USER_TOKEN" ]; then
        run_test "User Login" "$USER_LOGIN_RESPONSE" "token"
        echo "   Token: ${USER_TOKEN:0:50}..."
    else
        run_test "User Login" "$USER_LOGIN_RESPONSE" "token"
    fi
    
    # Test 4: Get Me
    print_subheader "4. Testing /me Endpoint"
    ME_RESPONSE=$(curl -s -X GET $API_URL/api/auth/me \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if run_test "Get Me" "$ME_RESPONSE" "email"; then
        echo "   Email: $(echo $ME_RESPONSE | jq -r '.email')"
        echo "   Role: $(echo $ME_RESPONSE | jq -r '.role')"
    fi
    
    # Test 5: Refresh Token
    print_subheader "5. Testing Refresh Token"
    REFRESH_RESPONSE=$(curl -s -X POST $API_URL/api/auth/refresh-token \
        -H "Content-Type: application/json" \
        -d "{\"token\": \"$ADMIN_TOKEN\"}")
    
    NEW_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.token')
    
    if [ "$NEW_TOKEN" != "null" ] && [ ! -z "$NEW_TOKEN" ]; then
        run_test "Refresh Token" "$REFRESH_RESPONSE" "token"
        echo "   New Token: ${NEW_TOKEN:0:50}..."
    else
        run_test "Refresh Token" "$REFRESH_RESPONSE" "token"
    fi
}

# ============================================
# PHASE 2: RBAC SERVICE
# ============================================
test_rbac_service() {
    print_header "PHASE 2: RBAC SERVICE TESTING"
    
    # Test 1: Get All Users
    print_subheader "1. Testing GET /api/users"
    USERS_RESPONSE=$(curl -s -X GET $API_URL/api/users \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if run_test "List Users" "$USERS_RESPONSE" "email"; then
        USER_COUNT=$(echo $USERS_RESPONSE | jq '. | length')
        echo "   Total Users: $USER_COUNT"
    fi
    
    # Test 2: Create User (via RBAC)
    print_subheader "2. Testing POST /api/users (Create)"
    RAND=$(date +%s)
    RBAC_EMAIL="rbac-${RAND}@test.com"
    
    CREATE_USER_RESPONSE=$(curl -s -X POST $API_URL/api/users \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"RBAC Test User\",
            \"username\": \"rbacuser${RAND}\",
            \"email\": \"${RBAC_EMAIL}\",
            \"password\": \"test123\",
            \"role\": \"PEMBELI\",
            \"status\": \"ACTIVE\"
        }")
    
    RBAC_USER_ID=$(echo $CREATE_USER_RESPONSE | jq -r '.userId')
    
    if run_test "Create User (RBAC)" "$CREATE_USER_RESPONSE" "successfully"; then
        echo "   User ID: $RBAC_USER_ID"
        echo "   Email: $RBAC_EMAIL"
    fi
    
    # Test 3: Update User
    print_subheader "3. Testing PUT /api/users/:id (Update)"
    
    if [ ! -z "$RBAC_USER_ID" ] && [ "$RBAC_USER_ID" != "null" ]; then
        UPDATE_USER_RESPONSE=$(curl -s -X PUT $API_URL/api/users/$RBAC_USER_ID \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{
                "name": "RBAC Updated User",
                "status": "INACTIVE"
            }')
        
        run_test "Update User" "$UPDATE_USER_RESPONSE" "successfully"
    else
        echo -e "${YELLOW}⚠️  Skipping: No user ID from create${NC}"
    fi
    
    # Test 4: Delete User
    print_subheader "4. Testing DELETE /api/users/:id"
    
    if [ ! -z "$RBAC_USER_ID" ] && [ "$RBAC_USER_ID" != "null" ]; then
        DELETE_USER_RESPONSE=$(curl -s -X DELETE $API_URL/api/users/$RBAC_USER_ID \
            -H "Authorization: Bearer $ADMIN_TOKEN")
        
        run_test "Delete User" "$DELETE_USER_RESPONSE" "successfully"
    else
        echo -e "${YELLOW}⚠️  Skipping: No user ID to delete${NC}"
    fi
}

# ============================================
# PHASE 3: PRODUCT SERVICE
# ============================================
test_product_service() {
    print_header "PHASE 3: PRODUCT SERVICE TESTING"
    
    # Test 1: Get All Products (Public)
    print_subheader "1. Testing GET /api/products (Public)"
    PRODUCTS_RESPONSE=$(curl -s -X GET $API_URL/api/products)
    
    if run_test "List Products (Public)" "$PRODUCTS_RESPONSE" "name"; then
        PRODUCT_COUNT=$(echo $PRODUCTS_RESPONSE | jq '. | length')
        echo "   Total Products: $PRODUCT_COUNT"
        
        # Save first product ID for later use
        PRODUCT_ID=$(echo $PRODUCTS_RESPONSE | jq -r '.[0].id')
        echo "   First Product ID: $PRODUCT_ID"
    fi
    
    # Test 2: Create Product (Admin Only)
    print_subheader "2. Testing POST /api/products (Admin)"
    RAND=$(date +%s)
    
    CREATE_PRODUCT_RESPONSE=$(curl -s -X POST $API_URL/api/products \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Test Product ${RAND}\",
            \"price\": 15000
        }")
    
    NEW_PRODUCT_ID=$(echo $CREATE_PRODUCT_RESPONSE | jq -r '.productId')
    
    if run_test "Create Product" "$CREATE_PRODUCT_RESPONSE" "successfully"; then
        echo "   Product ID: $NEW_PRODUCT_ID"
    fi
    
    # Test 3: Get Product by ID
    print_subheader "3. Testing GET /api/products/:id"
    
    if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
        PRODUCT_DETAIL_RESPONSE=$(curl -s -X GET $API_URL/api/products/$PRODUCT_ID \
            -H "Authorization: Bearer $USER_TOKEN")
        
        if run_test "Get Product Detail" "$PRODUCT_DETAIL_RESPONSE" "name"; then
            echo "   Name: $(echo $PRODUCT_DETAIL_RESPONSE | jq -r '.name')"
            echo "   Price: Rp $(echo $PRODUCT_DETAIL_RESPONSE | jq -r '.price')"
        fi
    fi
    
    # Test 4: Update Product (Admin Only)
    print_subheader "4. Testing PUT /api/products/:id (Admin)"
    
    if [ ! -z "$NEW_PRODUCT_ID" ] && [ "$NEW_PRODUCT_ID" != "null" ]; then
        UPDATE_PRODUCT_RESPONSE=$(curl -s -X PUT $API_URL/api/products/$NEW_PRODUCT_ID \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{
                "name": "Updated Test Product",
                "price": 20000
            }')
        
        run_test "Update Product" "$UPDATE_PRODUCT_RESPONSE" "successfully"
    else
        echo -e "${YELLOW}⚠️  Skipping: No product ID from create${NC}"
    fi
    
    # Test 5: Delete Product (Admin Only)
    print_subheader "5. Testing DELETE /api/products/:id (Admin)"
    
    if [ ! -z "$NEW_PRODUCT_ID" ] && [ "$NEW_PRODUCT_ID" != "null" ]; then
        DELETE_PRODUCT_RESPONSE=$(curl -s -X DELETE $API_URL/api/products/$NEW_PRODUCT_ID \
            -H "Authorization: Bearer $ADMIN_TOKEN")
        
        run_test "Delete Product" "$DELETE_PRODUCT_RESPONSE" "successfully"
    else
        echo -e "${YELLOW}⚠️  Skipping: No product ID to delete${NC}"
    fi
}

# ============================================
# PHASE 4: CART SERVICE (NEW - Sesuai PDF)
# ============================================
test_cart_service() {
    print_header "PHASE 4: CART SERVICE TESTING"
    
    # Test 1: Add to Cart
    print_subheader "1. Testing POST /api/cart/add"
    
    if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
        ADD_CART_RESPONSE=$(curl -s -X POST $API_URL/api/cart/add \
            -H "Authorization: Bearer $USER_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"productId\": $PRODUCT_ID,
                \"qty\": 2
            }")
        
        if run_test "Add to Cart" "$ADD_CART_RESPONSE" "Product added to cart"; then
            echo "   Product ID: $PRODUCT_ID"
            echo "   Quantity: 2"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping: No product ID available${NC}"
    fi
    
    # Test 2: Get Cart
    print_subheader "2. Testing GET /api/cart"
    GET_CART_RESPONSE=$(curl -s -X GET $API_URL/api/cart \
        -H "Authorization: Bearer $USER_TOKEN")
    
    if run_test "Get Cart" "$GET_CART_RESPONSE" "items"; then
        CART_TOTAL=$(echo $GET_CART_RESPONSE | jq -r '.total_amount')
        CART_COUNT=$(echo $GET_CART_RESPONSE | jq -r '.item_count')
        echo "   Total Items: $CART_COUNT"
        echo "   Total Amount: Rp $CART_TOTAL"
    fi
}

# ============================================
# PHASE 5: TRANSACTION SERVICE
# ============================================
test_transaction_service() {
    print_header "PHASE 5: TRANSACTION SERVICE TESTING"
    
    # Test 1: Checkout from Cart
    print_subheader "1. Testing POST /api/transactions/checkout"
    CHECKOUT_RESPONSE=$(curl -s -X POST $API_URL/api/transactions/checkout \
        -H "Authorization: Bearer $USER_TOKEN" \
        -H "Content-Type: application/json")
    
    if run_test "Checkout" "$CHECKOUT_RESPONSE" "Transaction created successfully"; then
        TRANSACTION_ID=$(echo $CHECKOUT_RESPONSE | jq -r '.transaction.id')
        BILLING_CODE=$(echo $CHECKOUT_RESPONSE | jq -r '.transaction.kode_billing')
        TOTAL_AMOUNT=$(echo $CHECKOUT_RESPONSE | jq -r '.transaction.total_amount')
        
        echo "   Transaction ID: $TRANSACTION_ID"
        echo "   Billing Code: $BILLING_CODE"
        echo "   Total: Rp $TOTAL_AMOUNT"
        echo "   Status: $(echo $CHECKOUT_RESPONSE | jq -r '.transaction.status')"
    fi
    
    # Test 2: Direct Checkout (without cart)
    print_subheader "2. Testing POST /api/transactions (Direct)"
    
    if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
        DIRECT_CHECKOUT_RESPONSE=$(curl -s -X POST $API_URL/api/transactions \
            -H "Authorization: Bearer $USER_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"items\": [
                    {
                        \"productId\": $PRODUCT_ID,
                        \"qty\": 3
                    }
                ]
            }")
        
        if run_test "Direct Checkout" "$DIRECT_CHECKOUT_RESPONSE" "Transaction created successfully"; then
            DIRECT_BILLING=$(echo $DIRECT_CHECKOUT_RESPONSE | jq -r '.transaction.kode_billing')
            echo "   Billing Code: $DIRECT_BILLING"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping: No product ID available${NC}"
    fi
    
    # Test 3: Get Transaction History
    print_subheader "3. Testing GET /api/transactions/history"
    HISTORY_RESPONSE=$(curl -s -X GET $API_URL/api/transactions/history \
        -H "Authorization: Bearer $USER_TOKEN")
    
    if run_test "Transaction History" "$HISTORY_RESPONSE" "kode_billing"; then
        TRANSACTION_COUNT=$(echo $HISTORY_RESPONSE | jq '. | length')
        echo "   Total Transactions: $TRANSACTION_COUNT"
    fi
    
    # Test 4: Get Transaction by ID
    print_subheader "4. Testing GET /api/transactions/:id"
    
    if [ ! -z "$TRANSACTION_ID" ] && [ "$TRANSACTION_ID" != "null" ]; then
        TRANSACTION_DETAIL_RESPONSE=$(curl -s -X GET $API_URL/api/transactions/$TRANSACTION_ID \
            -H "Authorization: Bearer $USER_TOKEN")
        
        if run_test "Get Transaction Detail" "$TRANSACTION_DETAIL_RESPONSE" "kode_billing"; then
            echo "   Status: $(echo $TRANSACTION_DETAIL_RESPONSE | jq -r '.status')"
            echo "   Items: $(echo $TRANSACTION_DETAIL_RESPONSE | jq '.items | length')"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping: No transaction ID available${NC}"
    fi
    
    # Test 5: Pay Transaction (Admin)
    print_subheader "5. Testing POST /api/transactions/pay (Admin)"
    
    if [ ! -z "$BILLING_CODE" ] && [ "$BILLING_CODE" != "null" ]; then
        PAY_RESPONSE=$(curl -s -X POST $API_URL/api/transactions/pay \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"kode_billing\": \"$BILLING_CODE\"
            }")
        
        if run_test "Pay Transaction" "$PAY_RESPONSE" "Payment successful"; then
            echo "   Paid Billing: $BILLING_CODE"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping: No billing code available${NC}"
    fi
}

# ============================================
# MAIN EXECUTION
# ============================================
main() {
    clear
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║     🧪 COMPLETE MICROSERVICES API TEST SUITE 🧪           ║"
    echo "║                                                            ║"
    echo "║     Testing: Auth | RBAC | Products | Cart | Transactions ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${YELLOW}API Gateway: $API_URL${NC}"
    echo ""
    
    # Check if API Gateway is running
    print_subheader "Checking API Gateway..."
    KONG_CHECK=$(curl -s $API_URL/ 2>&1)
    
    # Kong will return "no Route matched" or "no Service matched" if it's running
    if echo "$KONG_CHECK" | grep -q "no Route matched\|no Service matched\|Kong"; then
        echo -e "${GREEN}✅ API Gateway (Kong) is running${NC}"
    else
        echo -e "${RED}❌ API Gateway is not responding!${NC}"
        echo -e "${YELLOW}Response: $KONG_CHECK${NC}"
        echo ""
        echo -e "${YELLOW}Trying to diagnose...${NC}"
        
        # Check if Kong container is running
        if docker ps | grep -q kong-gateway; then
            echo -e "${GREEN}✅ Kong container is running${NC}"
            echo ""
            echo "Kong logs:"
            docker logs kong-gateway --tail=20
        else
            echo -e "${RED}❌ Kong container is not running${NC}"
            echo ""
            echo -e "${YELLOW}Please start the services first:${NC}"
            echo "   docker-compose -f docker-compose.full.yml up -d"
        fi
        exit 1
    fi
    
    # Run all test phases
    test_auth_service
    test_rbac_service
    test_product_service
    test_cart_service
    test_transaction_service
    
    # Print summary
    print_header "TEST SUMMARY"
    echo ""
    echo -e "Total Tests:  ${CYAN}$TOTAL_TESTS${NC}"
    echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
    echo ""
    
    PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✅ ALL TESTS PASSED! (100%)          ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    else
        echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║  ⚠️  Some tests failed ($PASS_RATE%)          ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
    fi
    
    echo ""
}

# Run main
main