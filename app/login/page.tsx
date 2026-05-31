"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [stdId, setStdId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        doLogin();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [stdId, password]);

  const showError = (msg: string) => {
    setError(msg);
  };

  const hideError = () => {
    setError("");
  };

  const doLogin = async () => {
    const username = stdId.trim();
    const pwd = password.trim();

    if (!username || !pwd) {
      showError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    hideError();
    setLoading(true);

    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: pwd }),
      });
      const result = await loginRes.json();

      if (!result.success) {
        showError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      const th_year = result.default_year_term.th_year;
      const term = result.default_year_term.term;
      const id_code = result.username;
      const token = result.token;

      localStorage.setItem("year", th_year);
      localStorage.setItem("term", term);
      localStorage.setItem("id_code", id_code);
      localStorage.setItem("student_id", id_code);
      localStorage.setItem("token", token);
      localStorage.setItem("user_role", result.role ?? "user");
      console.log('[login] role from API:', result.role, '| stored:', result.role ?? 'user');
      localStorage.removeItem("reseller_id");
      localStorage.removeItem("reseller_name");

      const coursesRes = await fetch(
        `/api/courses?year=${encodeURIComponent(th_year)}&term=${encodeURIComponent(term)}&id_code=${encodeURIComponent(id_code)}&token=${encodeURIComponent(token)}`,
      );
      const data = await coursesRes.json();

      localStorage.setItem("subjects", JSON.stringify(data.subjects || []));
      if (data.student) {
        localStorage.setItem("full_name", data.student.full_name);
        localStorage.setItem("id_class", data.student.id_class);
      }

      router.push("/courses");
    } catch (err: any) {
      showError("เกิดข้อผิดพลาด: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-600 mb-5 shadow-lg shadow-indigo-200">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Blueberry</h1>
          <p className="text-slate-500 mt-2 text-sm">
            เข้าสู่ระบบเพื่อดูรายวิชาและติดตามความคืบหน้า
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                รหัสนักศึกษา
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <input
                  id="std_id"
                  type="text"
                  placeholder="เช่น 6811677177130"
                  value={stdId}
                  onChange={(e) => setStdId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  id="password"
                  type="password"
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={doLogin}
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 text-sm"
            >
              <span>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
              {loading && (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          ข้อมูลใช้เพื่อดึงเนื้อหาผ่าน API เท่านั้น
        </p>
      </div>

      <style jsx>{`
        * {
          font-family: "IBM Plex Sans Thai", sans-serif;
        }
        .fade-in {
          animation: fadeIn 0.4s ease forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
