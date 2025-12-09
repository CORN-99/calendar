// src/Login.jsx
import { useState, useEffect } from "react";

const API_BASE = "/api"; // Next.js 백엔드

export default function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true); // true: 로그인, false: 회원가입
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [deptId, setDeptId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 학과 목록 불러오기 (회원가입 모드일 때만)
  useEffect(() => {
    if (!isLogin) {
      fetchDepartments();
    }
  }, [isLogin]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments`);
      const data = await res.json();
      if (res.ok) {
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("학과 목록 조회 실패:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!studentId || !name || !deptId) {
      setError("모든 필드를 입력해주세요.");
      setLoading(false);
      return;
    }

    if (studentId.length !== 10) {
      setError("학번은 10자리여야 합니다.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, name, deptId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "회원가입 실패");
        return;
      }

      // 회원가입 성공 → 자동으로 로그인 처리
      onLoginSuccess(data.user);
    } catch (err) {
      console.error(err);
      setError("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-lg w-96 space-y-4">
        {/* 탭 전환 */}
        <div className="flex border-b border-gray-700">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError("");
              setStudentId("");
              setName("");
              setDeptId("");
            }}
            className={`flex-1 py-2 text-center font-semibold ${
              isLogin
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError("");
              setStudentId("");
              setName("");
              setDeptId("");
            }}
            className={`flex-1 py-2 text-center font-semibold ${
              !isLogin
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            회원가입
          </button>
        </div>

        <form
          onSubmit={isLogin ? handleLogin : handleRegister}
          className="space-y-4"
        >
          <h1 className="text-xl font-semibold text-center">
            {isLogin ? "캠퍼스 캘린더 로그인" : "회원가입"}
          </h1>

          <div>
            <label className="block text-sm mb-1">학번</label>
            <input
              className="w-full px-3 py-2 rounded bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="예: 2019000147"
              maxLength={10}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm mb-1">이름</label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  maxLength={30}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">학과</label>
                <select
                  className="w-full px-3 py-2 rounded bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  required
                >
                  <option value="">학과를 선택하세요</option>
                  {departments.map((dept) => (
                    <option key={dept.DEPT_ID || dept.dept_id} value={dept.DEPT_ID || dept.dept_id}>
                      {dept.DEPT_NAME || dept.dept_name} ({dept.DEPT_ID || dept.dept_id})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded py-2 font-semibold transition-colors"
          >
            {loading ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
          </button>
        </form>
      </div>
    </div>
  );
}