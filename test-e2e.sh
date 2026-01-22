#!/bin/bash

echo "========================================="
echo "   E2E Testing - Full Stack Application"
echo "========================================="
echo ""

BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install jq to run this script.${NC}"
    echo "Install: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
    exit 1
fi

# 1. Register Admin
echo -e "${YELLOW}1. Registering admin...${NC}"
ADMIN_REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","role":"ADMIN"}')
echo $ADMIN_REGISTER_RESPONSE | jq '.'

# 2. Login Admin
echo -e "\n${YELLOW}2. Login admin...${NC}"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}')
echo $ADMIN_LOGIN_RESPONSE | jq '.'

ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | jq -r '.token')
if [ "$ADMIN_TOKEN" == "null" ]; then
    echo -e "${RED}Failed to get admin token${NC}"
    exit 1
fi
echo -e "${GREEN}Admin Token: $ADMIN_TOKEN${NC}"

# 3. Create Product
echo -e "\n${YELLOW}3. Creating product...${NC}"
PRODUCT_RESPONSE=$(curl -s -X POST $BASE_URL/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Laptop ASUS ROG","price":15000000,"stock":10}')
echo $PRODUCT_RESPONSE | jq '.'

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.productId')
if [ "$PRODUCT_ID" == "null" ]; then
    echo -e "${YELLOW}Product already exists, fetching from list...${NC}"
    # Get from products list
    PRODUCTS=$(curl -s $BASE_URL/api/products)
    PRODUCT_ID=$(echo $PRODUCTS | jq -r '.[0].id')
fi
echo -e "${GREEN}Product ID: $PRODUCT_ID${NC}"

# 4. Get All Products
echo -e "\n${YELLOW}4. Getting all products...${NC}"
PRODUCTS_LIST=$(curl -s $BASE_URL/api/products)
echo $PRODUCTS_LIST | jq '.'

# 5. Register User (Pembeli)
echo -e "\n${YELLOW}5. Registering user (pembeli)...${NC}"
USER_REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"user123","role":"PEMBELI"}')
echo $USER_REGISTER_RESPONSE | jq '.'

# 6. Login User
echo -e "\n${YELLOW}6. Login user...${NC}"
USER_LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"user123"}')
echo $USER_LOGIN_RESPONSE | jq '.'

USER_TOKEN=$(echo $USER_LOGIN_RESPONSE | jq -r '.token')
if [ "$USER_TOKEN" == "null" ]; then
    echo -e "${RED}Failed to get user token${NC}"
    exit 1
fi
echo -e "${GREEN}User Token: $USER_TOKEN${NC}"

# 7. Create Transaction (Checkout)
echo -e "\n${YELLOW}7. Creating transaction (checkout)...${NC}"
TRANSACTION_RESPONSE=$(curl -s -X POST $BASE_URL/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{\"items\":[{\"productId\":$PRODUCT_ID,\"qty\":2}]}")
echo $TRANSACTION_RESPONSE | jq '.'

KODE_BILLING=$(echo $TRANSACTION_RESPONSE | jq -r '.transaction.kode_billing')
if [ "$KODE_BILLING" == "null" ]; then
    echo -e "${RED}Failed to create transaction${NC}"
    exit 1
fi
echo -e "${GREEN}Billing Code: $KODE_BILLING${NC}"

# 8. Get User Transactions (Before Payment)
echo -e "\n${YELLOW}8. Getting user transactions (before payment)...${NC}"
TRANSACTIONS_BEFORE=$(curl -s $BASE_URL/api/transactions \
  -H "Authorization: Bearer $USER_TOKEN")
echo $TRANSACTIONS_BEFORE | jq '.'

# 9. Payment (Admin)
echo -e "\n${YELLOW}9. Processing payment (admin)...${NC}"
PAYMENT_RESPONSE=$(curl -s -X POST $BASE_URL/api/transactions/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"kode_billing\":\"$KODE_BILLING\"}")
echo $PAYMENT_RESPONSE | jq '.'

# 10. Get User Transactions (After Payment)
echo -e "\n${YELLOW}10. Getting user transactions (after payment)...${NC}"
TRANSACTIONS_AFTER=$(curl -s $BASE_URL/api/transactions \
  -H "Authorization: Bearer $USER_TOKEN")
echo $TRANSACTIONS_AFTER | jq '.'

# Verify status changed
STATUS=$(echo $TRANSACTIONS_AFTER | jq -r '.[0].status')
if [ "$STATUS" == "SUDAH_DIBAYAR" ]; then
    echo -e "\n${GREEN}=========================================${NC}"
    echo -e "${GREEN}   ✓ ALL TESTS PASSED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}=========================================${NC}"
else
    echo -e "\n${RED}=========================================${NC}"
    echo -e "${RED}   ✗ TEST FAILED: Status not updated${NC}"
    echo -e "${RED}=========================================${NC}"
    exit 1
fi

echo ""
echo "Summary:"
echo "- Admin Token: $ADMIN_TOKEN"
echo "- User Token: $USER_TOKEN"
echo "- Product ID: $PRODUCT_ID"
echo "- Billing Code: $KODE_BILLING"
echo "- Final Status: $STATUS"
echo ""
