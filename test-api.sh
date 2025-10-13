#!/bin/bash

# UL Gear Manager API テストスクリプト
# 基本機能をcurlコマンドでテスト

set -e  # エラー時に終了

API_BASE="http://localhost:8000/api"
USER_ID="demo-user-1"

# 色付きの出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルパー関数
log_test() {
    echo -e "\n${BLUE}🧪 TEST: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS: $1${NC}"
}

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ️  INFO: $1${NC}"
}

# JSONを整形して出力
format_json() {
    if command -v jq &> /dev/null; then
        echo "$1" | jq '.'
    else
        echo "$1"
    fi
}

# HTTPステータスコードをチェック
check_status() {
    local expected=$1
    local actual=$2
    local test_name=$3
    
    if [ "$actual" = "$expected" ]; then
        log_success "$test_name - Status: $actual"
        return 0
    else
        log_error "$test_name - Expected: $expected, Got: $actual"
        return 1
    fi
}

echo -e "${BLUE}🚀 UL Gear Manager API テスト開始${NC}"
echo "API Base URL: $API_BASE"
echo "User ID: $USER_ID"

# 1. ヘルスチェック
log_test "Health Check"
response=$(curl -s -w "\n%{http_code}" "$API_BASE/health")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "200" "$status" "Health Check"; then
    format_json "$body"
fi

# 2. カテゴリ一覧取得（DB実装前はin-memoryデータ）
log_test "Get Categories"
response=$(curl -s -w "\n%{http_code}" \
    -H "x-user-id: $USER_ID" \
    "$API_BASE/v1/categories")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "200" "$status" "Get Categories"; then
    format_json "$body"
fi

# 3. ギア一覧取得（空の場合）
log_test "Get All Gear (Empty)"
response=$(curl -s -w "\n%{http_code}" \
    -H "x-user-id: $USER_ID" \
    "$API_BASE/v1/gear")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "200" "$status" "Get All Gear"; then
    format_json "$body"
fi

# 4. 新しいギアアイテムを作成
log_test "Create Gear Item"
gear_data='{
    "name": "Test Backpack",
    "brand": "TestBrand",
    "categoryId": "550e8400-e29b-41d4-a716-446655440003",
    "requiredQuantity": 1,
    "ownedQuantity": 0,
    "weightGrams": 1200,
    "priceCents": 15000,
    "season": "all",
    "priority": 3
}'

response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-user-id: $USER_ID" \
    -d "$gear_data" \
    "$API_BASE/v1/gear")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "201" "$status" "Create Gear Item"; then
    format_json "$body"
    # IDを抽出（後のテストで使用）
    if command -v jq &> /dev/null; then
        GEAR_ID=$(echo "$body" | jq -r '.data.id')
        log_info "Created Gear ID: $GEAR_ID"
    fi
fi

# 5. 作成したギアアイテムを取得
if [ ! -z "$GEAR_ID" ]; then
    log_test "Get Gear Item by ID"
    response=$(curl -s -w "\n%{http_code}" \
        -H "x-user-id: $USER_ID" \
        "$API_BASE/v1/gear/$GEAR_ID")
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)

    if check_status "200" "$status" "Get Gear Item by ID"; then
        format_json "$body"
    fi
fi

# 6. ギア一覧取得（作成後）
log_test "Get All Gear (After Creation)"
response=$(curl -s -w "\n%{http_code}" \
    -H "x-user-id: $USER_ID" \
    "$API_BASE/v1/gear")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "200" "$status" "Get All Gear (After Creation)"; then
    format_json "$body"
fi

# 7. ギアアイテムを更新
if [ ! -z "$GEAR_ID" ]; then
    log_test "Update Gear Item"
    update_data='{
        "name": "Updated Test Backpack",
        "ownedQuantity": 1,
        "weightGrams": 1100
    }'

    response=$(curl -s -w "\n%{http_code}" \
        -X PUT \
        -H "Content-Type: application/json" \
        -H "x-user-id: $USER_ID" \
        -d "$update_data" \
        "$API_BASE/v1/gear/$GEAR_ID")
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)

    if check_status "200" "$status" "Update Gear Item"; then
        format_json "$body"
    fi
fi

# 8. フィルタリング機能のテスト
log_test "Filter Gear by Category"
response=$(curl -s -w "\n%{http_code}" \
    -H "x-user-id: $USER_ID" \
    "$API_BASE/v1/gear?categoryIds=550e8400-e29b-41d4-a716-446655440003")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "200" "$status" "Filter Gear by Category"; then
    format_json "$body"
fi

# 9. ページネーション機能のテスト
log_test "Pagination Test"
response=$(curl -s -w "\n%{http_code}" \
    -H "x-user-id: $USER_ID" \
    "$API_BASE/v1/gear?page=1&limit=10")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "200" "$status" "Pagination Test"; then
    format_json "$body"
fi

# 10. 分析データの取得
log_test "Get Analytics Summary"
response=$(curl -s -w "\n%{http_code}" \
    -H "x-user-id: $USER_ID" \
    "$API_BASE/v1/analytics/summary")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "200" "$status" "Get Analytics Summary"; then
    format_json "$body"
fi

# 11. ギアアイテムを削除
if [ ! -z "$GEAR_ID" ]; then
    log_test "Delete Gear Item"
    response=$(curl -s -w "\n%{http_code}" \
        -X DELETE \
        -H "x-user-id: $USER_ID" \
        "$API_BASE/v1/gear/$GEAR_ID")
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)

    if check_status "200" "$status" "Delete Gear Item"; then
        format_json "$body"
    fi
fi

# 12. 削除後の確認
log_test "Verify Deletion"
response=$(curl -s -w "\n%{http_code}" \
    -H "x-user-id: $USER_ID" \
    "$API_BASE/v1/gear")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "200" "$status" "Verify Deletion"; then
    format_json "$body"
fi

# 13. エラーハンドリングのテスト
log_test "Error Handling - Invalid ID"
response=$(curl -s -w "\n%{http_code}" \
    -H "x-user-id: $USER_ID" \
    "$API_BASE/v1/gear/invalid-id")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "404" "$status" "Error Handling - Invalid ID"; then
    format_json "$body"
fi

# 14. バリデーションエラーのテスト
log_test "Validation Error - Missing Name"
invalid_data='{
    "brand": "TestBrand",
    "requiredQuantity": 1
}'

response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-user-id: $USER_ID" \
    -d "$invalid_data" \
    "$API_BASE/v1/gear")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if check_status "400" "$status" "Validation Error - Missing Name"; then
    format_json "$body"
fi

echo -e "\n${GREEN}🎉 API テスト完了！${NC}"
echo -e "${YELLOW}注意: データベース実装の場合、事前にDBの起動とマイグレーションが必要です${NC}"

