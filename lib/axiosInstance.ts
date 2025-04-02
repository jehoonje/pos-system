import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = "http://52.79.57.150:8383"; // 백엔드 서버 주소

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 쿠키를 서버와 함께 주고받기 위해 추가
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// axiosInstance.js 수정
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get("accessToken");
    console.log("요청 인터셉터, 토큰 확인:", !!accessToken);

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("응답 에러:", error.response?.status, error.config?.url);

    const originalRequest = error.config;

    // 401 에러 처리 (인증 실패)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 리프레시 토큰으로 새 액세스 토큰 요청
        const refreshToken = Cookies.get("refreshToken");
        if (!refreshToken) {
          throw new Error("리프레시 토큰 없음");
        }

        console.log("토큰 갱신 시도");
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        if (refreshResponse.data.access_token) {
          console.log("토큰 갱신 성공");
          Cookies.set("accessToken", refreshResponse.data.access_token, {
            expires: 1 / 24,
            path: "/", // 모든 경로에서 접근 가능하도록 설정
            secure: window.location.protocol === "https:",
            sameSite: "Lax",
          });

          if (refreshResponse.data.refresh_token) {
            Cookies.set("refreshToken", refreshResponse.data.refresh_token, {
              expires: 7,
              secure: window.location.protocol === "https:",
              sameSite: "Lax",
            });
          }

          // 새 토큰으로 원래 요청 재시도
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${refreshResponse.data.access_token}`;
          return axiosInstance(originalRequest);
        } else {
          throw new Error("토큰 갱신 실패");
        }
      } catch (refreshError) {
        console.error("토큰 갱신 오류:", refreshError);
        // 로그인 페이지로 리다이렉트
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    // 403 에러 처리 (권한 없음)
    if (error.response?.status === 403) {
      console.error("권한 없음 (403):", error.config?.url);
      // 필요시 추가 처리
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
