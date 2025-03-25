"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../lib/axiosInstance";
import Cookies from "js-cookie";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      router.push("/home");
    }
  }, [router]);

  // LoginPage.js 수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      console.log("로그인 응답:", response.data);

      const { access_token, refresh_token } = response.data;

      if (access_token && refresh_token) {
        // 토큰 저장
        Cookies.set("accessToken", access_token, {
          expires: 1 / 24,
          secure: window.location.protocol === "https:",
          sameSite: "Lax",
        });

        Cookies.set("refreshToken", refresh_token, {
          expires: 7,
          secure: window.location.protocol === "https:",
          sameSite: "Lax",
        });

        // 중요: 토큰 저장 후 페이지 새로고침 없이 상태 업데이트
        console.log("토큰 저장 완료, 홈으로 이동");

        // 방법 1: Next.js Router 사용 (권장)
        router.push("/home");

        // 방법 2: 필요시 강제 새로고침 (마지막 수단)
        // setTimeout(() => {
        //   window.location.href = "/home";
        // }, 100);
      } else {
        setErrorMsg("토큰이 응답에 포함되지 않았습니다.");
      }
    } catch (error: any) {
      console.error("로그인 오류:", error);
      setErrorMsg(
        error.response?.data?.message ||
          "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <form
        onSubmit={handleSubmit}
        className="bg-white backdrop-blur-lg p-6 rounded shadow-md w-80"
      >
        <h2 className="text-2xl font-bold mb-8 text-center">NONAMEYET</h2>
        {errorMsg && <p className="text-red-500 text-sm mb-2">{errorMsg}</p>}
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password" 
          />
        </div>
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="autoLogin"
            checked={autoLogin}
            onChange={(e) => setAutoLogin(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="autoLogin" className="text-sm">
            자동 로그인
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-400 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
