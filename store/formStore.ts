import { create } from "zustand";

interface FormState {
  storeName: string;
  storePlace: string;
  password: string;
  phoneNumber: string;
  setStoreName: (name: string) => void;
  setStorePlace: (place: string) => void;
  setPassword: (password: string) => void;
  setPhoneNumber: (phone: string) => void;

  storeId: number | null;
  placeId: number | null;
  selectedOrderId: number | null;
  selectedDate: string | null;
  dailyOrders: { [date: string]: FullOrder[] };
  isCalculatorModalOpen: boolean;
  setStoreId: (id: number | null) => void;
  setPlaceId: (id: number | null) => void;
  setSelectedOrder: (orderId: number | null, date: string | null) => void;
  setDailyOrders: (date: string, orders: FullOrder[]) => void;
  setCalculatorModalOpen: (open: boolean) => void;
}

interface FullOrder {
  orderId: number;
  price: number;
  orderStatus: string;
  orderedAt: string;
  placeName: string;
  menuDetail: { menuName: string; discountRate: number; totalPrice: number; totalCount: number }[];
  paymentId?: number;
  paymentType?: "CARD" | "CASH";
}

export const useFormStore = create<FormState>((set) => ({
  storeName: "",
  storePlace: "",
  password: "",
  phoneNumber: "",
  setStoreName: (name) => set({ storeName: name }),
  setStorePlace: (place) => set({ storePlace: place }),
  setPassword: (password) => set({ password }),
  setPhoneNumber: (phone) => set({ phoneNumber: phone }),

  storeId: null,
  placeId: null,
  selectedOrderId: null,
  selectedDate: null,
  dailyOrders: {},
  isCalculatorModalOpen: false,
  setStoreId: (id) => set({ storeId: id }),
  setPlaceId: (id) => set({ placeId: id }),
  setSelectedOrder: (orderId, date) => set({ selectedOrderId: orderId, selectedDate: date }),
  setDailyOrders: (date, orders) => set((state) => ({
    dailyOrders: { ...state.dailyOrders, [date]: orders },
  })),
  setCalculatorModalOpen: (open) => set({ isCalculatorModalOpen: open }),
}));