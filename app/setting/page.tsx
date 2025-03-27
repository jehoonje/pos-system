"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ChevronLeft,
  Archive,
  PanelRightClose,
  ArrowRightLeft,
  SquareChartGantt,
  Settings,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../lib/axiosInstance";
import { useFormStore } from "@/store/formStore";
import { usePosStore } from "@/store/usePosStore";
import { useThemeStore } from "@/store/themeStore";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import Cookies from "js-cookie";

export default function SettingPage() {
  const router = useRouter();
  const { storeId, setStoreId } = useFormStore();
  const { resetData } = usePosStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  const [showMainUI, setShowMainUI] = useState(true);
  const [fadeOutMainUI, setFadeOutMainUI] = useState(false);
  const [showEditUI, setShowEditUI] = useState(false);
  const [fadeOutEditUI, setFadeOutEditUI] = useState(false);
  const [showSettingUI, setShowSettingUI] = useState(false);
  const [fadeOutSettingUI, setFadeOutSettingUI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showIncompleteOrderModal, setShowIncompleteOrderModal] = useState(false);
  const [incompleteOrderMessage, setIncompleteOrderMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = Cookies.get("accessToken");
      const currentStoreId = Cookies.get("currentStoreId");
      
      // 다크모드 배경색 적용
      if (isDarkMode) {
        document.body.style.backgroundColor = "#111827";
      } else {
        document.body.style.backgroundColor = "";
      }

      if (!token || !currentStoreId) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        router.push("/");
      } else {
        setStoreId(Number(currentStoreId));
      }
    }
  }, [router, setStoreId, isDarkMode]);

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleCloseBusiness = async () => {
    if (!storeId) return;
    try {
      const response = await axiosInstance.post(`/api/times/close/${storeId}`);
      if (
        response.data?.message?.includes("아직 완료되지 않은 주문이 존재합니다")
      ) {
        setIncompleteOrderMessage(response.data.message);
        setShowIncompleteOrderModal(true);
        setShowCloseModal(false);
      } else {
        setShowCloseModal(false);
        router.push("/home");
      }
    } catch (error) {
      // 오류 처리 생략 (UI에 표시되지 않음)
    }
  };

  const handleItemsClick = () => {
    setFadeOutMainUI(true);
    setTimeout(() => {
      setShowMainUI(false);
      setFadeOutMainUI(false);
      setShowEditUI(true);
    }, 400);
  };

  const handleSettingClick = () => {
    setFadeOutMainUI(true);
    setTimeout(() => {
      setShowMainUI(false);
      setFadeOutMainUI(false);
      setShowSettingUI(true);
    }, 400);
  };

  const handleToggleDarkMode = () => {
    toggleDarkMode();
  };

  const handleOrdersClick = () => {
    setIsLoading(true); // 로딩 시작
    
    // 페이지 이동 후에도 로딩 상태가 유지되도록 타임아웃 없이 바로 라우팅
    router.push("/setting/orders");
  };

  const handleManagementClick = () => {
    setIsLoading(true); // 로딩 시작
    
    // 페이지 이동 후에도 로딩 상태가 유지되도록 타임아웃 없이 바로 라우팅
    router.push("/setting/management");
  };

  const handleTransferClick = () => {
    resetData();
    Cookies.remove("currentStoreId");
    router.push("/home");
  };

  const handleBackClick = () => {
    if (showEditUI) {
      setFadeOutEditUI(true);
      setTimeout(() => {
        setShowEditUI(false);
        setFadeOutEditUI(false);
        setShowMainUI(true);
      }, 400);
    } else if (showSettingUI) {
      setFadeOutSettingUI(true);
      setTimeout(() => {
        setShowSettingUI(false);
        setFadeOutSettingUI(false);
        setShowMainUI(true);
      }, 400);
    } else {
      router.push("/pos");
    }
  };

  const handleEditItems = () => {
    if (storeId) {
      router.push(`/editmenu?storeId=${storeId}`);
    } else {
      alert("Store ID가 존재하지 않습니다.");
    }
  };

  const handleEditCategories = () => {
    if (storeId) {
      router.push(`/editcategory?storeId=${storeId}`);
    } else {
      alert("Store ID가 존재하지 않습니다.");
    }
  };

  // 로딩 중이면 스피너 표시
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-screen w-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <Spinner />
      </div>
    );
  }

  // 버튼 공통 스타일 함수
  const buttonClass = `font-bold text-left flex flex-row items-center ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-transparent text-gray-900 border-gray-500'} border hover:text-white ${isDarkMode ? "hover:bg-[#111827]": "hover:bg-[#333]"} rounded-lg shadow-sm transition-all duration-200`;

  return (
    <div className={`flex items-center font-mono justify-center h-screen w-screen relative ${isDarkMode ? 'bg-gray-900' : ''}`}>
      <div className={`relative w-[95%] max-w-7xl h-[90%] max-h-[900px] ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white bg-opacity-20 border-gray-400'} border rounded-2xl p-4 sm:p-6 flex flex-col justify-center items-center`}>
        <button
          onClick={handleBackClick}
          className={`absolute top-0 left-0 bg-transparent px-2 py-2 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-400'} text-sm rounded`}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {showMainUI && (
          <div
            className={`flex flex-col w-full items-center justify-start ${
              fadeOutMainUI ? "fade-out fade-out-active" : ""
            }`}
          >
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-sans font-bold mb-8 sm:mb-16 md:mb-20 lg:mb-24 ${isDarkMode ? "text-white" : "text-gray-700"}`}>
              Customize POS Settings
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 w-full max-w-5xl px-2">
              <button
                onClick={handleOrdersClick}
                className={`${buttonClass} h-16 sm:h-20 w-full p-2 sm:p-4`}
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 mr-2 ml-2 sm:ml-4 md:ml-6 lg:ml-8" />
                <span className="text-sm sm:text-base">Orders</span>
              </button>
              <button
                onClick={handleManagementClick}
                className={`${buttonClass} h-16 sm:h-20 w-full p-2 sm:p-4`}
              >
                <SquareChartGantt className="w-5 h-5 sm:w-6 sm:h-6 mr-2 ml-2 sm:ml-4 md:ml-6 lg:ml-8" />
                <span className="text-sm sm:text-base">Management</span>
              </button>
              <button
                onClick={handleTransferClick}
                className={`${buttonClass} h-16 sm:h-20 w-full p-2 sm:p-4`}
              >
                <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-2 ml-2 sm:ml-4 md:ml-6 lg:ml-8" />
                <span className="text-sm sm:text-base">Transfer</span>
              </button>
              <button
                onClick={handleItemsClick}
                className={`${buttonClass} h-16 sm:h-20 w-full p-2 sm:p-4`}
              >
                <Archive className="w-5 h-5 sm:w-6 sm:h-6 mr-2 ml-2 sm:ml-4 md:ml-6 lg:ml-8" />
                <span className="text-sm sm:text-base">Items</span>
              </button>
              <button
                onClick={handleSettingClick}
                className={`${buttonClass} h-16 sm:h-20 w-full p-2 sm:p-4`}
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 mr-2 ml-2 sm:ml-4 md:ml-6 lg:ml-8" />
                <span className="text-sm sm:text-base">Setting</span>
              </button>
              <button
                onClick={handleCloseClick}
                className={`${buttonClass} h-16 sm:h-20 w-full p-2 sm:p-4`}
              >
                <PanelRightClose className="w-5 h-5 sm:w-6 sm:h-6 mr-2 ml-2 sm:ml-4 md:ml-6 lg:ml-8" />
                <span className="text-sm sm:text-base">Close</span>
              </button>
            </div>
          </div>
        )}

        {showEditUI && (
          <div
            className={`fade-in ${
              fadeOutEditUI ? "fade-out fade-out-active" : "fade-in-active"
            }`}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: "600px"
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full">
              <button
                onClick={handleEditItems}
                className={`${buttonClass} w-full sm:w-1/2 h-14 sm:h-16 p-2 sm:p-4 flex justify-center`}
              >
                <span className="text-sm sm:text-base">Edit Items</span>
              </button>
              <button
                onClick={handleEditCategories}
                className={`${buttonClass} w-full sm:w-1/2 h-14 sm:h-16 p-2 sm:p-4 flex justify-center`}
              >
                <span className="text-sm sm:text-base">Edit Categories</span>
              </button>
            </div>
          </div>
        )}

        {showSettingUI && (
          <div
            className={`fade-in ${
              fadeOutSettingUI ? "fade-out fade-out-active" : "fade-in-active"
            }`}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: "400px"
            }}
          >
            <div className="flex flex-col items-center gap-6 sm:gap-8">
              <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Theme Settings
              </h2>
              
              <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
                <div className="flex items-center justify-between w-full max-w-xs">
                  <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium flex items-center gap-2`}>
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    {isDarkMode ? "Dark Mode" : "Light Mode"}
                  </span>
                  <button 
                    onClick={handleToggleDarkMode}
                    className={`relative w-14 sm:w-16 h-7 sm:h-8 transition-colors duration-300 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                    aria-label="Toggle dark mode"
                  >
                    <div 
                      className={`absolute w-5 sm:w-6 h-5 sm:h-6 bg-white rounded-full transform transition-transform duration-300 ${isDarkMode ? 'translate-x-7 sm:translate-x-8' : 'translate-x-1'} top-1`} 
                    />
                  </button>
                </div>
                
                <div className={`mt-2 sm:mt-4 text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Toggle to change system background color
                </div>
                
                <div className="flex flex-row gap-3 sm:gap-4 mt-2 sm:mt-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center">
                    <span className="text-xs text-black">Light</span>
                  </div>
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-md bg-[#222] border border-gray-700 flex items-center justify-center">
                    <span className="text-xs text-white">Dark</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCloseModal && (
          <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)}>
            <span className={"text-md mb-4 text-black"}>영업을 마감하시겠습니까?</span>
            <div className="flex space-x-4">
              <button
                onClick={handleCloseBusiness}
                className="px-8 text-white bg-blue-500 rounded hover:bg-blue-300 transition"
              >
                예
              </button>
              <button
                onClick={() => setShowCloseModal(false)}
                className={"px-4 border border-gray-400 hover:bg-gray-400 text-black rounded transition"}
              >
                아니오
              </button>
            </div>
          </Modal>
        )}

        <AnimatePresence>
          {showIncompleteOrderModal && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-lg z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <motion.div
                className={`relative w-[90%] max-w-[400px] h-auto min-h-[200px] rounded-lg shadow-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-white/30 bg-white'} p-4 sm:p-6`}
                initial={{ scale: 0.9, opacity: 0, y: 0 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className={`flex flex-col items-center justify-center h-full ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <span className="text-base sm:text-lg font-medium mb-2 text-red-500">
                    영업 마감 불가
                  </span>
                  <span className="text-sm sm:text-md mb-6 text-center">
                    {incompleteOrderMessage}
                  </span>
                  <button
                    onClick={() => setShowIncompleteOrderModal(false)}
                    className={`px-5 sm:px-7 py-1.5 sm:py-2 border ${isDarkMode ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-400 hover:bg-gray-400'} rounded transition`}
                  >
                    확인
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
