"use client";
import { useRef, useEffect } from "react";
import { Order, OrderSummary } from "../types/order";
import { CreditCard, Banknote } from "lucide-react";
import SearchBar from "./SearchBar";

interface OrderListProps {
  storeId: number | null;
  isCancelled: boolean;
  selectedOrderId: number | null;
  setSelectedOrder: (orderId: number, date: string) => void;
  sortedSummaries: OrderSummary[];
  allOrdersMap: { [date: string]: Order[] };
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  formatDateLabel: (date: string) => string;
  formatTime: (orderedAt: string) => string;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  handleSearch: () => void;
  isLoadingData: boolean;
  isDataReady: boolean;
  isDarkMode?: boolean;
}

const OrderList: React.FC<OrderListProps> = ({
  storeId,
  isCancelled,
  selectedOrderId,
  setSelectedOrder,
  sortedSummaries,
  allOrdersMap,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  formatDateLabel,
  formatTime,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  handleSearch,
  isLoadingData,
  isDataReady,
  isDarkMode = false
}) => {
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          if (hasNextPage) {
            fetchNextPage();
          }
        }
      },
      { threshold: 1.0 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className={`w-1/2 ${isDarkMode ? 'border-r border-gray-700' : 'border-r border-gray-400'}`}>
      <div className={`h-[3rem] ${isDarkMode ? 'border-b border-gray-700 text-white' : 'border-b border-gray-400'} flex justify-center items-center`}>
        <span>{isCancelled ? "Return" : "Daily"}</span>
      </div>
      <SearchBar
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        handleSearch={handleSearch}
        isDarkMode={isDarkMode}
      />
      <div className="overflow-y-auto h-[calc(100%-7rem)]">
        {isLoadingData || !isDataReady ? (
          <p className={isDarkMode ? 'text-gray-300' : ''}>로딩 중...</p>
        ) : sortedSummaries.length === 0 || Object.keys(allOrdersMap).length === 0 ? (
          <p className={isDarkMode ? 'text-gray-300' : ''}>주문 내역이 없습니다.</p>
        ) : (
          sortedSummaries.map((summary: OrderSummary) => {
            const orders = allOrdersMap[summary.date] || [];
            return (
              <div key={summary.date}>
                <div className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200'} p-2 text-sm font-medium`}>
                  {formatDateLabel(summary.date)}
                </div>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div
                      key={`${order.orderId}-${summary.date}`}
                      className={`flex justify-between p-2 ${isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-300'} cursor-pointer ${
                        selectedOrderId === order.orderId 
                          ? isDarkMode ? 'bg-gray-600' : 'bg-gray-100' 
                          : ''
                      } ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'}`}
                      onClick={() => setSelectedOrder(order.orderId, summary.date)}
                    >
                      <div className="flex items-center">
                        {order.paymentType === "CARD" ? (
                          <CreditCard className={`w-12 h-8 mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                        ) : order.paymentType === "CASH" ? (
                          <Banknote className={`w-12 h-8 mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                        ) : (
                          // MIX 경우 아이콘 조합
                          <>
                            <CreditCard className={`w-6 h-4 mr-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                            <Banknote className={`w-6 h-4 mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                          </>
                        )}
                        <div className="flex flex-col gap-4 ml-2 text-xs">
                          <span>₩{(order.price ?? 0).toLocaleString()}</span>
                          <span>
                            {isCancelled
                              ? "취소"
                              : order.orderStatus === "SUCCESS"
                              ? "결제 완료"
                              : "취소"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm">
                        <span>{formatTime(order.orderedAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`p-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>주문 없음</p>
                )}
              </div>
            );
          })
        )}
        <div ref={observerRef} />
        {isFetchingNextPage && <p className={isDarkMode ? 'text-gray-300' : ''}>로딩 중...</p>}
      </div>
    </div>
  );
};

export default OrderList;
