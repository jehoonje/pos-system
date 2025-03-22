export interface OrderSummary {
  totalPrice: number;
  date: string;
  status: string;
}

export interface Order {
  orderId: number;
  storeId: number;
  price: number;
  orderStatus: string;
  orderedAt: string;
  placeName: string;
  paymentType: "CARD" | "CASH" | "MIX"; // "MIX" 추가
  paymentId?: number;
  cardPrice?: number; // MIX일 경우 사용
  cashPrice?: number; // MIX일 경우 사용
  menuDetail: {
    menuName: string;
    discountRate: number;
    totalPrice: number;
    totalCount: number;
  }[];
}