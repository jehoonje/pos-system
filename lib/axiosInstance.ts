import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = "http://localhost:8383"; // 백엔드 서버 주소

const axiosInstance = axios.create({
  baseURL: "/api",
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

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = Cookies.get("refreshToken");

      if (!refreshToken) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        Cookies.remove("accessToken");
        Cookies.remove("access_token");
        Cookies.remove("refreshToken");
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axiosInstance.post("/auth/refresh", {
          refreshToken,
        });
        if (refreshResponse.data.access_token) {
          Cookies.set("accessToken", refreshResponse.data.access_token, {
            expires: 1 / 24,
            secure: window.location.protocol === "https:", // 환경에 따라 유연하게
            sameSite: "Lax",
          });
          if (refreshResponse.data.refresh_token) {
            Cookies.set("refreshToken", refreshResponse.data.refresh_token, {
              expires: 7,
              secure: window.location.protocol === "https:",
              sameSite: "Lax",
            });
          }
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${refreshResponse.data.access_token}`;
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${refreshResponse.data.access_token}`;
          return axiosInstance(originalRequest);
        } else {
          throw new Error("No access_token in refresh response");
        }
      } catch (refreshError) {
        alert("인증이 만료되었습니다. 다시 로그인해주세요.");
        Cookies.remove("accessToken");
        Cookies.remove("access_token");
        Cookies.remove("refreshToken");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
