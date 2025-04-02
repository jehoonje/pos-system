"use client";
import { create } from "zustand";
import axiosInstance from "@/lib/axiosInstance";

// 메뉴 스타일 타입 정의
type MenuStyle = {
  uiId: number;
  positionX: number;
  positionY: number;
  colorCode: string;
  sizeType: "FULL" | "HALF";
};

// 메뉴 인터페이스 정의
export interface Menu {
  menuId: number;
  uiId: number;
  categoryId: number;
  menuName: string;
  discountRate: number;
  price: number;
  createdAt: string;
  menuStyle: MenuStyle;
}

// 카테고리 인터페이스 정의
export interface Category {
  categoryId: number;
  categoryName: string;
  categoryStyle?: {
    uiId: number;
    positionX: number | null;
    positionY: number | null;
    colorCode: string;
    sizeType: string | null;
  };
}

// 선택된 아이템 인터페이스 정의
export interface SelectedItem {
  menuName: string;
  price: number;
  quantity: number;
  menuId: number;
  orderMenuId?: number | null; // 추가: 주문 내 메뉴 항목 ID
}

// POS 상태 인터페이스 정의
interface PosState {
  storeId: number | null;
  tableName: string | null;

  placeId: number | null;
  orderId: number | null;
  orderMenuId: number | null;

  // 카테고리 목록 & 캐싱
  categories: Category[];
  menuCache: { [storeId: number]: { [categoryId: number]: Menu[] } }; // <카테고리ID, 메뉴목록> 캐싱
  currentMenus: Menu[]; // 화면에 표시되는 메뉴

  selectedItems: SelectedItem[];

  isLoading: boolean;
  

  setIsLoading: (loading: boolean) => void;

  setPlaceId: (id: number | null) => void;
  setOrderId: (id: number | null) => void;
  setorderMenuId: (id: number | null) => void;

  setStoreId: (id: number | null) => void;
  setTableName: (name: string | null) => void;

  setSelectedItems: (items: SelectedItem[]) => void;
  fetchCategories: (storeId: number) => Promise<void>;
  fetchUnpaidOrderByPlace: (placeId: number) => Promise<void>;
  fetchMenusByCategory: (categoryId: number, forceReload?: boolean) => Promise<void>;

  // 캐시 무효화 액션
  invalidateMenuCache: (categoryId: number) => void;

  addItem: (menuName: string, price: number, menuId: number) => void;

  removeItem: (menuName: string) => void;

  clearItems: () => void;

  resetData: () => void;
  
  // 서버 컴포넌트에서 받은 데이터를 직접 설정하는 액션
  setCategories: (categories: Category[]) => void;
  setCurrentMenus: (menus: Menu[]) => void;
}

// 새로운 스토어 인터페이스 정의 (기존 타입 재사용 가능)
interface NewStoreState {
  newStoreId: number | null;
  newTableName: string | null;
  newSelectedItems: SelectedItem[]; // 기존 SelectedItem 타입 재사용
  addNewItem: (item: SelectedItem) => void; // 새로운 아이템 추가
  clearNewItems: () => void; // 새로운 아이템 삭제
  setNewStoreId: (id: any) => void; // 새로운 매장 ID 설정
  setNewTableName: (name: any) => void; // 새로운 테이블 이름 설정
}

// POS 스토어 생성
export const usePosStore = create<PosState>((set, get) => ({
  storeId: null,
  tableName: null,
  orderMenuId: null,

  placeId: null,
  orderId: null,

  categories: [],
  menuCache: {},
  currentMenus: [],

  selectedItems: [],
  isLoading: false,

  setStoreId: (id) => {
    // 스토어 변경 시 관련 상태 초기화
    set({
      storeId: id,
      categories: [],
      currentMenus: [],
      selectedItems: [],
      tableName: null,
      placeId: null,
      orderId: null,
    });
  },
  setTableName: (name) => set({ tableName: name }), // 테이블 이름 설정

  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setPlaceId: (id) => set({ placeId: id }), // 장소 ID 설정
  setOrderId: (id) => set({ orderId: id }), // 주문 ID 설정
  setorderMenuId: (id) => set({ orderMenuId: id }), // 주문 메뉴 ID 설정 (수정: orderId -> orderMenuId)

  setSelectedItems: (items) => set({ selectedItems: items }), // 선택된 아이템 설정

  // 서버 컴포넌트에서 받은 데이터를 직접 설정하는 액션
  setCategories: (categories) => set({ categories }),
  setCurrentMenus: (menus) => set({ currentMenus: menus, isLoading: false }),

  fetchCategories: async (storeId: number) => {
    try {
      console.log(`Fetching categories from API for storeId: ${storeId}`);
      const response = await axiosInstance.get(`/api/categories/all/${storeId}`);
      console.log(`API response for /api/categories/all/${storeId}:`, response.data);
      set({ categories: response.data });
    } catch (error) {
      console.error(`fetchCategories error for storeId: ${storeId}:`, error);
      set({ categories: [] });
    }
  },

  fetchMenusByCategory: async (categoryId: number, forceReload: boolean = false) => {
    const { storeId, menuCache } = get();
    if (!storeId) return;

    set({ isLoading: true });
    const storeCache = menuCache[storeId] || {};
    if (!forceReload && storeCache[categoryId]) {
      console.log(`Using cached menus for storeId: ${storeId}, categoryId: ${categoryId}`);
      set({ currentMenus: storeCache[categoryId], isLoading: false });
      return;
    }
    try {
      console.log(`Fetching menus from API for storeId: ${storeId}, categoryId: ${categoryId}`);
      const { data } = await axiosInstance.get(`/api/menus/all/${categoryId}`, {
        params: { storeId }, // storeId를 쿼리 파라미터로 추가
      });
      console.log(`API response for /api/menus/all/${categoryId}?storeId=${storeId}:`, data);
      const transformed = data.map((menu: any) => ({
        ...menu,
        menuId: menu.menuId ?? menu.id ?? null,
      }));
      set((state) => ({
        menuCache: {
          ...state.menuCache,
          [storeId]: {
            ...(state.menuCache[storeId] || {}),
            [categoryId]: transformed,
          },
        },
        currentMenus: transformed,
        isLoading: false,
      }));
    } catch (err) {
      console.error(`fetchMenusByCategory error for categoryId: ${categoryId}, storeId: ${storeId}:`, err);
      set({
        currentMenus: [],
        isLoading: false,
      });
    }
  },

  fetchUnpaidOrderByPlace: async (placeId: number) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get(`/api/orders/places/${placeId}`);
      const { storeId, menuCache } = get();
      if (data && data.orderStatus === "UNPAID" && storeId) {
        const storeMenus = menuCache[storeId] || {};
        const allMenus = Object.values(storeMenus).flat(); // 현재 storeId의 메뉴만 평탄화
        const selectedItems = data.menuDetail.map((menu: any) => {
          const cachedMenu = allMenus.find((m) => m.menuName === menu.menuName);
          if (!cachedMenu) {
            console.warn(`[fetchUnpaidOrderByPlace] ${menu.menuName}의 menuId를 찾을 수 없습니다.`);
          }
          return {
            menuName: menu.menuName,
            price: menu.totalPrice / menu.totalCount,
            quantity: menu.totalCount,
            menuId: cachedMenu ? cachedMenu.menuId : -1, // 기본값으로 -1 사용
            orderMenuId: menu.id || null,
          };
        });
        set({
          orderId: data.orderId,
          selectedItems,
          placeId,
          tableName: data.placeName,
          storeId: data.storeId,
          isLoading: false,
        });
      } else {
        set({ orderId: null, selectedItems: [], placeId, isLoading: false });
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        set({ orderId: null, selectedItems: [], placeId, isLoading: false });
      } else {
        console.error("fetchUnpaidOrderByPlace 오류:", err);
        set({ orderId: null, selectedItems: [], placeId, isLoading: false });
      }
    }
  },

  invalidateMenuCache: (categoryId: number) => {
    // 캐시 무효화 액션 (특정 카테고리의 캐시 제거)
    set((state) => {
      const newCache = { ...state.menuCache };
      delete newCache[categoryId];
      return { menuCache: newCache };
    });
  },

  addItem: (menuName, price, menuId) => {
    // 메뉴 아이템 추가
    if (menuId === undefined || menuId === null) {
      console.error("[addItem] 메뉴 ID가 누락되었습니다:", menuName);
      return; // menuId 없으면 저장하지 않음
    }
    console.debug("[addItem] 메뉴 추가:", { menuName, price, menuId });
    const existingItem = get().selectedItems.find(
      (item) => item.menuId === menuId
    );
    if (existingItem) {
      set({
        selectedItems: get().selectedItems.map((item) =>
          item.menuId === menuId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({
        selectedItems: [
          ...get().selectedItems,
          { menuName, price, quantity: 1, menuId },
        ],
      });
    }
  },

  removeItem: (menuName: string) => {
    // 메뉴 아이템 제거
    const { selectedItems } = get();
    set({
      selectedItems: selectedItems.filter((item) => item.menuName !== menuName),
    });
  },

  clearItems: () => set({ selectedItems: [] }), // 선택된 아이템 전체 삭제

  resetData: () => {
    // 모든 데이터 초기화
    set({
      selectedItems: [],
      orderId: null,
      placeId: null,
      tableName: "",
    });
  },
}));

// 새로운 스토어 생성
export const useNewStore = create<NewStoreState>((set, get) => ({
  newStoreId: null,
  newTableName: null,
  newSelectedItems: [],

  setNewStoreId: (id: any) => set({ newStoreId: id }), // 새로운 매장 ID 설정
  setNewTableName: (name: any) => set({ newTableName: name }), // 새로운 테이블 이름 설정

  addNewItem: (item) => {
    // 새로운 아이템 추가 (SelectedItem 타입 사용)
    set((state) => ({
      newSelectedItems: [...state.newSelectedItems, item],
    }));
  },

  clearNewItems: () => set({ newSelectedItems: [] }), // 새로운 아이템 전체 삭제
}));
