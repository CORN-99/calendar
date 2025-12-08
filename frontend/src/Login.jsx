// src/Login.jsx
import { useState } from "react";

const API_BASE = "/api"; // Next.js 백엔드

export default function Login({ onLoginSuccess }) {
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "로그인 실패");
        return;
      }

      // 로그인 성공 → 상위(App)로 user 객체 넘겨주기
      onLoginSuccess(data.user);
    } catch (err) {
      console.error(err);
      setError("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg w-80 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">캠퍼스 캘린더 로그인</h1>
        <div>
          <label className="block text-sm mb-1">학번</label>
          <input
            className="w-full px-3 py-2 rounded bg-gray-700 outline-none"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="예: 2019000147"
          />
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 rounded py-2 font-semibold"
        >
          로그인
        </button>
      </form>
    </div>
  );
}