#!/bin/bash

echo "=== ST Booking System Frontend 개발 서버 새로고침 ==="

# 프로젝트 디렉토리로 이동
cd ~/Desktop/git/st-booking-system-front

echo "1. 기존 프로세스 종료 중..."
# 기존 React 개발 서버 프로세스 종료
pkill -f "react-scripts start" 2>/dev/null || echo "   실행 중인 개발 서버가 없습니다."

echo "2. 캐시 정리 중..."
# npm 캐시 정리
npm start -- --reset-cache 2>/dev/null &

echo "3. 개발 서버 시작 중..."
echo "   브라우저에서 http://localhost:3000 접속"
echo "   Ctrl+Shift+R (강제 새로고침)을 눌러 캐시를 무효화하세요."
echo ""
echo "=== 서버가 시작되었습니다 ==="
echo "종료하려면 Ctrl+C를 누르세요."

wait
