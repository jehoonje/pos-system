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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../lib/axiosInstance";
import { useFormStore } from "@/store/formStore";
import { usePosStore } from "@/store/usePosStore";
import Modal from "@/components/Modal";
import Cookies from "js-cookie";

export default function SettingPage() {
  const router = useRouter();
  const { storeId, setStoreId } = useFormStore();
  const { resetData } = usePosStore();

  const [showMainUI, setShowMainUI] = useState(true);
  const [fadeOutMainUI, setFadeOutMainUI] = useState(false);
  const [showEditUI, setShowEditUI] = useState(false);
  const [fadeOutEditUI, setFadeOutEditUI] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showIncompleteOrderModal, setShowIncompleteOrderModal] = useState(false);
  const [incompleteOrderMessage, setIncompleteOrderMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = Cookies.get("accessToken");
      const currentStoreId = Cookies.get("currentStoreId");

      if (!token || !currentStoreId) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        router.push("/");
      } else {
        setStoreId(Number(currentStoreId));
      }
    }
  }, [router, setStoreId]);

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

  const handleOrdersClick = () => {
    router.push("/setting/orders");
  };

  const handleManagementClick =  () => {
    router.push("/setting/management")
  }

  const handleSettingShow=  () => {

  }

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

  return (
    <div className="flex items-center font-mono justify-center h-screen w-screen relative">
      <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl p-6 flex flex-col justify-center items-center">
        <button
          onClick={handleBackClick}
          className="absolute top-0 left-0 bg-transparent px-2 py-2 text-gray-500 text-sm rounded hover:text-gray-400"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {showMainUI && (
          <div
            className={`flex flex-col items-center justify-start ${
              fadeOutMainUI ? "fade-out fade-out-active" : ""
            }`}
          >
            <h1 className="text-[40px] font-sans font-bold text-gray-700 mb-[120px]">
              Customize POS Settings
            </h1>
            <div className="grid grid-cols-3 gap-8 w-full relative">
              <button
                onClick={handleOrdersClick}
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <ShoppingBag className="w-6 h-6 mr-2 ml-10" />
                Orders
              </button>
              <button
                onClick={handleManagementClick}
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <SquareChartGantt className="w-6 h-6 mr-2 ml-10" />
                Management
              </button>
              <button
                onClick={handleTransferClick}
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <ArrowRightLeft className="w-6 h-6 mr-2 ml-10" />
                Transfer
              </button>
              <button
                onClick={handleItemsClick}
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <Archive className="w-6 h-6 mr-2 ml-10" />
                Items
              </button>
              <button
                onClick={handleTransferClick}
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                <Settings className="w-6 h-6 mr-2 ml-10" />
                Setting
              </button>
              <button
                onClick={handleCloseClick}
                className="w-80 h-20 font-bold text-left flex flex-row items-center bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
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
                className="w-52 h-14 font-bold bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                Edit Items
              </button>
              <button
                onClick={handleEditCategories}
                className="w-52 h-14 font-bold bg-transparent text-gray-700 border border-gray-500 hover:text-white hover:bg-[#333] rounded-lg shadow-sm"
              >
                Edit Categories
              </button>
            </div>
          </div>
        )}

        {showCloseModal && (
          <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)}>
            <span className="text-md mb-4">영업을 마감하시겠습니까?</span>
            <div className="flex space-x-4">
              <button
                onClick={handleCloseBusiness}
                className="px-8 text-white bg-blue-500 rounded hover:bg-blue-300 transition"
              >
                예
              </button>
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 border border-gray-400 rounded hover:bg-gray-400 transition"
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
                className="relative w-[400px] h-[220px] rounded-lg shadow-lg border border-white/30 bg-white p-6"
                initial={{ scale: 0.9, opacity: 0, y: 0 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className="flex flex-col items-center justify-center h-full text-gray-800">
                  <span className="text-lg font-medium mb-2 text-red-500">
                    영업 마감 불가
                  </span>
                  <span className="text-md mb-6 text-center">
                    {incompleteOrderMessage}
                  </span>
                  <button
                    onClick={() => setShowIncompleteOrderModal(false)}
                    className="px-7 py-2 border border-gray-400 rounded hover:bg-gray-400 transition"
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