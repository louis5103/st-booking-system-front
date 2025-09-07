#!/bin/bash

# 좌석 배치 리팩토링 테스트 스크립트
# 사용법: ./test-seat-layout.sh

echo "🎭 좌석 배치 시스템 테스트 시작"
echo "================================="

# 1. 백엔드 상태 확인
echo "📡 백엔드 상태 확인 중..."
backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/venues)

if [ "$backend_status" = "200" ]; then
    echo "✅ 백엔드 서버 정상"
else
    echo "❌ 백엔드 서버 오류 (HTTP $backend_status)"
    echo "   백엔드를 먼저 실행하세요: ./gradlew bootRun"
    exit 1
fi

# 2. 프론트엔드 상태 확인
echo "🌐 프론트엔드 상태 확인 중..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 프론트엔드 서버 정상"
else
    echo "❌ 프론트엔드 서버 오류"
    echo "   프론트엔드를 먼저 실행하세요: npm start"
    exit 1
fi

# 3. API 테스트
echo "🔌 API 테스트 중..."

# 템플릿 목록 조회
templates_response=$(curl -s http://localhost:8080/api/seat-layouts/templates)
if echo "$templates_response" | grep -q "small_theater"; then
    echo "✅ 템플릿 API 정상"
else
    echo "❌ 템플릿 API 오류"
fi

# 공연장 목록 조회
venues_response=$(curl -s http://localhost:8080/api/venues)
if echo "$venues_response" | grep -q "\[\]" || echo "$venues_response" | grep -q "id"; then
    echo "✅ 공연장 API 정상"
else
    echo "❌ 공연장 API 오류"
fi

# 4. 파일 구조 확인
echo "📁 파일 구조 확인 중..."

# 필수 파일들 확인
required_files=(
    "src/components/SeatLayoutEditor.js"
    "src/components/FlexibleVenueEditor.js"
    "src/components/VenueManagement.js"
    "src/services/api.js"
    "src/styles/SeatLayoutEditor.css"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (누락)"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    echo "✅ 모든 필수 파일 존재"
else
    echo "❌ 일부 파일 누락"
fi

# 5. 브라우저 테스트 안내
echo ""
echo "🧪 수동 테스트 안내"
echo "==================="
echo "1. http://localhost:3000 접속"
echo "2. 관리자 페이지 → 공연장 관리"
echo "3. '새 공연장 등록' 클릭"
echo "4. 공연장 정보 입력 후 저장"
echo "5. '🎭 좌석 편집' 버튼 클릭"
echo "6. 새로운 에디터에서 테스트:"
echo "   - 템플릿 적용"
echo "   - 좌석 추가/삭제"
echo "   - 정렬 기능"
echo "   - 저장 기능"
echo ""

# 6. 성능 체크
echo "⚡ 간단한 성능 체크..."
start_time=$(date +%s%N)
curl -s http://localhost:8080/api/venues > /dev/null
end_time=$(date +%s%N)
duration=$(((end_time - start_time) / 1000000))
echo "   API 응답 시간: ${duration}ms"

if [ "$duration" -lt 500 ]; then
    echo "✅ 응답 시간 양호"
else
    echo "⚠️ 응답 시간 확인 필요 (${duration}ms)"
fi

echo ""
echo "🎉 테스트 완료!"
echo "문제 발견 시 개발팀에 문의하세요."