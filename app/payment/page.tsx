"use client";
import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { usePosStore } from "@/store/usePosStore";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/Modal";

// 타입 정의
interface Item {
  price: number;
  quantity: number;
  menuId?: number;
}

interface MockPGResult {
  success: boolean;
}

const mockPGApi = (): Promise<MockPGResult> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 1000);
  });
};

/** 결제 페이지 */
export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedItems: Item[] = JSON.parse(
    searchParams.get("selectedItems") || "[]"
  );
  const orderId = searchParams.get("orderId");
  const placeId = searchParams.get("placeId");
  const isNewOrderParam = searchParams.get("isNewOrder");

  const { storeId, resetData, fetchUnpaidOrderByPlace } = usePosStore();

  // 상태 관리
  const [totalAmount, setTotalAmount] = useState(0);
  const [prevTotalAmount, setPrevTotalAmount] = useState(0);
  const [charge, setCharge] = useState(0);
  const [splitAmount, setSplitAmount] = useState(0);
  const [paidByCard, setPaidByCard] = useState(0);
  const [paidByCash, setPaidByCash] = useState(0); // 실제 서버에 전송된 현금 결제 금액
  const [isSplitVisible, setIsSplitVisible] = useState(false);
  const [isOtherClicked, setIsOtherClicked] = useState(false);
  // 기존 신용카드 결제 모달 (필요 시 활용)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // 새로 추가된 영수증 출력 여부 모달
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  // 최소 결제 금액 경고 모달
  const [showMinAmountModal, setShowMinAmountModal] = useState(false);
  const [latestPaymentId, setLatestPaymentId] = useState<number | null>(null);
  const [paymentIds, setPaymentIds] = useState<number[]>([]); // 모든 결제 ID 추적

  // useMemo를 사용하여 initialTotal 계산
  const initialTotal = useMemo(() => {
    return selectedItems.reduce(
      (acc: number, item: Item) => acc + item.price * item.quantity,
      0
    );
  }, [selectedItems]);

  // displayAmount 계산 - charge 값도 반영되도록 수정
  const displayAmount = useMemo(() => {
    const remainingAmount = Math.max(0, initialTotal - paidByCash - paidByCard);
    
    // 현금 입력(charge)과 splitAmount 모두 고려하여 표시
    let tempAmount = remainingAmount;
    
    // Split 금액이 있으면 차감
    if (isSplitVisible && splitAmount > 0) {
      tempAmount = Math.max(0, tempAmount - splitAmount);
    }
    
    // 입력된 현금(charge)이 있으면 차감
    if (charge > 0) {
      tempAmount = Math.max(0, tempAmount - charge);
    }
    
    return tempAmount;
  }, [initialTotal, paidByCash, paidByCard, splitAmount, isSplitVisible, charge]);

  // totalAmount 계산 및 업데이트
  useEffect(() => {
    console.log(
      "Updating totalAmount:",
      displayAmount,
      "initialTotal:",
      initialTotal,
      "charge:",
      charge,
      "paidByCash:",
      paidByCash,
      "paidByCard:",
      paidByCard,
      "splitAmount:",
      splitAmount,
      "isSplitVisible:",
      isSplitVisible
    );
    
    setPrevTotalAmount(totalAmount);
    setTotalAmount(displayAmount);
  }, [displayAmount, totalAmount]);

  const handleCashButtonClick = (amount: number) => {
    setCharge((prev) => prev + amount);
  };

  const handleOtherClick = () => {
    setIsOtherClicked(true);
  };

  const handleChargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setCharge(value);
  };

  const handleChargeReset = () => {
    setCharge(0);
    setIsOtherClicked(false);
  };

  const handleSplitToggle = () => {
    setIsSplitVisible((prev) => !prev);
    if (!isSplitVisible) {
      setSplitAmount(0);
    } else {
      // Split 토글을 끄면 입력한 splitAmount 취소
      setSplitAmount(0);
    }
  };

  const handleSplitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numberValue = value === "" ? 0 : parseInt(value, 10) || 0;
    setSplitAmount(numberValue);
  };

  const handleConfirmPayment = async () => {
    setShowConfirmModal(false);
    const result: MockPGResult = await mockPGApi();
    if (result.success) {
      setSplitAmount(initialTotal);
      setTotalAmount(0);
    }
  };

  const handleCreditCardClick = async () => {
    // split 값이 0인 경우 (입력하지 않은 경우) 전체 금액 결제
    const amountToCharge = splitAmount === 0 ? totalAmount : splitAmount;

    // split 값이 0보다 크고 1000 이하인 경우 경고 모달 표시
    if (splitAmount > 0 && splitAmount <= 1000) {
      setShowMinAmountModal(true);
      return;
    }

    if (amountToCharge > totalAmount + splitAmount) {
      alert("카드 결제 금액은 남은 총액을 초과할 수 없습니다.");
      return;
    }

    try {
      const paymentData = {
        storeId: storeId ?? null,
        orderId: orderId ? parseInt(orderId) : null,
        placeId: placeId ? parseInt(placeId) : null,
        discountAmount: 0,
        paidMoney: amountToCharge, // 계산된 금액 사용
        paymentType: "CARD",
        cardCompany: "국민",
        cardNumber: "1234-1234-1234-1234",
        expiryDate: "2027/12",
      };

      console.log(
        "Sending credit card payment request:",
        JSON.stringify(paymentData, null, 2)
      );
      const response = await axiosInstance.post("/api/pay", paymentData);
      console.log("카드 결제 성공:", response.data);

      // 카드 결제 ID 저장
      const paymentId = response.data.paymentId || null;
      if (paymentId) {
        setLatestPaymentId(paymentId);
        setPaymentIds((prev) => [...prev, paymentId]);
      }

      // 카드 결제 금액 누적
      setPaidByCard((prev) => prev + amountToCharge);
      setSplitAmount(0); // 카드 결제 후 splitAmount 초기화
      setIsSplitVisible(false); // Split 모드 비활성화

      // 현금도 함께 처리해야 하는 경우
      if (charge > 0) {
        await processCashPayment(charge);
        setCharge(0); // 현금 결제 처리 후 charge 초기화
      }

      // totalAmount가 0이 되었을 때만 영수증 모달 표시
      const remainingAmount =
        initialTotal - paidByCash - paidByCard - amountToCharge - (charge > 0 ? charge : 0);
      if (remainingAmount <= 0) {
        setShowReceiptModal(true);
      }
    } catch (error: any) {
      console.error("카드 결제 오류:", error.response?.data || error);
      alert("카드 결제 중 오류가 발생했습니다.");
    }
  };

  // 현금 결제 처리 함수 (재사용성을 위해 분리)
  const processCashPayment = async (cashAmount: number) => {
    if (cashAmount <= 0) return;

    try {
      const paymentData = {
        storeId: storeId ?? null,
        orderId: orderId ? parseInt(orderId) : null,
        placeId: placeId ? parseInt(placeId) : null,
        discountAmount: 0,
        paidMoney: cashAmount,
        paymentType: "CASH",
        cardCompany: "",
        cardNumber: "",
        expiryDate: "",
      };

      console.log(
        "Sending cash payment request:",
        JSON.stringify(paymentData, null, 2)
      );
      const response = await axiosInstance.post("/api/pay", paymentData);
      console.log("현금 결제 성공:", response.data);

      // 현금 결제 ID 저장
      const paymentId = response.data.paymentId || null;
      if (paymentId) {
        setLatestPaymentId(paymentId);
        setPaymentIds((prev) => [...prev, paymentId]);
      }

      // 서버에 전송된 현금 결제 금액 누적
      setPaidByCash((prev) => prev + cashAmount);

      return true;
    } catch (error: any) {
      console.error("현금 결제 오류:", error.response?.data || error);
      alert("현금 결제 중 오류가 발생했습니다.");
      return false;
    }
  };

  const handleDoneClick = async () => {
    // 남은 결제 금액 체크
    const remainingAmount = initialTotal - paidByCash - paidByCard;

    if (remainingAmount === 0) {
      // 이미 전액 결제된 경우
      setShowReceiptModal(true);
      return;
    }

    if (charge <= 0 && remainingAmount > 0) {
      alert("결제할 금액을 입력해주세요.");
      return;
    }

    if (charge < remainingAmount) {
      alert(
        `결제 금액이 부족합니다. 남은 총액: ${remainingAmount.toLocaleString()}, 입력한 금액: ${charge.toLocaleString()}`
      );
      return;
    }

    try {
      if (orderId && placeId) {
        const numericPlaceId =
          typeof placeId === "string" ? parseInt(placeId) : placeId;
        await fetchUnpaidOrderByPlace(numericPlaceId);
        const currentOrderId = usePosStore.getState().orderId;
        if (!currentOrderId) {
          alert("이미 결제 완료된 주문입니다.");
          resetData();
          router.push("/pos");
          return;
        }
      }

      // 현금 결제 처리
      if (charge > 0) {
        const success = await processCashPayment(charge);
        if (!success) return;
      }

      // 모든 결제가 완료되면 영수증 모달 표시
      setShowReceiptModal(true);
    } catch (error: any) {
      console.error("결제 오류:", error.response?.data || error);
      alert("결제 중 오류가 발생했습니다.");
    }
  };

  const handleReceiptYes = async () => {
    if (orderId) {
      try {
        const receiptResponse = await axiosInstance.get(`/api/receipts/${orderId}`);
        console.log("영수증 데이터:", receiptResponse.data);
  
        // 결제 관련 상태만 초기화
        resetData();
  
        // storeId가 유지되므로 바로 /pos로 이동
        router.push("/pos");
      } catch (error: any) {
        console.error("영수증 가져오기 실패:", error.response?.data || error);
        alert("영수증 정보를 불러오는데 실패했습니다.");
        resetData();
        router.push("/pos");
      }
    } else {
      alert("주문 ID를 찾을 수 없습니다.");
      resetData();
      router.push("/pos");
    }
  };

  const handleCancel = async () => {
    console.log("Cancel 버튼 클릭됨. 현재 상태:", {
      charge,
      splitAmount,
      totalAmount,
      orderId,
      isNewOrderParam,
      paymentIds,
    });

    let orderCancelSuccess = false;
    let refundSuccess = true; // 기본값은 true, 실패 시 false로 변경

    // 1. 결제 취소 (모든 결제 ID에 대해 수행)
    if (paymentIds.length > 0) {
      try {
        for (const paymentId of paymentIds) {
          console.log(`Requesting refund for paymentId: ${paymentId}`);
          const response = await axiosInstance.post(
            `/api/pay/cancel/${paymentId}`
          );
          console.log(`환불 성공 (paymentId: ${paymentId}):`, response.data);
        }

        setCharge(0);
        setSplitAmount(0);
        setPaidByCash(0);
        setPaidByCard(0);
        setPaymentIds([]);
      } catch (error: any) {
        console.error("환불 실패:", error.response?.data || error);
        alert("환불 처리 중 오류가 발생했습니다.");
        refundSuccess = false;
        return;
      }
    }

    // 2. 신규 주문 취소
    if (isNewOrderParam === "1" && orderId) {
      try {
        const response = await axiosInstance.delete(
          `/api/orders/all/${orderId}`
        );
        console.log("새 주문 취소 완료:", orderId);
        orderCancelSuccess = true;
      } catch (err: any) {
        console.error("주문 삭제 실패:", err.response?.data || err);
        alert("주문 취소 중 오류가 발생했습니다.");
        return;
      }
    } else {
      orderCancelSuccess = true; // 신규 주문이 아니면 성공으로 간주
    }

    if (orderCancelSuccess && refundSuccess) {
      console.log("취소 완료: 주문과 결제 모두 성공적으로 취소됨");
      resetData();
      router.push("/pos");
    } else {
      console.log("취소 실패: 주문 또는 결제 취소 중 하나 이상 실패");
    }
  };

  // changes 계산 로직 수정 - 실제 결제 금액과의 차이로 계산
  const changes = useMemo(() => {
    // 실제 남은 금액 (charge, splitAmount 고려 전)
    const actualRemainingAmount = Math.max(0, initialTotal - paidByCash - paidByCard);
    
    // Split 금액 차감
    const remainingAfterSplit = isSplitVisible && splitAmount > 0
      ? Math.max(0, actualRemainingAmount - splitAmount)
      : actualRemainingAmount;
    
    // charge가 남은 금액보다 크면 잔돈 발생
    return Math.max(0, charge - remainingAfterSplit);
  }, [charge, initialTotal, paidByCash, paidByCard, splitAmount, isSplitVisible]);

  return (
    <Suspense fallback={<div></div>}>
    <div className="flex w-full h-screen font-mono">
      <button
        onClick={handleCancel}
        className="absolute top-4 left-4 p-2 text-red-500 text-sm"
      >
        Cancel
      </button>
      <div className="flex-1 flex items-center justify-center text-6xl font-bold text-gray-800">
        ₩{" "}
        <AnimatePresence mode="popLayout">
          {totalAmount
            .toLocaleString()
            .split("")
            .map((char, index) => {
              const isNumber = !isNaN(parseInt(char, 10));
              return (
                <motion.span
                  key={`${index}-${char}`}
                  initial={{
                    y: totalAmount > prevTotalAmount ? -20 : 20,
                    opacity: 0,
                  }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{
                    y: totalAmount > prevTotalAmount ? 20 : -20,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  style={{
                    display: "inline-block",
                    width: isNumber ? "1ch" : "auto",
                  }}
                >
                  {char}
                </motion.span>
              );
            })}
        </AnimatePresence>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-around items-center relative">
        {/* Cash 섹션 */}
        <div className="w-3/4 flex flex-col items-center">
          <h3 className="text-gray-600 text-center font-bold mb-10">Cash</h3>
          <div className="flex space-x-2 mb-4 w-full">
            <div className="relative flex w-1/2">
              <input
                type="number"
                value={charge}
                onChange={handleChargeChange}
                placeholder="₩ 0"
                className="py-2 px-4 border border-gray-300 rounded-md w-full bg-white"
                readOnly={!isOtherClicked}
              />
              <button
                onClick={handleChargeReset}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
              >
                Reset
              </button>
            </div>
            <span className="py-2 px-4 text-xs border border-gray-300 rounded-md w-1/2 bg-white flex items-center justify-start">
              changes ₩ {changes.toLocaleString()}
            </span>
          </div>
          <div className="w-full flex flex-col items-center">
            <div className="flex justify-center gap-2 mb-2 w-full">
              {[1000, 5000, 10000].map((value) => (
                <button
                  key={value}
                  onClick={() => handleCashButtonClick(value)}
                  className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 text-center w-1/3"
                >
                  ₩ {value.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-2 w-full">
              <button
                onClick={() => handleCashButtonClick(50000)}
                className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 text-center w-1/3"
              >
                ₩ {(50000).toLocaleString()}
              </button>
              <button
                onClick={handleOtherClick}
                className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 text-blue-500 text-center w-1/3"
              >
                others
              </button>
            </div>
          </div>
        </div>

        {/* Other payment methods & Done 버튼 */}
        <div className="w-3/4 mt-4 flex flex-col items-center">
          <h3 className="text-gray-600 font-bold text-center mb-10">
            Other payment methods
          </h3>
          <div className="flex space-x-2 mb-4 w-full justify-center">
            <button
              onClick={handleCreditCardClick}
              className="py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 flex-1"
            >
              Credit card
            </button>
            <button
              onClick={handleSplitToggle}
              className={`py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300 border border-gray-300 flex-1 ${
                isSplitVisible ? "bg-blue-100" : ""
              }`}
            >
              Split {isSplitVisible ? "(On)" : ""}
            </button>
          </div>
          <div className="flex space-x-2 items-center w-full justify-center">
            {isSplitVisible && (
              <div className="w-1/2">
                <input
                  type="number"
                  value={splitAmount === 0 ? "" : splitAmount}
                  onChange={handleSplitChange}
                  placeholder="금액 입력"
                  className="py-2 px-4 border border-gray-300 rounded-md w-full"
                />
              </div>
            )}
            <motion.button
              onClick={handleDoneClick}
              layout
              animate={{ x: 0, width: isSplitVisible ? "49%" : "100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`py-2 rounded-md border border-gray-300 ${
                charge + paidByCard + paidByCash >= initialTotal
                  ? "bg-[#007aff] text-white font-bold"
                  : "bg-gray-200 text-gray-700 cursor-not-allowed"
              } flex items-center justify-center`}
              disabled={charge + paidByCard + paidByCash < initialTotal}
            >
              <span className="text-base font-medium">Done</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* 최소 결제 금액 경고 모달 */}
      <AnimatePresence>
        {showMinAmountModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-white p-6 rounded-md max-w-sm w-full shadow-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                최소 결제 금액 안내
              </h3>
              <p className="text-gray-700 mb-4">
                1000원 이상부터 결제가 가능합니다.
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowMinAmountModal(false)}
                  className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 영수증 출력 여부 확인 모달 */}
      <Modal isOpen={showReceiptModal} onClose={handleReceiptYes}>
        <div className="bg-white p-6 rounded-md">
          <p>영수증을 출력하시겠습니까?</p>
          <div className="mt-4 flex justify-end space-x-9">
            <button
              onClick={handleReceiptYes}
              className="py-1 px-8 bg-blue-500 hover:bg-blue-400 text-white rounded-md"
            >
              예
            </button>
            <button
              onClick={handleReceiptYes}
              className="py-1 px-4 bg-gray-200 hover:bg-gray-100 rounded-md"
            >
              아니오
            </button>
          </div>
        </div>
      </Modal>
    </div>
    </Suspense>
  );
}
