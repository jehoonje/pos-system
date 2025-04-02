"use client";
import { useEffect, useState, useRef } from "react";
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
  orderMenuId?: number | null;
}

interface PosClientProps {
  initialStoreId: number | null;
  initialCategories: any[];
  initialMenus: any[];
}

export function PosClient({ 
  initialStoreId, 
  initialCategories, 
  initialMenus 
}: PosClientProps) {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  // useRef를 사용하여 초기화 완료 여부 추적
  const initializedRef = useRef(false);
  const userSelectedCategoryRef = useRef<number | null>(null);

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
    setCategories,
    setCurrentMenus,
    setIsLoading
  } = usePosStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [categoryClicked, setCategoryClicked] = useState(false);

  // 새로운 상태 추가 - 이전 메뉴 데이터 유지
  const [previousMenus, setPreviousMenus] = useState<any[]>([]);
  const [fadeState, setFadeState] = useState<'in' | 'out' | 'none'>('none');

  // 다크모드 배경색 적용
  useEffect(() => {
    if (isDarkMode) {
      document.body.style.backgroundColor = "#111827";
    } else {
      document.body.style.backgroundColor = "";
    }
  }, [isDarkMode]);

  // 초기 데이터로 한 번만 상태 초기화 (초기화 완료 후 더 이상 실행되지 않음)
  useEffect(() => {
    // 이미 초기화되었으면 실행하지 않음
    if (initializedRef.current) return;
    
    if (initialStoreId && initialCategories?.length > 0) {
      console.log('초기 데이터로 상태 초기화');
      
      setStoreId(initialStoreId);
      setCategories(initialCategories);
      
      const firstCategoryId = initialCategories[0]?.categoryId;
      if (firstCategoryId) {
        setSelectedCategoryId(firstCategoryId);
        userSelectedCategoryRef.current = firstCategoryId;
      }
      
      if (initialMenus?.length > 0) {
        setCurrentMenus(initialMenus);
      }
      
      // 초기화 완료 표시
      initializedRef.current = true;
    }
  }, [initialStoreId, initialCategories, initialMenus, setStoreId, setCategories, setCurrentMenus]);

  // 카테고리 ID 변경 시 메뉴 로드 (사용자 선택 처리)
  useEffect(() => {
    // 선택된 카테고리가 없거나 초기화가 안 된 경우 무시
    if (!selectedCategoryId || !storeId || categories.length === 0) return;
    
    // 사용자가 실제로 선택한 카테고리인 경우에만 처리
    if (categoryClicked || userSelectedCategoryRef.current === selectedCategoryId) {
      console.log(`카테고리 ${selectedCategoryId} 메뉴 로딩 (사용자 선택)`);
      
      // 로딩 표시 활성화
      setIsLoading(true);
      
      // 메뉴 로드
      fetchMenusByCategory(selectedCategoryId, true).then(() => {
        setCategoryClicked(false);
      });
    }
  }, [selectedCategoryId, storeId, fetchMenusByCategory, categories, categoryClicked, setIsLoading]);

  // 디버깅 로그
  useEffect(() => {
    console.log("PosPage - storeId:", storeId);
    console.log("PosPage - categories:", categories);
    console.log("PosPage - selectedCategoryId:", selectedCategoryId);
    console.log("PosPage - currentMenus:", currentMenus);
    console.log("PosPage - userSelectedCategory:", userSelectedCategoryRef.current);
  }, [storeId, categories, selectedCategoryId, currentMenus]);

  // 메뉴 데이터가 변경될 때 이전 데이터 저장 및 페이드 효과 적용
  useEffect(() => {
    if (currentMenus.length > 0 && isLoading === false) {
      // 새 메뉴가 로드되면 페이드 인 효과 적용
      setFadeState('in');
      
      // 일정 시간 후 페이드 효과 제거
      const timer = setTimeout(() => {
        setFadeState('none');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentMenus, isLoading]);

  // 카테고리 클릭 핸들러 수정
  const handleCategoryClick = (catId: number) => {
    console.log(`카테고리 ${catId} 클릭됨`);
    
    // 현재 메뉴 데이터를 이전 메뉴로 저장
    if (currentMenus.length > 0) {
      setPreviousMenus(currentMenus);
      setFadeState('out'); // 페이드 아웃 효과 시작
    }
    
    // 사용자 선택 카테고리 저장
    userSelectedCategoryRef.current = catId;
    
    // 로딩 상태 활성화 - 지연 적용 (깜박임 방지)
    setTimeout(() => {
      setIsLoading(true);
      
      // 선택된 카테고리 변경
      setSelectedCategoryId(catId);
      setCategoryClicked(true);
    }, 50);
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

    const menuData = (isLoading && previousMenus.length > 0) ? previousMenus : currentMenus;

    const rows = 4;
    const cols = 5;

    return (
      <div 
        className={`grid grid-cols-5 grid-rows-4 flex-1 transition-opacity duration-300 ease-in-out
                  ${fadeState === 'in' ? 'opacity-100' : 
                    fadeState === 'out' ? 'opacity-60' : ''}`}
      >
        {Array.from({ length: rows }).map((_, rowIdx) =>
          Array.from({ length: cols }).map((_, colIdx) => {
            const cellMenus = menuData.filter(
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
          {isLoading && previousMenus.length === 0 ? (
            <div className={`flex justify-center items-center h-full ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500 mx-auto mb-2"></div>
                <div>Loading...</div>
              </div>
            </div>
          ) : currentMenus.length === 0 && previousMenus.length === 0 ? (
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
          />
        )}
      </div>
    </div>
  );
}
