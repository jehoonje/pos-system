"use client";
import React from "react";
import { Receipt } from "../types/receipt";
import { Order } from "../types/order";

interface OrderDetailsProps {
  placeName: string;
  loadingReceipt: boolean;
  receipt?: Receipt | null; // 옵셔널로 유지
  order?: Order | null; // 주 데이터로 사용
  handlePrint: () => void;
  setIsRefundModalOpen: (open: boolean) => void;
  isDarkMode?: boolean;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  placeName,
  loadingReceipt,
  receipt,
  order,
  handlePrint,
  setIsRefundModalOpen,
  isDarkMode = false
}) => (
  <div className={`w-3/4 flex flex-col ${isDarkMode ? 'border-r border-gray-700' : 'border-r border-gray-400'}`}>
    <div className={`flex items-center justify-center uppercase text-lg font-medium ${isDarkMode ? 'border-b border-gray-700 text-white' : 'border-b border-gray-400'} h-[3rem] mb-4`}>
      {placeName || ""}
    </div>
    <div className={`flex-1 ${isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-300'}`}>
      {loadingReceipt ? (
        <p></p>
      ) : order ? (
        <div className={`text-sm h-full flex flex-col justify-between ${isDarkMode ? 'text-white' : ''}`}>
          <div className="flex flex-col text-md w-full">
            {order.menuDetail.map((menu, index) => (
              <div
                key={index}
                className="flex flex-row justify-center items-center text-center py-1"
              >
                <span className="min-w-0 flex-1 truncate">{menu.menuName}</span>
                <span className="min-w-0 flex-1">{menu.totalCount}</span>
                <span className="min-w-0 flex-1">₩ {menu.totalPrice.toLocaleString()}</span>
                {menu.discountRate > 0 ? (
                  <span className="min-w-0 flex-1">({menu.discountRate}% 할인)</span>
                ) : (
                  <span className=""></span>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <div className={`${isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-300'} py-2 flex flex-row justify-between px-4`}>
              <p>주문번호 :</p>
              <span>{order.orderId}</span>
            </div>
            <div className={`${isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-300'} py-2 flex flex-col px-4`}>
              {order.paymentType === "CASH" ? (
                <div className="flex flex-row justify-between">
                  <p>현금 결제 :</p>
                  <span>₩{order.price.toLocaleString()}</span>
                </div>
              ) : order.paymentType === "CARD" ? (
                <div className="flex flex-row justify-between">
                  <p>카드 결제 :</p>
                  <span>₩{order.price.toLocaleString()}</span>
                </div>
              ) : order.paymentType === "MIX" ? (
                <div className="flex flex-col">
                  <p>혼합 결제 :</p>
                  <div className="flex flex-col ml-2">
                    {order.cardPrice !== undefined && order.cardPrice > 0 && (
                      <div className="flex flex-row justify-between">
                        <p>카드 결제 :</p>
                        <span>₩{order.cardPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {order.cashPrice !== undefined && order.cashPrice > 0 && (
                      <div className="flex flex-row justify-between">
                        <p>현금 결제 :</p>
                        <span>₩{order.cashPrice.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p>결제 정보 없음</p>
              )}
            </div>
            <div className={`${isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-300'} py-2 flex flex-row justify-between px-4`}>
              <p>Total :</p>
              <p> ₩{order.price.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : receipt ? (
        <div className={`text-sm h-full flex flex-col justify-between ${isDarkMode ? 'text-white' : ''}`}>
          <div className="flex flex-col text-md w-full">
            {receipt.menuList.map((menu, index) => (
              <div
                key={index}
                className="flex flex-row justify-center items-center text-center py-1"
              >
                <span className="min-w-0 flex-1 truncate">{menu.menuName}</span>
                <span className="min-w-0 flex-1">{menu.totalCount}</span>
                <span className="min-w-0 flex-1">₩ {menu.totalPrice.toLocaleString()}</span>
                {menu.discountRate && menu.discountRate > 0 ? (
                  <span className="min-w-0 flex-1">({menu.discountRate}% 할인)</span>
                ) : (
                  <span className=""></span>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <div className={`${isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-300'} py-2 flex flex-row justify-between px-4`}>
              <p>영수증번호 :</p>
              <span>{receipt.receiptDate}</span>
            </div>
            <div className={`${isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-300'} py-2 flex flex-col px-4`}>
              {receipt.cardInfoList.map((cardInfo, index) => (
                <div key={index} className="flex flex-col">
                  {cardInfo.paymentType === "CASH" ? (
                    <div className="flex flex-row justify-between">
                      <p>현금 결제 :</p>
                      <span>₩{cardInfo.paidMoney.toLocaleString()}</span>
                    </div>
                  ) : cardInfo.paymentType === "CARD" ? (
                    <div className="flex flex-col">
                      <div className="flex flex-row justify-between">
                        <p>{cardInfo.cardCompany ? `${cardInfo.cardCompany} 카드 :` : "현금"}</p>
                        <p className="flex flex-col justify-center truncate">
                          {cardInfo.cardNumber || ""}
                        </p>
                      </div>
                      <div className="flex flex-row justify-between">
                        <p>결제 금액 :</p>
                        <span>₩{cardInfo.paidMoney.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className={`${isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-300'} py-2 flex flex-row justify-between px-4`}>
              <p>Total :</p>
              <p> ₩{receipt.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>주문을 선택하세요.</p>
      )}
    </div>
    <div className={`flex ${isDarkMode ? 'text-white' : 'text-gray-700'} justify-center gap-2 m-4 mb-6`}>
      <button
        className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded w-1/2 py-6`}
        onClick={handlePrint}
      >
        Print
      </button>
      <button
        className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded w-1/2 py-6`}
        onClick={() => setIsRefundModalOpen(true)}
      >
        Refund
      </button>
    </div>
  </div>
);

export default OrderDetails;
