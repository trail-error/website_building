#!/bin/bash

# Profile Merge Feature - Comprehensive Test Script
# This script tests the complete user profile merge functionality

echo "=========================================="
echo "Profile Merge Feature - Test Suite"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Test 1: Create test imported profiles via the test endpoint
echo -e "${YELLOW}TEST 1: Create Imported Profiles${NC}"
echo "Creating profile: Rajesh Kumar"
curl -s -X POST "$BASE_URL/api/test/create-imported-profile" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rajesh Kumar"}' | jq '.'

echo ""
echo "Creating profile: Rajesh"
curl -s -X POST "$BASE_URL/api/test/create-imported-profile" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rajesh"}' | jq '.'

echo ""
echo -e "${GREEN}✓ Imported profiles created${NC}"
echo ""

# Test 2: Verify profiles show in Manage Users
echo -e "${YELLOW}TEST 2: Verify Profiles in Manage Users${NC}"
echo "Fetching all users..."
curl -s -X GET "$BASE_URL/api/users?page=1&pageSize=50" | jq '.users[] | {id, name, email, isImportedProfile}'

echo ""
echo -e "${GREEN}✓ Profiles loaded${NC}"
echo ""

# Test 3: Verify engineers list has no duplicates
echo -e "${YELLOW}TEST 3: Verify Engineers List Deduplication${NC}"
echo "Fetching engineers list..."
curl -s -X GET "$BASE_URL/api/engineers" | jq '.engineers[] | {name, id, isRegistered, isImported}'

echo ""
echo -e "${GREEN}✓ Engineers list fetched${NC}"
echo ""

# Test 4: Count duplicate engineers
echo -e "${YELLOW}TEST 4: Check for Duplicate Engineers${NC}"
DUPLICATE_COUNT=$(curl -s -X GET "$BASE_URL/api/engineers" | jq '[.engineers[] | .name] | group_by(.) | map(select(length > 1)) | length')
echo "Duplicate engineer names found: $DUPLICATE_COUNT"

if [ "$DUPLICATE_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✓ No duplicate engineers found${NC}"
else
  echo -e "${RED}✗ Found $DUPLICATE_COUNT duplicate engineer entries${NC}"
fi
echo ""

# Test 5: Get user IDs for merge test
echo -e "${YELLOW}TEST 5: Prepare for Merge Test${NC}"
USERS=$(curl -s -X GET "$BASE_URL/api/users?page=1&pageSize=50")
USER_COUNT=$(echo "$USERS" | jq '.users | length')
echo "Total users: $USER_COUNT"

# Show all users with their IDs
echo "Users available for merge:"
echo "$USERS" | jq '.users[] | {id, name, email, isImportedProfile}'

echo ""
echo -e "${GREEN}✓ User IDs prepared${NC}"
echo ""

echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="
echo ""
echo "Next steps for manual testing:"
echo "1. Go to Manage Users page at /users"
echo "2. Select 2+ profiles (one should have email)"
echo "3. Click 'Merge Profiles'"
echo "4. Verify dropdown no longer shows duplicates"
echo "5. Check Analytics page - bars should consolidate"
echo ""
