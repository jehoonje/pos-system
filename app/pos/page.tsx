"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { usePosStore } from "../../store/usePosStore";
import CategoryButton from "../../components/CategoryButton";
import MenuButton from "../../components/PosMenuButton";
import SelectedMenuList from "../../components/SelectedMenuList";
import PlaceModal from "../../components/PlaceModal";
import Cookies from "js-cookie";

interface SelectedItem {
  menuName: string;
  price: number;
  quantity: number;
  menuId: number;
}

export default function PosPage() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();

  const {
    storeId,
    tableName,
    setPlaceId,
    categories,
    currentMenus,
    isLoading,
    setStoreId,
    setOrderId,
    setSelectedItems,
    setTableName,
    fetchCategories,
    fetchMenusByCategory,
    addItem,
    selectedItems,
    orderId,
    placeId,
    fetchUnpaidOrderByPlace,
  } = usePosStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);

  // 다크모드 배경색 적용
  useEffect(() => {
    if (isDarkMode) {
      document.body.style.backgroundColor = "#222";
    } else {
      document.body.style.backgroundColor = "";
    }
  }, [isDarkMode]);

  // storeId 초기화 및 데이터 로드
  useEffect(() => {
    const savedStoreId = Cookies.get("currentStoreId");
    const newStoreId = savedStoreId ? Number(savedStoreId) : null;

    if (newStoreId) {
      if (newStoreId !== storeId) {
        setStoreId(newStoreId);
      }
      fetchCategories(newStoreId).then(() => {
        const state = usePosStore.getState();
        const firstCategoryId = state.categories[0]?.categoryId;
        if (firstCategoryId && firstCategoryId !== selectedCategoryId) {
          setSelectedCategoryId(firstCategoryId);
        }
      });
    }
  }, [setStoreId, fetchCategories]);

  // selectedCategoryId 변경 시 메뉴 로드
  useEffect(() => {
    if (selectedCategoryId && storeId) {
      fetchMenusByCategory(selectedCategoryId, true); // 항상 새 데이터 로드
    }
  }, [selectedCategoryId, storeId, fetchMenusByCategory]);

  // 디버깅 로그 추가
  useEffect(() => {
    console.log("PosPage - storeId:", storeId);
    console.log("PosPage - categories:", categories);
    console.log("PosPage - selectedCategoryId:", selectedCategoryId);
    console.log("PosPage - currentMenus:", currentMenus);
  }, [storeId, categories, selectedCategoryId, currentMenus]);

  const handleCategoryClick = (catId: number) => {
    setSelectedCategoryId(catId);
  };

  const handleMenuClick = (menuName: string, price: number, menuId: number) => {
    addItem(menuName, price, menuId);
  };

  const handleTableClick = () => {
    setShowPlaceModal(true);
  };

  const handleCloseModal = () => {
    setShowPlaceModal(false);
  };

  const handlePlaceSelected = (
    placeName: string,
    selectedPlaceId: number,
    orderIdFromApi?: number,
    orderMenus?: SelectedItem[]
  ) => {
    setTableName(placeName);
    setPlaceId(selectedPlaceId);
    if (orderIdFromApi && orderIdFromApi > 0) {
      setOrderId(orderIdFromApi);
      setSelectedItems(orderMenus || []);
    } else {
      setOrderId(null);
      setSelectedItems([]);
    }
    setShowPlaceModal(false);
  };

  const renderGrid = () => {
    const rows = 4;
    const cols = 5;

    return (
      <div className="grid grid-cols-5 grid-rows-4 flex-1">
        {Array.from({ length: rows }).map((_, rowIdx) =>
          Array.from({ length: cols }).map((_, colIdx) => {
            const cellMenus = currentMenus.filter(
              (m) =>
                m.menuStyle.positionX === colIdx &&
                m.menuStyle.positionY === rowIdx
            );

            if (cellMenus.length === 0) {
              return (
                <div 
                  key={`${rowIdx}-${colIdx}`} 
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} 
                />
              );
            }

            const fullItem = cellMenus.find((m) => m.menuStyle.sizeType === "FULL");
            if (fullItem) {
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className="flex items-center justify-center"
                  style={{ backgroundColor: fullItem.menuStyle.colorCode }}
                >
                  <MenuButton
                    menuName={fullItem.menuName}
                    price={fullItem.price}
                    color={fullItem.menuStyle.colorCode}
                    isDarkMode={isDarkMode}
                    onClick={() =>
                      handleMenuClick(fullItem.menuName, fullItem.price, fullItem.menuId)
                    }
                  />
                </div>
              );
            }

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className="flex flex-col w-full h-full"
              >
                {cellMenus.map((item) => (
                  <div
                    key={item.menuId}
                    className="flex-1 flex items-center justify-center"
                    style={{ backgroundColor: item.menuStyle.colorCode }}
                  >
                    <MenuButton
                      menuName={item.menuName}
                      price={item.price}
                      color={item.menuStyle.colorCode}
                      isDarkMode={isDarkMode}
                      onClick={() =>
                        handleMenuClick(item.menuName, item.price, item.menuId)
                      }
                    />
                  </div>
                ))}
                {cellMenus.length === 1 && (
                  <div className={`flex-1 flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}></div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900 text-white' : ''}`}>
      <div className={`relative w-full h-10 border-b-2 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
        <div className="absolute bottom-[-4px] h-full flex items-center">
          {categories.map((cat) => (
            <CategoryButton
              key={cat.categoryId}
              categoryName={cat.categoryName}
              style={{ backgroundColor: cat.categoryStyle?.colorCode || (isDarkMode ? "#333" : "#f0f0f0") }}
              selected={cat.categoryId === selectedCategoryId}
              onClick={() => handleCategoryClick(cat.categoryId)}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
        <div className="absolute font-mono top-0 left-1/2 -translate-x-1/2 h-full flex items-center">
          <button
            onClick={handleTableClick}
            className={`py-2 px-6 text-sm font-medium ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-800'} transition`}
          >
            {tableName || "Select Table"}
          </button>
        </div>
        <div className="absolute right-2 top-0 h-full flex items-center">
          <button
            onClick={() => {
              const token = Cookies.get("accessToken");
              if (token) {
                router.push("/setting");
              } else {
                alert("인증 정보가 유효하지 않습니다. 다시 로그인해주세요.");
                router.push("/");
              }
            }}
            className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition`}
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 font-mono overflow-hidden">
        <div className={`flex flex-col w-[70%] overflow-auto ${isDarkMode ? 'bg-gray-900' : ''}`}>
          {isLoading ? (
            <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} py-2`}>Loading...</div>
          ) : currentMenus.length === 0 ? (
            <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} py-2`}>No menus available</div>
          ) : (
            renderGrid()
          )}
        </div>
        <div className={`flex flex-col w-[30%] border-l-2 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300'} overflow-hidden`}>
          <SelectedMenuList isDarkMode={isDarkMode} />
        </div>

        {showPlaceModal && (
          <PlaceModal
            onClose={handleCloseModal}
            onPlaceSelected={handlePlaceSelected}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
}
