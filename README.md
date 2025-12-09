# DB Team9 GGK: Shared Calendar

## 📌 Overview
DB Team9의 Shared Calendar 프로젝트입니다.  
Oracle DB 기반의 로그인 기능 및 개인/공유 일정 열람 기능을 제공합니다.

---

## 🚀 How to Run the Project

## 1. Backend (Next.js + OracleDB)

### 🔧 환경 설정
1. `backend/` 디렉토리로 이동한 후 `.env` 파일을 생성하세요.
   ```bash
   cp .env.example .env
   ```
2. 생성된 `.env` 파일에 실제 Oracle DB 접속 정보를 입력하세요.

### ▶️ 서버 실행
```bash
cd backend
yarn install
yarn dev
```
서버는 기본적으로 `http://localhost:3000` 에서 실행됩니다.

---

## 2. Frontend (React + Vite)

### 📦 최초 1회: 의존성 설치
```bash
cd frontend
npm install
```

### ▶️ 개발 서버 실행
```bash
npm run dev
```
개발 서버는 `http://localhost:5173` 에서 실행됩니다.

---

## ✔️ Notes
- Frontend → Backend 간 통신은 Vite Proxy 설정을 통해 `/api` 경로로 이루어집니다.
- Backend `.env` 파일은 보안상 Git에 업로드되지 않으며, 사용자 환경에 맞게 직접 설정해야 합니다.

