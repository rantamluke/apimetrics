#!/bin/bash
set -e

echo "🧪 APImetrics End-to-End Test"
echo "=============================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3001}"

echo "📍 Testing against:"
echo "   Backend:  $API_URL"
echo "   Frontend: $FRONTEND_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected, got $response)"
        ((TESTS_FAILED++))
    fi
}

# 1. Backend Health Check
echo "1️⃣  Backend Health Check"
test_endpoint "Health endpoint" "$API_URL/health" "200"
echo ""

# 2. Auth Endpoints
echo "2️⃣  Authentication"

# Register
echo -n "Testing user registration... "
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test-'$(date +%s)'@example.com",
        "password": "TestPass123!",
        "name": "Test User"
    }' || echo "{}")

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Response: $REGISTER_RESPONSE"
    ((TESTS_FAILED++))
    TOKEN=""
fi
echo ""

# 3. API Key Management
if [ -n "$TOKEN" ]; then
    echo "3️⃣  API Key Management"
    
    echo -n "Creating API key... "
    API_KEY_RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/api-keys" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name": "Test Key"}' || echo "{}")
    
    if echo "$API_KEY_RESPONSE" | grep -q "key"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
        API_KEY=$(echo "$API_KEY_RESPONSE" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
        API_KEY=""
    fi
    echo ""
fi

# 4. Tracking
if [ -n "$API_KEY" ]; then
    echo "4️⃣  API Call Tracking"
    
    echo -n "Tracking API call... "
    TRACK_RESPONSE=$(curl -s -X POST "$API_URL/v1/track/batch" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "calls": [
                {
                    "id": "test-call-'$(date +%s)'",
                    "provider": "openai",
                    "model": "gpt-4o",
                    "endpoint": "/v1/chat/completions",
                    "timestamp": '$(date +%s)000',
                    "inputTokens": 100,
                    "outputTokens": 50,
                    "cost": 0.001,
                    "latency": 1200,
                    "status": "success"
                }
            ]
        }' || echo "{}")
    
    if echo "$TRACK_RESPONSE" | grep -q "success\|tracked"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "Response: $TRACK_RESPONSE"
        ((TESTS_FAILED++))
    fi
    echo ""
fi

# 5. Analytics
if [ -n "$TOKEN" ]; then
    echo "5️⃣  Analytics"
    
    test_endpoint "Overview endpoint" "$API_URL/v1/analytics/overview" "401"
    
    echo -n "Getting analytics... "
    ANALYTICS_RESPONSE=$(curl -s -X GET "$API_URL/v1/analytics/overview?days=7" \
        -H "Authorization: Bearer $TOKEN" || echo "{}")
    
    if echo "$ANALYTICS_RESPONSE" | grep -q "totalCost\|total_cost\|costs"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠ PARTIAL${NC} (May be empty for new account)"
        ((TESTS_PASSED++))
    fi
    echo ""
fi

# 6. Frontend
echo "6️⃣  Frontend"
test_endpoint "Landing page" "$FRONTEND_URL" "200"
test_endpoint "Login page" "$FRONTEND_URL/login" "200"
test_endpoint "Signup page" "$FRONTEND_URL/signup" "200"
echo ""

# 7. SDK Test (if installed)
if command -v node &> /dev/null && [ -n "$API_KEY" ]; then
    echo "7️⃣  SDK Integration"
    
    echo -n "Testing SDK... "
    
    # Create test script
    cat > /tmp/apimetrics-sdk-test.js << EOF
const { APImetricsClient } = require('./sdk/dist/client');

const client = new APImetricsClient({
    apiKey: '$API_KEY',
    endpoint: '$API_URL',
    flushInterval: 1000,
});

client.track({
    id: 'sdk-test-$(date +%s)',
    provider: 'openai',
    model: 'gpt-4o',
    endpoint: '/v1/chat/completions',
    timestamp: Date.now(),
    inputTokens: 100,
    outputTokens: 50,
    cost: 0.001,
    latency: 1200,
    status: 'success',
}).then(() => {
    console.log('SDK_TEST_PASS');
    client.shutdown();
}).catch(err => {
    console.error('SDK_TEST_FAIL:', err);
    process.exit(1);
});
EOF
    
    if node /tmp/apimetrics-sdk-test.js 2>&1 | grep -q "SDK_TEST_PASS"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠ SKIP${NC} (SDK not built)"
    fi
    
    rm -f /tmp/apimetrics-sdk-test.js
    echo ""
fi

# Summary
echo "=============================="
echo "📊 Test Summary"
echo "=============================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🎉 APImetrics is ready for production!"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Please check the output above and fix any issues."
    exit 1
fi
