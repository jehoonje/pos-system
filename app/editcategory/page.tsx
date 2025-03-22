"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddCategoryModal from "../../components/AddCategoryModal";
import ModifyCategoryModal from "../../components/ModifyCategoryModal";
import axiosInstance from "../../lib/axiosInstance";
import { ChevronLeft } from "lucide-react";
import Cookies from "js-cookie";

export default function EditCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");

  const [categories, setCategories] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 토큰 가져오기
  useEffect(() => {
    const storedToken = Cookies.get("accessToken");
    if (!storedToken) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/");
    } else {
      setToken(storedToken);
    }
  }, [router]);

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    if (!storeId || !token) return;
    try {
      const response = await axiosInstance.get(
        `/api/categories/all/${storeId}`
      );
      setCategories(response.data);
    } catch (error: any) {
      console.error(error.message);
      alert(error.message);
    }
  };

  useEffect(() => {
    if (!storeId) {
      alert("유효하지 않은 Store ID입니다.");
      router.push("/");
    } else {
      fetchCategories();
    }
  }, [storeId, token]);

  // 모달 열기 시 상호 배제 처리
  const openAddModal = () => {
    if (categories.length >= 8) {
      alert("카테고리는 최대 8개까지만 추가할 수 있습니다.");
      return;
    }
    // modify 모달이 열려 있다면 닫음
    setIsModifyModalOpen(false);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const openModifyModal = (category: any) => {
    // add 모달이 열려 있다면 닫음
    setIsAddModalOpen(false);
    setSelectedCategory(category);
    setIsModifyModalOpen(true);
  };

  const closeModifyModal = () => {
    setIsModifyModalOpen(false);
    setSelectedCategory(null);
  };

  // 새 카테고리 등록
  const handleAddCategory = async (name: string, color: string) => {
    if (!storeId || !token) return;
    try {
      await axiosInstance.post("/api/categories", {
        storeId: Number(storeId),
        categoryName: name,
        colorCode: color,
        positionX: 0,
        positionY: 0,
        sizeType: "",
      });
      alert("카테고리가 생성되었습니다.");
      closeAddModal();
      fetchCategories();
    } catch (error: any) {
      console.error(error.message);
      alert(error.message);
    }
  };

  const handleModifyCategory = async (
    id: number,
    uiId: number,
    name: string,
    color: string
  ) => {
    if (!token) return;

    const requestData = {
      categoryId: id,
      uiId: uiId,
      categoryName: name || "default",
      colorCode: color,
      positionX: "",
      positionY: "",
      sizeType: "",
    };

    console.log("보내는 데이터:", requestData); // 백엔드로 보내는 데이터를 로그로 확인

    try {
      const response = await axiosInstance.patch(
        "/api/categories",
        requestData
      );
      console.log("✅ 응답:", response.data);
      alert("카테고리가 수정되었습니다.");
      closeModifyModal();
      fetchCategories();
    } catch (error: any) {
      console.error(
        "❌ 카테고리 수정 오류:",
        error.response?.data || error.message
      );
      alert("카테고리 수정에 실패했습니다.");
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (id: number) => {
    if (!token) return;
    try {
      await axiosInstance.delete(`/api/categories/${id}`);
      alert("카테고리가 삭제되었습니다.");
      closeModifyModal();
      fetchCategories();
    } catch (error: any) {
      console.error(error.message);
      alert(error.message);
    }
  };

  return (
    
      <div className="flex items-center justify-center h-screen w-screen relative font-mono">
        {/* 전체를 감싸는 박스 */}
        <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl p-6 flex flex-row shadow-lg">
          <button
            onClick={() => router.push("/setting")}
            className="absolute top-0 left-0 bg-transparent px-2 py-2 text-gray-500 text-sm rounded hover:text-gray-400"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* 왼쪽 50% (카테고리 리스트) */}
          <div className="w-1/2 flex flex-col justify-center gap-4 items-center p-4">
            <h2 className="text-md font-semibold mb-6">Edit Categories</h2>

            {/* 카테고리 리스트 */}
            <div className="w-full flex flex-wrap gap-4 justify-center">
              {categories.map((cat) => (
                <div
                  key={cat.categoryId}
                  onClick={() => openModifyModal(cat)}
                  className="min-w-[5rem] max-w-full text-center cursor-pointer border border-gray-400 hover:bg-gray-200 py-2"
                  style={{ backgroundColor: cat.categoryStyle.colorCode }}
                >
                  {cat.categoryName}
                </div>
              ))}
            </div>

            {/* 하단 버튼들 */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={openAddModal}
                className="px-6 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
              >
                Add
              </button>
            </div>
          </div>

          {/* 중앙 구분선 */}
          <div className="my-6 border-l border-gray-400"></div>

          {/* 오른쪽 50% (모달 렌더링 영역) */}
          <div className="w-1/2 flex items-center justify-center">
            {isAddModalOpen && (
              <AddCategoryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddCategory}
              />
            )}

            {isModifyModalOpen && selectedCategory && (
              <ModifyCategoryModal
                isOpen={isModifyModalOpen}
                onClose={() => setIsModifyModalOpen(false)}
                category={selectedCategory}
                onModify={handleModifyCategory}
                onDelete={handleDeleteCategory}
              />
            )}
          </div>
        </div>
      </div>

  );
}
