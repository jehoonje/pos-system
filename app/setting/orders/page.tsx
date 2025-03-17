"use client";
import { useEffect, useState } from "react";
import { QueryClient, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useFormStore } from "@/store/formStore";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { Archive } from "lucide-react";
import { format } from "date-fns";
import OrderList from "@/components/OrderList";
import OrderDetails from "@/components/OrderDetails";
import MonthlyCalendar from "@/components/MonthlyCalendar";
import CalculatorModal from "../../../components/CalculatorModal";
import { Order,OrderSummary } from "../../../types/order";
import { Receipt } from "../../../types/receipt";

const queryClient = new QueryClient();

const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
if (token) {
  axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default function OrderPage() {
  const router = useRouter();
  const { storeId, selectedOrderId, selectedDate, setSelectedOrder, setCalculatorModalOpen } =
    useFormStore();

  const [placeName, setPlaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
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

  const { data: orderSummaries, isLoading: summariesLoading } = useQuery({
    queryKey: ["orderSummaries", storeId, isCancelled],
    queryFn: async () => {
      if (!storeId) return [];
      const status = isCancelled ? "cancelled" : "success";
      const response = await axiosInstance.get(`/api/reports/all/${storeId}?status=${status}`);
      console.log("Order Summaries:", response.data);
      return response.data || [];
    },
    enabled: !!storeId,
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
  };

  const preloadAllOrders = async () => {
    if (!storeId || !sortedSummaries.length) return;
    for (const summary of sortedSummaries) {
      const date = summary.date;
      if (!allOrdersMap[date] || allOrdersMap[date].length === 0) {
        try {
          const status = isCancelled ? "cancelled" : "success";
          const response = await axiosInstance.get(`/api/reports/daily`, {
            params: { storeId, date, page: 1, size: 100, status },
          });
          const orders = response.data || [];
          setAllOrdersMap((prev) => ({
            ...prev,
            [date]: orders,
          }));
        } catch (err) {
          console.error(`Failed to load orders for ${date}:`, err);
        }
      }
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
    }
  }, [ordersForDate, dateToFetch]);

  useEffect(() => {
    if (sortedSummaries.length > 0) {
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

  const handleRefund = async () => {
    if (!selectedDate) return;
    const selectedOrder = allOrdersMap[selectedDate]?.find(
      (o: Order) => o.orderId === selectedOrderId
    );
    if (!selectedOrder?.paymentId) {
      alert("결제 ID가 없습니다.");
      return;
    }
    try {
      await axiosInstance.post(`/api/pay/cancel/${selectedOrder.paymentId}`);
      alert("환불이 성공적으로 처리되었습니다.");
      setIsRefundModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["orderSummaries", storeId] });
    } catch (err) {
      alert("환불 처리 중 오류가 발생했습니다.");
    }
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
      result += `${menu.menuName} x${menu.totalCount}  ₩${menu.totalPrice.toLocaleString()} (${menu.discountRate}% 할인)\n`;
    });
    result += `${subLine}\n`;
    result += `결제 정보:\n`;
    receipt.cardInfoList.forEach((card) => {
      if (card.paymentType === "CARD") {
        result += `CARD: ${card.cardCompany} ${card.cardNumber}\n`;
        result += `결제 방식: ${card.inputMethod}\n`;
        result += `승인일시: ${card.approveDate}\n`;
        result += `승인번호: ${card.approveNumber}\n`;
        result += `할부: ${card.installmentPeriod}\n`;
        result += `결제 금액: ₩${card.paidMoney.toLocaleString()}\n`;
      } else {
        result += `CASH: ₩${card.paidMoney.toLocaleString()}\n`;
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
        preloadAllOrders();
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
    queryClient.invalidateQueries({ queryKey: ["orderSummaries", storeId, true] });
    queryClient.invalidateQueries({ queryKey: ["ordersForDate", storeId] });
    preloadAllOrders();
  };

  const handleDailySales = () => {
    resetOrdersMap();
    setIsCancelled(false);
    setIsMonthly(false);
    setIsSearching(false);
    setCurrentDateIndex(0);
    setStartDate(null);
    setEndDate(null);
    queryClient.invalidateQueries({ queryKey: ["orderSummaries", storeId, false] });
    queryClient.invalidateQueries({ queryKey: ["ordersForDate", storeId] });
    preloadAllOrders();
  };

  const handleMonthlySales = () => {
    resetOrdersMap();
    setIsCancelled(false);
    setIsMonthly(true);
    setIsSearching(false);
    setCurrentDateIndex(0);
    setStartDate(null);
    setEndDate(null);
    setCurrentMonth(new Date());
    queryClient.invalidateQueries({ queryKey: ["orderSummaries", storeId, false] });
    preloadAllOrders();
  };

  return (
    <div className="flex items-center font-mono justify-center h-screen w-screen relative">
      <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl flex overflow-hidden">
        {isMonthly && storeId ? (
          <MonthlyCalendar
            orderSummaries={orderSummaries || []}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            storeId={storeId}
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
              />
              <OrderDetails
                placeName={placeName}
                loadingReceipt={loadingReceipt}
                receipt={receipt}
                handlePrint={handlePrint}
                setIsRefundModalOpen={setIsRefundModalOpen}
              />
            </div>
            <Modal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)}>
              <div className="text-center">
                <p className="mb-4">결제를 취소하시겠습니까?</p>
                <div className="flex justify-center gap-4">
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    onClick={handleRefund}
                  >
                    예
                  </button>
                  <button
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    onClick={() => setIsRefundModalOpen(false)}
                  >
                    아니오
                  </button>
                </div>
              </div>
            </Modal>
            <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)}>
              <div className="font-mono whitespace-pre text-sm">{asciiReceipt}</div>
            </Modal>
          </>
        )}
        <div className="flex flex-col p-4 items-center justify-between">
          <div className="flex flex-row w-full gap-1 px-2">
            <Archive className="mt-1 text-gray-700" />
            <span className="font-sans text-2xl text-left font-semibold text-gray-800">
              Order
            </span>
          </div>
          <div className="flex flex-col items-center justify-center mb-20">
            <p className="flex text-gray-700 border-b border-gray-300 mb-4 w-full p-1 pl-2 text-center">
              Details
            </p>
            <div className="flex flex-col">
              <div className="flex flex-row justify-center items-center gap-2 mb-4">
                <button
                  className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300"
                  onClick={handleDailySales}
                >
                  당일 매출 내역
                </button>
                <button
                  className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300"
                  onClick={handleMonthlySales}
                >
                  월간 매출 내역
                </button>
              </div>
              <div className="flex flex-row justify-start items-center gap-4">
                <button
                  className="bg-gray-200 rounded w-[9rem] py-6 hover:bg-gray-300"
                  onClick={handleCancelledOrders}
                >
                  반품 결제 내역
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center items-center gap-2 my-2">
            <button
              className="bg-gray-200 rounded py-6 w-[9rem] hover:bg-gray-300"
              onClick={() => setCalculatorModalOpen(true)}
            >
              계산기
            </button>
            <button
              className="bg-gray-200 rounded py-6 w-[9rem] hover:bg-gray-300"
              onClick={() => router.push("/setting")}
            >
              Back
            </button>
          </div>
        </div>
      </div>
      <CalculatorModal />
    </div>
  );
}