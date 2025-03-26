"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/themeStore";
import axiosInstance from "../../lib/axiosInstance";
import Spinner from "../../components/Spinner";
import CategorySidebar from "../../components/CategorySidebar";
import AddItemModal from "../../components/AddItemModal";
import ModifyItemModal from "../../components/ModifyItemModal";
import GridCell from "../../components/EditGridCell";
import AlertModal from "../../components/AlertModal";
import { ChevronLeft } from "lucide-react";
import Cookies from "js-cookie";

// react-dnd 관련
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { usePosStore } from "@/store/usePosStore";

type Category = {
  categoryId: number;
  categoryName: string;
  uiId: number;
  categoryStyle: {
    uiId: number;
    colorCode: string;
    positionX?: number;
    positionY?: number;
    sizeType?: string;
  };
};

type MenuItem = {
  menuId: number;
  uiId: number; // 서버로는 안 보냄
  menuName: string;
  price: number;
  discountRate?: number;
  menuStyle: {
    uiId: number; // 서버로는 안 보냄
    colorCode: string;
    positionX?: number;
    positionY?: number;
    sizeType?: string; // "FULL" or "HALF"
  };
};

export default function EditMenuPage() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();

  // storeId, 토큰
  const [storeId, setStoreId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 카테고리 관련
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // 메뉴는 Zustand 스토어의 currentMenus를 사용
  const { currentMenus, fetchMenusByCategory, invalidateMenuCache } = usePosStore();

  // 카테고리 로딩 상태
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);

  // 모달 관련 state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [currentCell, setCurrentCell] = useState<{ x: number; y: number } | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);

  // HALF 체크
  const [hasHalfItem, setHasHalfItem] = useState(false);
  const [hasHalfInSameCell, setHasHalfInSameCell] = useState(false);

  // AlertModal 관련 state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    message: "",
    type: "info" as "error" | "success" | "warning" | "info"
  });

  useEffect(() => {
    const storedToken = Cookies.get("accessToken");
    if (!storedToken) {
      showAlert("세션이 만료되었습니다. 다시 로그인해주세요.", "error");
      router.push("/");
      return;
    }
    setToken(storedToken);

    const savedStoreId = Cookies.get("currentStoreId");
    if (!savedStoreId) {
      showAlert("Store ID가 없습니다. 다시 로그인해주세요.", "error");
      router.push("/");
      return;
    }
    setStoreId(Number(savedStoreId));
  }, [router]);

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

  useEffect(() => {
    if (storeId && token) {
      fetchCategories(storeId);
    }
  }, [storeId, token]);

  // AlertModal을 표시하는 함수
  const showAlert = (message: string, type: "error" | "success" | "warning" | "info" = "info") => {
    setAlertModal({
      isOpen: true,
      message,
      type
    });
  };

  // AlertModal을 닫는 함수
  const closeAlert = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

  const fetchCategories = async (storeId: number) => {
    try {
      setLoadingCategories(true);
      const { data } = await axiosInstance.get(`/api/categories/all/${storeId}`);
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0]);
      }
    } catch (err) {
      console.error("카테고리 조회 실패:", err);
      showAlert("카테고리 조회에 실패했습니다.", "error");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (selectedCategory && token) {
      // 초기 메뉴 로드 (캐시 여부와 상관없이 forceReload: false)
      fetchMenus(selectedCategory.categoryId, false);
    }
  }, [selectedCategory, token]);

  const fetchMenus = async (categoryId: number, forceReload: boolean = false) => {
    try {
      await fetchMenusByCategory(categoryId, forceReload);
    } catch (err) {
      console.error("메뉴 조회 실패:", err);
      showAlert("메뉴 조회에 실패했습니다.", "error");
    }
  };

  const handleCellClick = (x: number, y: number) => {
    const cellMenus = currentMenus.filter(
      (m) => m.menuStyle.positionX === x && m.menuStyle.positionY === y
    );
    const hasHalf = cellMenus.some((m) => m.menuStyle.sizeType === "HALF");
    setHasHalfItem(hasHalf);

    setCurrentCell({ x, y });
    setShowModifyModal(false);
    setShowAddModal(true);
  };

  const handleMenuClick = (menu: MenuItem) => {
    const { positionX, positionY } = menu.menuStyle;
    const cellMenus = currentMenus.filter(
      (m) =>
        m.menuStyle.positionX === positionX &&
        m.menuStyle.positionY === positionY
    );
    const halfCount = cellMenus.filter((m) => m.menuStyle.sizeType === "HALF").length;
    setHasHalfInSameCell(halfCount >= 2);

    setSelectedMenu(menu);
    setShowAddModal(false);
    setShowModifyModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setCurrentCell(null);
    if (selectedCategory && token) {
      // forceReload 옵션 true로 최신 메뉴 데이터 요청
      fetchMenus(selectedCategory.categoryId, true);
    }
  };

  const closeModifyModal = () => {
    setShowModifyModal(false);
    setSelectedMenu(null);
    if (selectedCategory && token) {
      fetchMenus(selectedCategory.categoryId, true);
    }
  };

  // 드래그앤드롭 시 호출되는 함수: 이동 후 최신 데이터 업데이트
  const moveMenuToCell = async (
    draggedMenu: MenuItem,
    targetX: number,
    targetY: number
  ) => {
    // 기존 셀의 메뉴는 currentMenus에서 확인
    const cellMenus = currentMenus.filter(
      (m) => m.menuStyle.positionX === targetX && m.menuStyle.positionY === targetY
    );
    if (cellMenus.some((m) => m.menuStyle.sizeType === "FULL")) {
      showAlert("이 셀에는 이미 FULL 메뉴가 있습니다.", "warning");
      return;
    }
    const halfCount = cellMenus.filter((m) => m.menuStyle.sizeType === "HALF").length;
    if (halfCount === 2) {
      showAlert("이 셀에는 이미 HALF 메뉴가 2개 있어 더 이상 놓을 수 없습니다.", "warning");
      return;
    }
    if (halfCount >= 1 && draggedMenu.menuStyle.sizeType === "FULL") {
      showAlert("이 셀에는 이미 HALF 메뉴가 있으므로 FULL 메뉴를 놓을 수 없습니다.", "warning");
      return;
    }
    try {
      if (!token) {
        showAlert("토큰이 없습니다. 다시 로그인해주세요.", "error");
        return;
      }
      const bodyData = {
        menuId: draggedMenu.menuId,
        menuName: draggedMenu.menuName,
        price: draggedMenu.price,
        discountRate: 0,
        colorCode: draggedMenu.menuStyle.colorCode,
        positionX: targetX,
        positionY: targetY,
        sizeType: draggedMenu.menuStyle.sizeType,
      };
      await axiosInstance.patch("/api/menus", bodyData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (selectedCategory && token) {
        // 캐시 무효화 후 최신 데이터 요청하여 드래그앤드롭마다 재랜더링되도록 함
        await invalidateMenuCache(selectedCategory.categoryId);
        fetchMenus(selectedCategory.categoryId, true);
      }
    } catch (err) {
      console.error("메뉴 위치 변경 실패:", err);
      showAlert("메뉴 위치 변경에 실패했습니다.", "error");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`flex items-center justify-center h-screen w-screen relative ${isDarkMode ? 'bg-gray-900' : ''}`}>
        <div className={`relative border w-4/5 h-4/5 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white bg-opacity-20 border-gray-400'} rounded-2xl p-6 flex flex-row`}>
          <button
            onClick={() => router.push("/setting")}
            className={`absolute top-0 left-0 bg-transparent px-2 py-2 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-400'} text-sm rounded`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <div className="w-1/2 flex flex-col justify-start mr-4">
            {loadingCategories ? (
              <div className="flex flex-col w-full h-full items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <>
                <div className="flex flex-row mt-6 ml-4 space-x-2">
                  {categories.map((cat) => (
                    <CategorySidebar
                      key={cat.categoryId}
                      category={cat}
                      selectedCategoryId={selectedCategory?.categoryId}
                      onSelectCategory={setSelectedCategory}
                    />
                  ))}
                </div>
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <div className={`w-full h-full max-w-full max-h-full grid grid-cols-5 grid-rows-4 gap-1 ${isDarkMode ? 'border-blue-700' : 'border-blue-500'} border p-2 rounded-lg mb-2`}>
                    {Array.from({ length: 4 }).map((_, rowIndex) =>
                      Array.from({ length: 5 }).map((_, colIndex) => {
                        const cellMenus = currentMenus.filter(
                          (m) =>
                            m.menuStyle.positionX === colIndex &&
                            m.menuStyle.positionY === rowIndex
                        );
                        return (
                          <GridCell
                            key={`cell-${rowIndex}-${colIndex}`}
                            row={rowIndex}
                            col={colIndex}
                            items={cellMenus}
                            onCellClick={handleCellClick}
                            onMenuClick={handleMenuClick}
                            moveMenuToCell={moveMenuToCell}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="w-1/2 flex items-center justify-center">
            {showAddModal && currentCell && selectedCategory && storeId && (
              <AddItemModal
                onClose={closeAddModal}
                categoryId={selectedCategory.categoryId}
                storeId={storeId}
                positionX={currentCell.x}
                positionY={currentCell.y}
                hasHalfItem={hasHalfItem}
              />
            )}
            {showModifyModal && selectedMenu && (
              <ModifyItemModal
                menu={selectedMenu}
                onClose={closeModifyModal}
                hasHalfInSameCell={hasHalfInSameCell}
              />
            )}
          </div>
        </div>
        
        {/* AlertModal 컴포넌트 */}
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={closeAlert}
          message={alertModal.message}
          type={alertModal.type}
          showConfirmButton={true}
          confirmText="확인"
        />
      </div>
    </DndProvider>
  );
}
