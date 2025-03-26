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
    return <Spinner />;
  }

  return (
    <div className={`flex items-center font-mono justify-center h-screen w-screen relative ${isDarkMode ? 'bg-gray-900' : ''}`}>
      <div className={`relative w-4/5 h-4/5 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white bg-opacity-20 border-gray-400'} border rounded-2xl p-6 flex flex-col justify-center items-center`}>
        <button
          onClick={handleBackClick}
          className={`absolute top-0 left-0 bg-transparent px-2 py-2 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-400'} text-sm rounded`}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {showMainUI && (
          <div
            className={`flex flex-col items-center justify-start ${
              fadeOutMainUI ? "fade-out fade-out-active" : ""
            }`}
          >
            <h1 className={`text-[40px] font-sans font-bold mb-[120px] ${isDarkMode ? "text-white" : "text-gray-700"}`}>
              Customize POS Settings
            </h1>
            <div className="grid grid-cols-3 gap-8 w-full relative">
              <button
                onClick={handleOrdersClick}
                className={`w-80 h-20 font-bold text-left flex flex-row items-center ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-transparent text-gray-900 border-gray-500'} border hover:text-white ${isDarkMode ? "hover:bg-[#111827]": "hover:bg-[#333]"} rounded-lg shadow-sm`}
              >
                <ShoppingBag className="w-6 h-6 mr-2 ml-10" />
                Orders
              </button>
              <button
                onClick={handleManagementClick}
                className={`w-80 h-20 font-bold text-left flex flex-row items-center ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-transparent text-gray-900 border-gray-500'} border hover:text-white ${isDarkMode ? "hover:bg-[#111827]": "hover:bg-[#333]"} rounded-lg shadow-sm`}
              >
                <SquareChartGantt className="w-6 h-6 mr-2 ml-10" />
                Management
              </button>
              <button
                onClick={handleTransferClick}
                className={`w-80 h-20 font-bold text-left flex flex-row items-center ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-transparent text-gray-900 border-gray-500'} border hover:text-white ${isDarkMode ? "hover:bg-[#111827]": "hover:bg-[#333]"} rounded-lg shadow-sm`}
              >
                <ArrowRightLeft className="w-6 h-6 mr-2 ml-10" />
                Transfer
              </button>
              <button
                onClick={handleItemsClick}
                className={`w-80 h-20 font-bold text-left flex flex-row items-center ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-transparent text-gray-900 border-gray-500'} border hover:text-white ${isDarkMode ? "hover:bg-[#111827]": "hover:bg-[#333]"} rounded-lg shadow-sm`}
              >
                <Archive className="w-6 h-6 mr-2 ml-10" />
                Items
              </button>
              <button
                onClick={handleSettingClick}
                className={`w-80 h-20 font-bold text-left flex flex-row items-center ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-transparent text-gray-900 border-gray-500'} border hover:text-white ${isDarkMode ? "hover:bg-[#111827]": "hover:bg-[#333]"}  rounded-lg shadow-sm`}
              >
                <Settings className="w-6 h-6 mr-2 ml-10" />
                Setting
              </button>
              <button
                onClick={handleCloseClick}
                className={`w-80 h-20 font-bold text-left flex flex-row items-center ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-transparent text-gray-900 border-gray-500'} border hover:text-white ${isDarkMode ? "hover:bg-[#111827]": "hover:bg-[#333]"}  rounded-lg shadow-sm`}
              >
                <PanelRightClose className="w-6 h-6 mr-2 ml-10" />
                Close
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
            }}
          >
            <div className="flex flex-row gap-4">
              <button
                onClick={handleEditItems}
                className={`w-52 h-14 font-bold ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-transparent text-gray-900 border-gray-500'} border hover:text-white ${isDarkMode ? "hover:bg-[#111827]": "hover:bg-[#333]"}  rounded-lg shadow-sm`}
              >
                Edit Items
              </button>
              <button
                onClick={handleEditCategories}
                className={`w-52 h-14 font-bold ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-transparent text-gray-900 border-gray-500'} border hover:text-white ${isDarkMode ? "hover:bg-[#111827]": "hover:bg-[#333]"} rounded-lg shadow-sm`}
              >
                Edit Categories
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
            }}
          >
            <div className="flex flex-col items-center gap-8">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Theme Settings
              </h2>
              
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center justify-between w-64">
                  <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium flex items-center gap-2`}>
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    {isDarkMode ? "Dark Mode" : "Light Mode"}
                  </span>
                  <button 
                    onClick={handleToggleDarkMode}
                    className={`relative w-16 h-8 transition-colors duration-300 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                    aria-label="Toggle dark mode"
                  >
                    <div 
                      className={`absolute w-6 h-6 bg-white rounded-full transform transition-transform duration-300 ${isDarkMode ? 'translate-x-8' : 'translate-x-1'} top-1`} 
                    />
                  </button>
                </div>
                
                <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Toggle to change system background color
                </div>
                
                <div className="flex flex-row gap-4 mt-4">
                  <div className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center">
                    <span className="text-xs text-black">Light</span>
                  </div>
                  <div className="w-12 h-12 rounded-md bg-[#222] border border-gray-700 flex items-center justify-center">
                    <span className="text-xs text-white">Dark</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCloseModal && (
          <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)}>
            <span className={`text-md mb-4 ${isDarkMode ? 'text-white' : ''}`}>영업을 마감하시겠습니까?</span>
            <div className="flex space-x-4">
              <button
                onClick={handleCloseBusiness}
                className="px-8 text-white bg-blue-500 rounded hover:bg-blue-300 transition"
              >
                예
              </button>
              <button
                onClick={() => setShowCloseModal(false)}
                className={`px-4 border ${isDarkMode ? 'border-gray-600 hover:bg-gray-600 text-white' : 'border-gray-400 hover:bg-gray-400'} rounded transition`}
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
                className={`relative w-[400px] h-[220px] rounded-lg shadow-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-white/30 bg-white'} p-6`}
                initial={{ scale: 0.9, opacity: 0, y: 0 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className={`flex flex-col items-center justify-center h-full ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <span className="text-lg font-medium mb-2 text-red-500">
                    영업 마감 불가
                  </span>
                  <span className="text-md mb-6 text-center">
                    {incompleteOrderMessage}
                  </span>
                  <button
                    onClick={() => setShowIncompleteOrderModal(false)}
                    className={`px-7 py-2 border ${isDarkMode ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-400 hover:bg-gray-400'} rounded transition`}
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
