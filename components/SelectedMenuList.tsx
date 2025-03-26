"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { usePosStore, SelectedItem, Menu } from "../store/usePosStore";
import { motion, AnimatePresence } from "framer-motion";
import AlertModal from "@/components/AlertModal";
import useAlertModal from "@/hooks/useAlertModal";

interface SwipeableItemProps {
  item: SelectedItem;
  isDarkMode?: boolean; 
  onDelete: () => void;
}

interface SelectedMenuListProps {
  isDarkMode?: boolean; // Optional prop 추가
}

function SwipeableItem({ item, onDelete, isDarkMode = false }: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [isSwiped, setIsSwiped] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleStart = (x: number) => {
    setStartX(x);
    setDragging(true);
  };

  const handleMove = (x: number) => {
    if (startX !== null) {
      const deltaX = x - startX;
      setTranslateX(Math.max(-80, Math.min(0, deltaX)));
    }
  };

  const handleEnd = () => {
    if (translateX < -30) {
      setIsSwiped(true);
      setTranslateX(-80);
    } else {
      setIsSwiped(false);
      setTranslateX(0);
    }
    setStartX(null);
    setDragging(false);
  };

  const handleDelete = () => {
    setIsSwiped(false);
    setTranslateX(0);
    onDelete();
  };

  return (
    <div className={`relative w-full border-b overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
      <button
        className={`absolute top-0 right-0 h-full w-16 flex items-center justify-center bg-red-500 text-white transition-all border-l ${
          !item.menuId ? "opacity-50 cursor-not-allowed" : ""
        } ${isSwiped ? "translate-x-0" : "translate-x-full"} ${
          isDarkMode ? 'border-gray-700' : 'border-gray-300 border-b'
        }`}
        onClick={handleDelete}
        disabled={!item.menuId}
      >
        <Trash2 className="w-5 h-5" />
      </button>
      <div
        className={`flex items-center justify-between p-5 text-lg transition-transform duration-200 ${
          dragging ? "cursor-grabbing" : "cursor-pointer"
        } ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => dragging && handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        <span>
          {item.quantity} x {item.menuName}
          {!item.menuId && (
            <span className="text-red-500 text-sm"> (ID 없음)</span>
          )}
        </span>
        <span>₩ {(item.price * item.quantity).toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function SelectedMenuList({ isDarkMode = false }: SelectedMenuListProps) {
  const router = useRouter();
  const {
    storeId,
    placeId,
    orderMenuId,
    selectedItems,
    removeItem,
    clearItems,
    orderId,
    setOrderId,
    setPlaceId,
    setTableName,
    fetchUnpaidOrderByPlace,
    setSelectedItems,
  } = usePosStore();

  // useAlertModal 훅 사용
  const { alertState, showAlert, closeAlert } = useAlertModal();

  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (orderId) {
        try {
          const { data } = await axiosInstance.get(`/api/orders/detail/${orderId}`);
          const allMenus = Object.values(usePosStore.getState().menuCache).flatMap(storeMenus => 
            Object.values(storeMenus).flat()
          );
          const formattedItems = data.menuDetail.map((menu: any) => {
            const cachedMenu = allMenus.find((m: Menu) => m.menuName === menu.menuName);
            if (!cachedMenu) {
              console.warn(`[fetchOrderDetails] menuCache에서 ${menu.menuName}의 menuId를 찾을 수 없습니다.`);
            }
            return {
              menuName: menu.menuName,
              price: menu.totalPrice / menu.totalCount,
              quantity: menu.totalCount,
              menuId: cachedMenu ? cachedMenu.menuId : null,
              orderMenuId: menu.id || null,
            };
          });
          console.log("formattedItems: ", formattedItems);
          // setSelectedItems(formattedItems);
        } catch (error) {
          console.error("주문 상세 조회 실패:", error);
          showAlert("주문 상세 정보를 불러오는데 실패했습니다.", "error");
        }
      }
    };
  
    fetchOrderDetails();
  }, [orderId, setSelectedItems]);

  // placeId 변경 시 orderId가 없으면 아이템 초기화
  useEffect(() => {
    if (placeId && !orderId) {
      clearItems();
    }
  }, [placeId, orderId, clearItems]);

  const createOrder = async () => {
    if (!storeId || !placeId || selectedItems.length === 0) {
      showAlert("스토어, 테이블, 메뉴를 선택해주세요.", "warning");
      return null;
    }
    const validItems = selectedItems.filter((item) => item.menuId != null);
    if (validItems.length === 0) {
      showAlert("유효한 메뉴 항목이 없습니다.", "warning");
      return null;
    }
    const orderRequest = {
      storeId,
      placeId,
      items: validItems.map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity,
      })),
    };
    try {
      await axiosInstance.post("/api/orders", orderRequest);
      await fetchUnpaidOrderByPlace(placeId);
      const newOrderId = usePosStore.getState().orderId;
      clearItems();
      return newOrderId;
    } catch (error) {
      console.error("주문 생성 실패:", error);
      showAlert("주문 생성 중 오류가 발생했습니다.", "error");
      return null;
    }
  };

  const handleOrderClick = async () => {
    if (!storeId || !placeId || selectedItems.length === 0) {
      showAlert("메뉴를 선택해주세요.", "warning");
      return;
    }
  
    const validItems = selectedItems.filter((item) => item.menuId != null);
    if (validItems.length === 0) {
      showAlert("유효한 메뉴 항목이 없습니다.", "warning");
      return;
    }
  
    // 1) placeId로 미결제 주문이 있는지 새로 조회
    await fetchUnpaidOrderByPlace(placeId);
    let realOrderId = usePosStore.getState().orderId;
  
    // 2) 만약 realOrderId가 없으면 새 주문 생성
    if (!realOrderId) {
      realOrderId = await createOrder();
      if (!realOrderId) return;
      showAlert("주문이 완료되었습니다.", "success");
      // 상태 초기화 및 UI 반영 보장
      setOrderId(null);
      setPlaceId(null);
      setTableName("");
      clearItems();
      console.debug("[handleOrderClick] 주문 완료 후 selectedItems:", usePosStore.getState().selectedItems);
      return;
    }
  
    // 3) 이미 존재하는 주문인 경우 (추가 주문)
    const serverItems = usePosStore.getState().selectedItems;
    const clientMap = new Map(validItems.map((item) => [item.menuId, item.quantity]));
    const serverMap = new Map(serverItems.map((item) => [item.menuId, item.quantity]));
  
    const itemsToAdd = validItems
      .filter((item) => {
        const serverQty = serverMap.get(item.menuId) || 0;
        return item.quantity > serverQty;
      })
      .map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity - (serverMap.get(item.menuId) || 0),
      }));
  
    const itemsToRemove = serverItems
      .filter((item) => {
        const clientQty = clientMap.get(item.menuId) || 0;
        return clientQty < item.quantity && item.orderMenuId;
      })
      .map((item) => ({
        orderMenuId: item.orderMenuId!,
        menuId: item.menuId,
        quantity: item.quantity - (clientMap.get(item.menuId) || 0),
      }));
  
    // 4) 추가 주문 요청
    if (itemsToAdd.length > 0) {
      const addRequest = { storeId, placeId, items: itemsToAdd };
      console.debug("[handleOrderClick] 추가 주문 요청:", addRequest);
      try {
        await axiosInstance.post(`/api/orders/add/${realOrderId}`, addRequest);
        await fetchUnpaidOrderByPlace(placeId);
        showAlert("추가 주문이 완료되었습니다.", "success");
      } catch (error: any) {
        if (error.response?.status === 404) {
          setOrderId(null);
          const newOrderId = await createOrder();
          if (newOrderId) {
            showAlert("주문이 완료되었습니다.", "success");
            setOrderId(null);
            setPlaceId(null);
            setTableName("");
            clearItems();
            return;
          }
        } else {
          console.error("추가 주문 실패:", error);
          showAlert("추가 주문에 실패했습니다.", "error");
        }
      }
    }
  
    // 5) 삭제(환불) 처리
    if (itemsToRemove.length > 0) {
      try {
        for (const item of itemsToRemove) {
          const refundData = { menuId: item.menuId, quantity: item.quantity };
          console.debug("[handleOrderClick] 삭제 요청:", { orderMenuId: item.orderMenuId, refundData });
          await axiosInstance.delete(`/api/orders/${item.orderMenuId}`, {
            data: refundData,
            headers: { "Content-Type": "application/json" },
          });
        }
        await fetchUnpaidOrderByPlace(placeId);
        showAlert("삭제가 반영되었습니다.", "success");
      } catch (error) {
        console.error("삭제 요청 실패:", error);
        showAlert("삭제 요청이 실패했습니다. 서버 상태를 확인해주세요.", "error");
      }
    }
  
    if (itemsToAdd.length === 0 && itemsToRemove.length === 0) {
      showAlert("변경 사항이 없습니다.", "info");
    }
  
    // 6) 모든 경우에 대해 selectedItems 초기화
    clearItems();
    console.debug("[handleOrderClick] selectedItems 초기화 후:", usePosStore.getState().selectedItems);
  };

  const handleMenuDelete = async (item: SelectedItem) => {
    if (!item.menuId) {
      showAlert(`삭제할 메뉴의 ID가 누락되었습니다: ${item.menuName}`, "error");
      return;
    }
  
    if (!orderId) {
      removeItem(item.menuName);
      return;
    }
  
    try {
      // 먼저 현재 주문 상세 정보를 가져옴
      const { data } = await axiosInstance.get(`/api/orders/detail/${orderId}`);
      const orderItem = data.menuDetail.find(
        (menu: any) => menu.menuName === item.menuName
      );
      
      if (!orderItem || !orderItem.orderMenuId) {
        showAlert(`서버에서 해당 주문 항목을 찾을 수 없습니다: ${item.menuName}`, "error");
        removeItem(item.menuName);
        return;
      }
  
      const orderMenuId = orderItem.orderMenuId;
      const refundData = {
        menuId: orderItem.menuId,
        quantity: item.quantity,
      };
      
      // 마지막 메뉴인지 확인
      const isLastMenuItem = data.menuDetail.length === 1;
      
      console.debug("[handleMenuDelete] 삭제 요청 데이터:", refundData);
      console.debug("현재 메뉴가 마지막 메뉴인지:", isLastMenuItem);
      
      if (isLastMenuItem) {
        // 마지막 메뉴인 경우 전체 주문을 삭제
        try {
          // 먼저 개별 메뉴 삭제
          await axiosInstance.delete(`/api/orders/${orderMenuId}`, {
            data: refundData,
            headers: { "Content-Type": "application/json" },
          });
          
          console.debug(`마지막 메뉴 ${item.menuName} 삭제 완료, 전체 주문 삭제 시도...`);
          
          // 전체 주문 삭제 요청
          await axiosInstance.delete(`/api/orders/all/${orderId}`);
          console.debug(`주문 ID ${orderId} 완전히 삭제됨`);
          
          // 상태 초기화
          setOrderId(null);
          setSelectedItems([]);
          clearItems();
          
          // 사용자에게 알림
          showAlert("주문의 모든 항목이 삭제되어 주문이 취소되었습니다.", "success");
        } catch (deleteErr) {
          console.error("전체 주문 삭제 실패:", deleteErr);
          
          // 전체 주문 삭제 실패했더라도 UI에서는 초기화
          setOrderId(null);
          setSelectedItems([]);
          clearItems();
        }
      } else {
        // 마지막 메뉴가 아닌 경우 개별 메뉴만 삭제
        const response = await axiosInstance.delete(
          `/api/orders/${orderMenuId}`,
          {
            data: refundData,
            headers: { "Content-Type": "application/json" },
          }
        );
        console.debug(`메뉴 ${item.menuName} 삭제 완료:`, response.data);
  
        try {
          // 주문 상세 정보를 다시 가져와서 UI 업데이트
          const { data: updatedData } = await axiosInstance.get(
            `/api/orders/detail/${orderId}`
          );
          
          const formattedItems = updatedData.menuDetail.map((menu: any) => ({
            menuName: menu.menuName,
            price: menu.totalPrice / menu.totalCount,
            quantity: menu.totalCount,
            menuId: menu.menuId,
            orderMenuId: menu.orderMenuId || null,
          }));
          setSelectedItems(formattedItems);
        } catch (err: any) {
          // 주문 상세 정보를 가져오는데 실패한 경우 (404 등)
          console.error("주문 상세 정보 조회 실패:", err);
          if (err.response?.status === 404) {
            // 주문이 이미 없는 경우 상태 초기화
            setOrderId(null);
            setSelectedItems([]);
            clearItems();
          }
        }
      }
    } catch (err: any) {
      console.error("메뉴 삭제 실패:", err);
      if (err.response?.status === 404) {
        removeItem(item.menuName);
        
        // 주문 자체가 이미 없는 경우
        setOrderId(null);
        setSelectedItems([]);
        clearItems();
      } else {
        showAlert("메뉴 삭제에 실패했습니다. 서버 오류가 발생했습니다.", "error");
      }
    }
  };

  const handlePaymentClick = async () => {
    if (!placeId) {
      showAlert("테이블을 선택해주세요.", "warning");
      return;
    }
    let currentOrderId = orderId;
    let isNewOrder = 0;
    if (!currentOrderId && selectedItems.length > 0) {
      currentOrderId = await createOrder();
      if (!currentOrderId) return;
      setOrderId(currentOrderId);
      isNewOrder = 1;
    }
    if (!currentOrderId) {
      showAlert("결제할 주문이 없습니다.", "warning");
      return;
    }
    const searchParams = new URLSearchParams();
    searchParams.set("orderId", currentOrderId.toString());
    searchParams.set("placeId", placeId.toString());
    searchParams.set("selectedItems", JSON.stringify(selectedItems));
    searchParams.set("isNewOrder", isNewOrder.toString());
    const paymentUrl = `/payment?${searchParams.toString()}`;
    try {
      router.push(paymentUrl);
    } catch (error) {
      console.error("router.push 실패:", error);
      showAlert("페이지 이동 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <div className={`flex flex-col h-full w-full ${isDarkMode ? 'bg-gray-800 text-white' : ''}`}>
      <h1 className={`font-mono py-4 text-lg text-center border-b-2 ${isDarkMode ? 'border-gray-700 text-white' : 'text-gray-700 border-gray-300'}`}>
        Selected Menu
      </h1>
      <div className="flex-1 overflow-auto">
        {selectedItems.map((item, idx) => (
          <SwipeableItem
            key={idx}
            item={item}
            onDelete={() => handleMenuDelete(item)}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
      <div className={`mt-4 border-t-2 font-bold p-4 pt-2 flex flex-col space-y-2 ${isDarkMode ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-700'}`}>
        <div className="flex p-2 px-4 justify-between">
          <span>Total :</span>
          <span>₩ {totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex space-x-2 pb-4 gap-2">
          <button
            onClick={handleOrderClick}
            className={`flex-1 py-4 text-white transition rounded-md text-sm ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            Order
          </button>
          <button
            onClick={handlePaymentClick}
            className={`flex-1 py-4 transition rounded-md text-sm ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Pay
          </button>
        </div>
      </div>

      {/* 알림 모달 */}
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
