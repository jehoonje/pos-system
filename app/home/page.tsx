"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/Modal";
import AlertModal from "@/components/AlertModal";
import useAlertModal from "@/hooks/useAlertModal";
import { AxiosError } from "axios";
import Cookies from "js-cookie";

interface Store {
  storeId: string;
  storeName: string;
}

interface OperatingTime {
  storeId: number;
  closedAt: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const { alertState, showAlert, closeAlert } = useAlertModal();

  const refetchStores = async () => {
    try {
      const response = await axiosInstance.get("/api/stores");
      if (Array.isArray(response.data)) {
        setStores(response.data);
      } else {
        throw new Error("Invalid stores data format");
      }
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 401) {
        await handleTokenRefresh();
      } else {
        showAlert("스토어 정보를 가져오는데 실패했습니다.", "error");
      }
    }
  };

  const handleTokenRefresh = async () => {
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) {
      showAlert("세션이 만료되었습니다. 다시 로그인해주세요.", "warning");
      handleLogout();
      return;
    }

    try {
      const response = await axiosInstance.post("/auth/refresh", { refreshToken });
      if (response.data.access_token) {
        Cookies.set("accessToken", response.data.access_token, {
          expires: 1 / 24, // 1시간
          secure: true,
          sameSite: "Strict",
        });
        if (response.data.refresh_token) {
          Cookies.set("refreshToken", response.data.refresh_token, {
            expires: 7, // 7일
            secure: true,
            sameSite: "Strict",
          });
        }
        await refetchStores();
      } else {
        throw new Error("No access_token in refresh response");
      }
    } catch (error) {
      showAlert("세션이 만료되었습니다. 다시 로그인해주세요.", "warning");
      handleLogout();
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const accessToken = Cookies.get("accessToken");
      const refreshToken = Cookies.get("refreshToken");

      if (!accessToken && !refreshToken) {
        showAlert("세션이 만료되었습니다. 다시 로그인해주세요.", "warning");
        handleLogout();
      } else if (!accessToken && refreshToken) {
        await handleTokenRefresh();
      } else {
        await refetchStores();
      }
    };
    initialize();
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      // 로그아웃 실패 시에도 진행
    } finally {
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      Cookies.remove("currentStoreId");
      router.push("/");
    }
  };

  const handleGoCreate = () => router.push("/create");

  const handleStoreButtonClick = (store: Store) => {
    setSelectedStore(store);
    setEnteredPassword("");
    setLoginError("");
    setShowStoreModal(true);
  };

  const handleNumberClick = (num: string) => {
    if (loginError) {
      setLoginError("");
      setEnteredPassword("");
    }
    if (enteredPassword.length < 4) {
      setEnteredPassword((prev) => prev + num);
    }
  };

  const handleClearClick = () => {
    setEnteredPassword("");
    setLoginError("");
  };

  const handleConfirmClick = async () => {
    if (!enteredPassword || !selectedStore) return;

    try {
      const response = await axiosInstance.post("/api/stores/login", {
        storeId: selectedStore.storeId,
        password: enteredPassword,
      });
      const { storeId } = response.data;
      if (!storeId) throw new Error("스토어 정보가 응답에 포함되지 않았습니다.");

      Cookies.set("currentStoreId", storeId.toString(), {
        expires: 1, // 1일
        secure: true,
        sameSite: "Strict",
      });

      const operatingTimesResponse = await axiosInstance.get("/api/times/all-info");
      const operatingTimes = operatingTimesResponse.data;

      const isStoreAlreadyOpen = operatingTimes.some(
        (time: OperatingTime) =>
          time.storeId.toString() === storeId.toString() && time.closedAt === null
      );

      setShowStoreModal(false);
      if (isStoreAlreadyOpen) {
        showAlert("이미 오픈 되어있는 매장이 있습니다.", "warning", false);
        setTimeout(() => {
          closeAlert();
          router.push("/pos");
        }, 3000);
      } else {
        setShowStartModal(true);
      }
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 401) {
        setLoginError("비밀번호가 틀렸습니다.");
        setEnteredPassword("");
      }
    }
  };

  const handleStartBusiness = async () => {
    if (!selectedStore) return;
    try {
      await axiosInstance.post(`/api/times/open/${selectedStore.storeId}`);
      setShowStartModal(false);
      router.push("/pos");
    } catch (error) {
      showAlert("매장 오픈 중 오류가 발생했습니다.", "error");
    }
  };

  const currentTime = new Date().toLocaleTimeString();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 relative">
      <div className={`grid ${stores.length <= 1 ? "grid-cols-1" : "grid-cols-3"} gap-4`}>
        {stores.map((store) => (
          <button
            key={store.storeId}
            onClick={() => handleStoreButtonClick(store)}
            className="w-[100px] h-[100px] bg-gray-300 shadow-md text-white flex items-center justify-center rounded-[25px] hover:bg-gray-400 transition"
          >
            <span className="text-lg font-bold">{store.storeName}</span>
          </button>
        ))}
        <button
          onClick={handleGoCreate}
          className="w-[100px] h-[100px] bg-gray-300 shadow-md text-white flex items-center justify-center rounded-[25px] hover:bg-gray-400 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 border-none text-[#777] text-xs px-4 py-2 rounded hover:bg-gray-200/20 hover:text-gray-800 hover:backdrop-blur-3xl transition"
      >
        Logout
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="flex flex-col items-center justify-center h-full text-[#555]">
          <h1 className="text-md">로그아웃 하시겠습니까?</h1>
          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleLogout}
              className="px-8 bg-blue-500 text-white rounded hover:bg-blue-400 transition"
            >
              예
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 border border-gray-400 rounded hover:bg-gray-400 transition"
            >
              아니오
            </button>
          </div>
        </div>
      </Modal>

      <AnimatePresence>
        {showStoreModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onClick={() => setShowStoreModal(false)}
          >
            <motion.div
              className="relative w-[320px] h-[400px] rounded-xl shadow-lg border border-white/30 bg-white p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 mt-12 text-center text-gray-800 h-10 flex items-center border-b border-gray-300 justify-center">
                {loginError ? (
                  <span className="text-xs text-red-500">{loginError}</span>
                ) : (
                  <span className="text-2xl">
                    {enteredPassword
                      .split("")
                      .map((char, index) =>
                        index === enteredPassword.length - 1 ? char : "●"
                      )
                      .join("")}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "Del", "0", "✓"].map(
                  (key, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        key === "Del"
                          ? handleClearClick()
                          : key === "✓"
                          ? handleConfirmClick()
                          : handleNumberClick(key)
                      }
                      className="flex items-center justify-center h-12 bg-[#f5f5f5] rounded hover:bg-gray-200 transition"
                    >
                      {key}
                    </button>
                  )
                )}
              </div>

              <div className="h-[45px] mt-2 flex items-center justify-center mb-2">
                <button
                  onClick={() => {
                    setShowStoreModal(false);
                    setEnteredPassword("");
                    setLoginError("");
                  }}
                  className="text-gray-500 hover:text-gray-700 w-full py-2 shadow-sm"
                >
                  close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={showStartModal} onClose={() => setShowStartModal(false)}>
        <div className="flex flex-col items-center justify-center h-full text-gray-800">
          <span className="text-lg mb-2">현재 시간: {currentTime}</span>
          <span className="text-md mb-4">영업을 시작하시겠습니까?</span>
          <div className="flex pt-1 space-x-4">
            <button
              onClick={handleStartBusiness}
              className="px-9 text-white bg-blue-500 pt-1 rounded hover:bg-blue-400 transition"
            >
              예
            </button>
            <button
              onClick={() => setShowStartModal(false)}
              className="px-6 border border-gray-200 pt-1 rounded hover:bg-gray-100 transition"
            >
              아니오
            </button>
          </div>
        </div>
      </Modal>

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
      />
    </div>
  );
}