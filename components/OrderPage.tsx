"use client";

import { useEffect, useState, useCallback } from "react";
import { QueryClient, useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useFormStore } from "@/store/formStore";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import ReceiptModal from "@/components/ReceiptModal";
import { Archive } from "lucide-react";
import { format } from "date-fns";
import OrderList from "@/components/OrderList";
import OrderDetails from "@/components/OrderDetails";
import MonthlyCalendar from "@/components/MonthlyCalendar";
import CalculatorModal from "./CalculatorModal";
import { Order, OrderSummary } from "../types/order";
import { Receipt } from "../types/receipt";
import Cookies from "js-cookie";
import _ from "lodash";
import { useThemeStore } from "@/store/themeStore";

const queryClient = new QueryClient();

export default function OrderPage() {
  const router = useRouter();
  const { storeId, selectedOrderId, selectedDate, setSelectedOrder, setCalculatorModalOpen } =
    useFormStore();
  const { isDarkMode } = useThemeStore();

  const [placeName, setPlaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [asciiReceipt, setAsciiReceipt] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchResults, setSearchResults] = useState<OrderSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  // 다크모드 배경색 적용
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isDarkMode) {
        document.body.style.backgroundColor = "#111827";
      } else {
        document.body.style.backgroundColor = "";
      }
    }
  }, [isDarkMode]);

  // `window` 참조를 useEffect 내부로 이동
  useEffect(() => {
    const token = typeof window !== "undefined" ? Cookies.get("authToken") : null;
    if (token) {
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    console.log(window.location.href);
  }, []);

  const { data: orderSummaries, isLoading: summariesLoading } = useQuery({
    queryKey: ["orderSummaries", storeId, isCancelled],
    queryFn: async () => {
      if (!storeId) return [];
      const status = isCancelled ? "cancelled" : "success";
      const response = await axiosInstance.get(`/api/reports/all/${storeId}?status=${status}`);
      console.log("Fetched Order Summaries:", response.data); // 디버깅용 로그
      return response.data || [];
    },
    enabled: !!storeId,
    staleTime: 0, // 캐시 유지 시간 0으로 설정해 항상 최신 데이터 요청
    gcTime: 0, // 캐시 즉시 만료
    refetchOnMount: "always", // 마운트 시 항상 다시 가져옴
  });

  const sortedSummaries = (isSearching ? searchResults : orderSummaries || []).sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const dateToFetch = sortedSummaries[currentDateIndex]?.date;

  const {
    data: ordersForDate,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: ordersLoading,
  } = useInfiniteQuery({
    queryKey: ["ordersForDate", storeId, dateToFetch, isSearching, isCancelled],
    queryFn: async ({ pageParam = 1 }) => {
      if (!storeId || !dateToFetch) return { orders: [], hasMore: false };
      const status = isCancelled ? "cancelled" : "success";
      const response = await axiosInstance.get(`/api/reports/daily`, {
        params: { storeId, date: dateToFetch, page: pageParam, size: 10, status },
      });
      const orders = response.data || [];
      orders.forEach((order: Order) => {
        console.log(`Order ID: ${order.orderId}, Status: ${order.orderStatus}`);
      });
      return { date: dateToFetch, orders, hasMore: orders.length === 10 };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!storeId && !!dateToFetch,
  });

  const [allOrdersMap, setAllOrdersMap] = useState<{ [date: string]: Order[] }>({});

  const resetOrdersMap = () => {
    setAllOrdersMap({});
    setIsDataReady(false);
  };

  const preloadAllOrders = async () => {
    if (!storeId || !sortedSummaries.length) {
      setIsDataReady(true);
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    try {
      const tempOrdersMap: { [date: string]: Order[] } = {};
      const preloadPromises = sortedSummaries.map(async (summary: OrderSummary) => {
        const date = summary.date;
        if (!tempOrdersMap[date] || tempOrdersMap[date].length === 0) {
          const status = isCancelled ? "cancelled" : "success";
          const response = await axiosInstance.get(`/api/reports/daily`, {
            params: { storeId, date, page: 1, size: 100, status },
          });
          const orders = response.data || [];
          console.log(`Loaded orders for ${date}:`, orders.length); // 디버깅 로그
          tempOrdersMap[date] = orders;
        }
      });
      await Promise.all(preloadPromises);
      setAllOrdersMap(tempOrdersMap);
      setIsDataReady(true);
    } catch (err) {
      console.error("Preload failed:", err);
      setError("데이터 로드에 실패했습니다.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (ordersForDate) {
      const newOrders = ordersForDate.pages.flatMap((page) => page.orders);
      setAllOrdersMap((prev) => {
        const existingOrders = prev[dateToFetch] || [];
        const uniqueOrders = [
          ...existingOrders,
          ...newOrders.filter(
            (newOrder) =>
              !existingOrders.some((existing) => existing.orderId === newOrder.orderId)
          ),
        ];
        return { ...prev, [dateToFetch]: uniqueOrders };
      });
      setIsDataReady(true);
    }
  }, [ordersForDate, dateToFetch]);

  useEffect(() => {
    if (sortedSummaries.length > 0 && !isDataReady) {
      preloadAllOrders();
    }
  }, [sortedSummaries, storeId, isCancelled]);

  useEffect(() => {
    if (selectedOrderId && selectedDate && allOrdersMap[selectedDate]) {
      const order = allOrdersMap[selectedDate].find((o) => o.orderId === selectedOrderId);
      if (order) {
        setPlaceName(order.placeName || "Unknown");
        setLoadingReceipt(true);
        const fetchReceipt = async () => {
          try {
            const response = await axiosInstance.get(`/api/receipts/${order.orderId}`);
            setReceipt(response.data);
          } catch (err) {
            setReceipt(null);
          } finally {
            setLoadingReceipt(false);
          }
        };
        fetchReceipt();
      } else {
        setPlaceName("");
        setReceipt(null);
        setLoadingReceipt(false);
      }
    } else {
      setPlaceName("");
      setReceipt(null);
      setLoadingReceipt(false);
    }
  }, [selectedOrderId, selectedDate, allOrdersMap]);

  const formatDateLabel = (dateString: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(dateString);
    orderDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    return dateString;
  };

  const formatTime = (orderedAt: string): string => {
    const date = new Date(orderedAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "오후" : "오전";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${period} ${formattedHours}:${formattedMinutes}`;
  };

  const refundMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await axiosInstance.post(`/api/pay/cancel/${paymentId}`);
    },
    onSuccess: () => {
      // success와 cancelled 상태의 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["orderSummaries", storeId, false] });
      queryClient.invalidateQueries({ queryKey: ["orderSummaries", storeId, true] });
      // 즉시 success 데이터 다시 가져오기
      queryClient.refetchQueries({ queryKey: ["orderSummaries", storeId, false] });
      if (selectedDate) {
        queryClient.refetchQueries({ queryKey: ["ordersForDate", storeId, selectedDate] });
      }
      setIsRefundModalOpen(false);
      alert("환불이 성공적으로 처리되었습니다.");
    },
    onError: () => {
      alert("환불 처리 중 오류가 발생했습니다.");
    },
  });

  const handleRefund = () => {
    if (!selectedDate) return;
    const selectedOrder = allOrdersMap[selectedDate]?.find(
      (o: Order) => o.orderId === selectedOrderId
    );
    if (!selectedOrder?.paymentId) {
      alert("결제 ID가 없습니다.");
      return;
    }
    refundMutation.mutate(selectedOrder.paymentId.toString());
  };

  const handlePrint = async () => {
    if (!selectedDate) return;
    const selectedOrder = allOrdersMap[selectedDate]?.find(
      (o: Order) => o.orderId === selectedOrderId
    );
    if (!selectedOrder?.orderId) {
      alert("주문 ID가 없습니다.");
      return;
    }
    try {
      const response = await axiosInstance.get(`/api/receipts/${selectedOrder.orderId}`);
      const receiptData: Receipt = response.data;
      const asciiText = convertToAsciiReceipt(receiptData);
      setAsciiReceipt(asciiText);
      setIsPrintModalOpen(true);
    } catch (err) {
      alert("영수증 정보를 불러오지 못했습니다.");
    }
  };

  const convertToAsciiReceipt = (receipt: Receipt): string => {
    const line = "=====================================";
    const subLine = "-------------------------------------";
    let result = `${line}\n`;
    result += `${receipt.storeName}\n`;
    result += `사업자 번호: ${receipt.businessNum}\n`;
    result += `점주: ${receipt.owner}\n`;
    result += `전화번호: ${receipt.phoneNumber}\n`;
    result += `주소: ${receipt.storePlace}\n`;
    result += `${subLine}\n`;
    result += `주문 ID: ${receipt.orderId}\n`;
    result += `영수증 번호: ${receipt.receiptDate}\n`;
    result += `테이블: ${receipt.placeName}\n`;
    result += `접수 번호: ${receipt.joinNumber}\n`;
    result += `결제일시: ${receipt.createdAt}\n`;
    result += `${subLine}\n`;
    result += `메뉴:\n`;
    receipt.menuList.forEach((menu) => {
      // discountRate가 null일 경우 "0"으로 처리
      const discountRate = menu.discountRate ?? 0;
      result += `${menu.menuName} x${menu.totalCount}  ₩${menu.totalPrice.toLocaleString()} (${discountRate}% 할인)\n`;
    });
    result += `${subLine}\n`;
    result += `결제 정보:\n`;
    receipt.cardInfoList.forEach((card) => {
      if (card.paymentType === "CARD" && card.cardCompany && card.cardNumber) {
        // 정상적인 카드 결제일 경우
        result += `${card.cardCompany}카드: ${card.cardNumber}\n`;
        result += `결제 방식: ${card.inputMethod}\n`;
        result += `승인일시: ${card.approveDate}\n`;
        result += `승인번호: ${card.approveNumber}\n`;
        result += `할부: ${card.installmentPeriod}\n`;
        result += `결제 금액: ₩${card.paidMoney.toLocaleString()}\n`;
      } else {
        result += `${subLine}\n`;
        // paymentType이 "CASH"이거나, cardCompany와 cardNumber가 null인 경우 현금 결제로 처리
        result += `현금 결제\n`;
        result += `결제 금액: ₩${card.paidMoney.toLocaleString()}\n`;
      }
    });
    result += `${subLine}\n`;
    result += `총 금액: ₩${receipt.totalAmount.toLocaleString()}\n`;
    result += `${line}`;
    return result;
  };

  const handleSearch = async () => {
    if (startDate && endDate && storeId) {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      const formattedEndDate = adjustedEndDate.toISOString().split("T")[0];

      try {
        const status = isCancelled ? "cancelled" : "success";
        const response = await axiosInstance.get(`/api/reports`, {
          params: { storeId, startDate: formattedStartDate, endDate: formattedEndDate, status },
        });
        const summaries = Array.isArray(response.data) ? response.data : [];
        const sortedSummaries = summaries.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setSearchResults(sortedSummaries);
        setIsSearching(true);
        resetOrdersMap();
        await preloadAllOrders();
      } catch (err) {
        setError("주문 검색에 실패했습니다.");
      }
    } else {
      alert("시작일과 종료일을 모두 선택해주세요.");
    }
  };

  const handleCancelledOrders = () => {
    resetOrdersMap();
    setIsCancelled(true);
    setIsMonthly(false);
    setIsSearching(false);
    setCurrentDateIndex(0);
    setStartDate(null);
    setEndDate(null);
    // 이전 캐시 제거
    queryClient.removeQueries({ queryKey: ["orderSummaries", storeId] });
    queryClient.removeQueries({ queryKey: ["ordersForDate", storeId] });
    queryClient.refetchQueries({ queryKey: ["orderSummaries", storeId, true] });
    queryClient.refetchQueries({ queryKey: ["ordersForDate", storeId] });
    preloadAllOrders();
  };

  const handleDailySales = useCallback(
    _.debounce(async () => {
      if (isLoadingData) return;
      if (!isCancelled && !isMonthly && !isSearching) {
        if (isDataReady) {
          await queryClient.refetchQueries({ queryKey: ["orderSummaries", storeId, false] });
          await queryClient.refetchQueries({ queryKey: ["ordersForDate", storeId] });
          await preloadAllOrders();
          return;
        }
      }

      resetOrdersMap();
      setIsCancelled(false);
      setIsMonthly(false);
      setIsSearching(false);
      setCurrentDateIndex(0);
      setStartDate(null);
      setEndDate(null);
      setIsLoadingData(true);
      // 이전 캐시 제거
      queryClient.removeQueries({ queryKey: ["orderSummaries", storeId] });
      queryClient.removeQueries({ queryKey: ["ordersForDate", storeId] });
      await queryClient.refetchQueries({ queryKey: ["orderSummaries", storeId, false] });
      await queryClient.refetchQueries({ queryKey: ["ordersForDate", storeId] });
      await preloadAllOrders();
      setIsLoadingData(false);
    }, 100),
    [isLoadingData, isDataReady, isCancelled, isMonthly, isSearching, storeId]
  );

  const handleMonthlySales = () => {
    resetOrdersMap();
    setIsCancelled(false);
    setIsMonthly(true);
    setIsSearching(false);
    setCurrentDateIndex(0);
    setStartDate(null);
    setEndDate(null);
    setCurrentMonth(new Date());
    queryClient.removeQueries({ queryKey: ["orderSummaries", storeId] });
    queryClient.removeQueries({ queryKey: ["ordersForDate", storeId] });
    queryClient.refetchQueries({ queryKey: ["orderSummaries", storeId, false] });
    preloadAllOrders();
  };

  return (
    <div className={`flex items-center font-mono justify-center h-screen w-screen relative ${isDarkMode ? 'bg-gray-900' : ''}`}>
      <div className={`relative w-4/5 h-4/5 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white bg-opacity-20 border-gray-400'} rounded-2xl flex overflow-hidden`}>
        {isMonthly && storeId ? (
          <MonthlyCalendar
            orderSummaries={orderSummaries || []}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            storeId={storeId}
            isDarkMode={isDarkMode}
          />
        ) : (
          <>
            <div className="flex flex-row w-full">
              <OrderList
                storeId={storeId}
                isCancelled={isCancelled}
                selectedOrderId={selectedOrderId}
                setSelectedOrder={setSelectedOrder}
                sortedSummaries={sortedSummaries}
                allOrdersMap={allOrdersMap}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                formatDateLabel={formatDateLabel}
                formatTime={formatTime}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                handleSearch={handleSearch}
                isLoadingData={isLoadingData}
                isDataReady={isDataReady}
                isDarkMode={isDarkMode}
              />
              <OrderDetails
                placeName={placeName}
                loadingReceipt={loadingReceipt}
                receipt={receipt}
                order={order}
                handlePrint={handlePrint}
                setIsRefundModalOpen={setIsRefundModalOpen}
                isDarkMode={isDarkMode}
              />
            </div>
            
            <Modal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} isDarkMode={isDarkMode}>
              <div className="text-center">
                <p className={`mb-4 ${isDarkMode ? 'text-white' : ''}`}>결제를 취소하시겠습니까?</p>
                <div className="flex justify-center gap-4">
                  <button
                    className="bg-red-500 text-white px-8 py-1 rounded hover:bg-red-600"
                    onClick={handleRefund}
                  >
                    예
                  </button>
                  <button
                    className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400'} px-4 py-1 rounded`}
                    onClick={() => setIsRefundModalOpen(false)}
                  >
                    아니오
                  </button>
                </div>
              </div>
            </Modal>
            <ReceiptModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)}>
              <div className="font-mono whitespace-pre text-sm">{asciiReceipt}</div>
            </ReceiptModal>
          </>
        )}
        <div className={`flex flex-col p-4 items-center justify-between ${isDarkMode ? 'border-l border-gray-700' : ''}`}>
          <div className="flex flex-row w-full gap-1 px-2">
            <Archive className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            <span className={`font-sans text-2xl text-left font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Order
            </span>
          </div>
          <div className="flex flex-col items-center justify-center mb-20">
            <p className={`flex ${isDarkMode ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-300'} border-b mb-4 w-full p-1 pl-2 text-center`}>
              Details
            </p>
            <div className="flex flex-col">
              <div className="flex flex-row justify-center items-center gap-2 mb-4">
                <button
                  className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded w-[9rem] py-6`}
                  onClick={handleDailySales}
                >
                  당일 매출 내역
                </button>
                <button
                  className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded w-[9rem] py-6`}
                  onClick={handleMonthlySales}
                >
                  월간 매출 내역
                </button>
              </div>
              <div className="flex flex-row justify-start items-center gap-4">
                <button
                  className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded w-[9rem] py-6`}
                  onClick={handleCancelledOrders}
                >
                  반품 결제 내역
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center items-center gap-2 my-2">
            <button
              className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded py-6 w-[9rem]`}
              onClick={() => setCalculatorModalOpen(true)}
            >
              계산기
            </button>
            <button
              className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded py-6 w-[9rem]`}
              onClick={() => router.push("/setting")}
            >
              Back
            </button>
          </div>
        </div>
      </div>
      <CalculatorModal isDarkMode={isDarkMode} />
    </div>
  );
}
