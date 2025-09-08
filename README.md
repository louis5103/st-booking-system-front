# 🎭 ST 통합예매관리시스템 - Frontend

React 기반의 공연 예매 시스템 프론트엔드 애플리케이션입니다.

## 📋 프로젝트 개요

이 프로젝트는 **Spring Boot** 백엔드와 **React** 프론트엔드로 구성된 통합 예매 관리 시스템입니다.

### 🛠 기술 스택

- **Frontend**: React 19.1.1, React Router DOM 7.7.1
- **HTTP Client**: Axios 1.11.0
- **Build Tool**: Create React App
- **Authentication**: JWT Token 기반

### ✨ 주요 기능

- 🔐 **사용자 인증**: JWT 토큰 기반 로그인/로그아웃, 역할별 권한 관리
- 🎪 **공연 관리**: 공연 목록 조회, 검색 및 정렬 기능
- 🪑 **좌석 예매**: 실시간 좌석 현황 확인, 좌석 선택 및 예매
- 📊 **사용자 대시보드**: 내 예매 내역 관리
- 🎯 **관리자 기능**: 공연 등록/수정/삭제, 사용자 관리

## 🚀 시작하기

### 필수 조건

- Node.js 14.0.0 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm start

# 빌드
npm run build

# 테스트 실행
npm test
```

## 🎯 시연용 계정 정보

### 👤 일반 사용자 계정

**사용자 1:**
- 이메일: `user1@test.com`
- 비밀번호: `user123`
- 권한: 공연 조회, 예매, 내 예매 관리

**사용자 2:**
- 이메일: `user2@test.com`
- 비밀번호: `user123`
- 권한: 공연 조회, 예매, 내 예매 관리

### 👨‍💼 관리자 계정

- 이메일: `admin@st-booking.com`
- 비밀번호: `admin123`
- 권한: 전체 시스템 관리, 공연 등록/수정/삭제, 사용자 관리

## 📖 테스트 시나리오

1. **일반 사용자 기능 테스트**
   - 일반 사용자로 로그인하여 공연 목록 확인
   - 원하는 공연 선택 후 좌석 선택 및 예매
   - '내 예매' 메뉴에서 예매 내역 확인

2. **관리자 기능 테스트**
   - 관리자 계정으로 로그인하여 관리 기능 확인
   - 새로운 공연 등록 및 기존 공연 수정
   - 예매 현황 및 사용자 관리

## 🏗 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
├── pages/              # 페이지 컴포넌트
├── services/           # API 서비스 및 인증 로직
├── styles/             # CSS 스타일 파일
└── App.js              # 메인 애플리케이션 컴포넌트
```

## 🔗 관련 프로젝트

- **백엔드**: `st-booking-system-backend` (Spring Boot)
- **Database**: MySQL

## 🌐 API 연동

백엔드 서버가 `http://localhost:8080`에서 실행되어야 합니다.

주요 API 엔드포인트:
- `/auth/login` - 로그인
- `/auth/register` - 회원가입
- `/performances` - 공연 관리
- `/bookings` - 예매 관리
- `/admin` - 관리자 기능

## 📱 반응형 디자인

모바일, 태블릿, 데스크톱 모든 디바이스에서 최적화된 사용자 경험을 제공합니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 💡 추가 정보

### 개발 환경 설정

```bash
# 캐시 초기화 후 실행
npm run start:fresh

# 특정 포트에서 실행
PORT=3001 npm start
```

### 빌드 최적화

프로덕션 빌드는 코드 분할 및 최적화를 포함하여 최상의 성능을 제공합니다.

### 브라우저 지원

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)
