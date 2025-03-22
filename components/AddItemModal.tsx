"use client";
import React, { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import axiosInstance from "../lib/axiosInstance";
import Cookies from "js-cookie";

interface Props {
  onClose: () => void;
  categoryId: number;
  storeId: number;
  positionX: number;
  positionY: number;
  hasHalfItem: boolean; // 셀에 HALF 메뉴가 있는지 여부
}

export default function AddItemModal({
  onClose,
  categoryId,
  storeId,
  positionX,
  positionY,
  hasHalfItem,
}: Props) {
  const [menuName, setMenuName] = useState("");
  const [price, setPrice] = useState<number>(0);
  // 기본값 HALF
  const [sizeType, setSizeType] = useState<"FULL" | "HALF">("HALF");
  const [colorCode, setColorCode] = useState("#FAFAFA");
  const [token, setToken] = useState<string | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedToken = Cookies.get("accessToken");
    if (storedToken) setToken(storedToken);
  }, []);

  // 바깥 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
    }
    if (isColorPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColorPickerOpen]);

  const handleSave = async () => {
    if (!menuName.trim() || price < 0) {
      alert("이름과 가격을 확인하세요.");
      return;
    }
    if (!token) {
      alert("토큰이 없습니다. 다시 로그인해주세요.");
      return;
    }

    const bodyData = {
      categoryId,
      storeId,
      menuName,
      price,
      colorCode,
      sizeType,
      positionX,
      positionY,
    };

    try {
      await axiosInstance.post("/api/menus", bodyData);
      onClose();
    } catch (err) {
      console.error(err);
      alert("메뉴 생성 실패");
    }
  };

  return (
    <div className="relative p-6 w-80 bg-white border rounded shadow">
      <h2 className="text-xl text-center font-semibold mb-4 text-gray-700">
        Add New Item
      </h2>

      {/* Fullsize / Halfsize 선택 */}
      <div className="flex justify-center gap-4 mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="sizeType"
            value="FULL"
            checked={sizeType === "FULL"}
            onChange={() => setSizeType("FULL")}
            className="w-4 h-4"
            disabled={hasHalfItem} 
            // 셀에 HALF 메뉴가 이미 있다면 FULL 선택 불가
          />
          <span className="text-gray-700">Full Size</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="sizeType"
            value="HALF"
            checked={sizeType === "HALF"}
            onChange={() => setSizeType("HALF")}
            className="w-4 h-4"
          />
          <span className="text-gray-700">Half Size</span>
        </label>
      </div>

      {/* 입력 필드 */}
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <label className="w-16 text-gray-700">Name</label>
          <input
            type="text"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            placeholder="Enter menu name"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="w-16 text-gray-700">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="Enter menu price"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 색상 필드 */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <label className="text-gray-700">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={colorCode}
                readOnly
                onClick={() => setIsColorPickerOpen(true)}
                placeholder="#FAFAFA"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <div
                className="w-10 h-6 border rounded"
                style={{ backgroundColor: colorCode }}
                onClick={() => setIsColorPickerOpen(true)}
              />
            </div>
          </div>
          {isColorPickerOpen && (
            <div
              ref={colorPickerRef}
              className="absolute z-10 bg-white p-3 border rounded shadow mt-2"
            >
              <HexColorPicker color={colorCode} onChange={setColorCode} />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setIsColorPickerOpen(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  취소
                </button>
                <button
                  onClick={() => setIsColorPickerOpen(false)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 버튼 */}
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </div>
  );
}
