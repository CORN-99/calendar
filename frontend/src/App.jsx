import { useState, useEffect } from "react";
import Login from "./Login.jsx";
import CalendarUI from "./CalendarView.jsx";

const STORAGE_KEY = "calendar_user";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // sessionStorage에서 사용자 정보 복원
  useEffect(() => {
    const savedUser = sessionStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (err) {
        console.error("사용자 정보 복원 실패:", err);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // 사용자 정보 저장 및 업데이트
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  // 로딩 중일 때는 아무것도 표시하지 않음
  if (isLoading) {
    return null;
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <CalendarUI currentUser={currentUser} onLogout={handleLogout} />;
}