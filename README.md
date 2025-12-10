# DB Team9 GGK: Shared Calendar

## 📌 Overview
DB Team9의 Shared Calendar 프로젝트입니다.  
Oracle DB 기반의 로그인 기능 및 개인/공유 일정 열람 기능을 제공합니다.

---

## 🚀 설치 및 실행 가이드

### 1️⃣ 프로젝트 클론

```bash
git clone https://github.com/CORN-99/calendar.git
cd calendar
```

---

### 2️⃣ Backend 설정 및 실행 (Next.js + OracleDB)

#### 📋 사전 요구사항
- Node.js (v18 이상 권장)
- Yarn 또는 npm
- Oracle Database 접속 정보

#### 🔧 환경 설정
1. `backend/` 디렉토리로 이동합니다.
   ```bash
   cd backend
   ```

2. `.env` 파일을 생성합니다.
   ```bash
   # .env.example 파일이 있다면
   cp .env.example .env
   
   # 또는 직접 생성
   touch .env
   ```

3. 생성된 `.env` 파일에 Oracle DB 접속 정보를 입력합니다.
   ```env
  DB_USER=CALENDAR_USER
   DB_PASSWORD=YOUR_PASSWORD_HERE
   DB_CONNECT_STRING=localhost:1521/XEPDB1
   ```

#### 📦 의존성 설치
```bash
yarn install
# 또는
npm install
```

#### ▶️ 서버 실행
```bash
yarn dev
# 또는
npm run dev
```

서버는 기본적으로 `http://localhost:3000` 에서 실행됩니다.

---

### 3️⃣ Frontend 설정 및 실행 (React + Vite)

#### 📋 사전 요구사항
- Node.js (v18 이상 권장)
- npm

#### 📦 의존성 설치
1. `frontend/` 디렉토리로 이동합니다.
   ```bash
   cd frontend
   ```

2. 의존성을 설치합니다.
   ```bash
   npm install
   ```

#### ▶️ 개발 서버 실행
```bash
npm run dev
```

개발 서버는 `http://localhost:5173` 에서 실행됩니다.

---

## 📝 실행 순서 요약

1. **프로젝트 클론**
   ```bash
   git clone <repository-url>
   cd calendar
   ```

2. **Backend 설정 및 실행** (터미널 1)
   ```bash
   cd backend
   # .env 파일 생성 및 설정
   yarn install
   yarn dev
   ```

3. **Frontend 설정 및 실행** (터미널 2)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **브라우저에서 접속**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

---

## ✔️ Notes
- Frontend → Backend 간 통신은 Vite Proxy 설정을 통해 `/api` 경로로 이루어집니다.
- Backend `.env` 파일은 보안상 Git에 업로드되지 않으며, 사용자 환경에 맞게 직접 설정해야 합니다.
- Backend와 Frontend는 각각 별도의 터미널에서 실행해야 합니다.

