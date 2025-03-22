"use client";
import React, { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import axiosInstance from "../lib/axiosInstance";
import Cookies from "js-cookie";

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
    sizeType?: string; // "FULL" | "HALF"
  };
};

interface Props {
  menu: MenuItem;
  onClose: () => void;
  hasHalfInSameCell: boolean; // 해당 셀에 HALF가 있으면 FULL 선택 불가
}

export default function ModifyItemModal({
  menu,
  onClose,
  hasHalfInSameCell,
}: Props) {
  const [menuName, setMenuName] = useState(menu.menuName);
  const [price, setPrice] = useState(menu.price);
  const [sizeType, setSizeType] = useState<"FULL" | "HALF">(
    (menu.menuStyle.sizeType as "FULL" | "HALF") || "FULL"
  );
  const [colorCode, setColorCode] = useState(
    menu.menuStyle.colorCode || "#FAFAFA"
  );
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = Cookies.get("accessToken");
    if (storedToken) setToken(storedToken);
  }, []);

  // 추가: menu prop이 변경될 때마다 내부 state 재할당
  useEffect(() => {
    setMenuName(menu.menuName);
    setPrice(menu.price);
    setSizeType((menu.menuStyle.sizeType as "FULL" | "HALF") || "FULL");
    setColorCode(menu.menuStyle.colorCode || "#FAFAFA");
  }, [menu]);

  // 컬러 피커 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isColorPickerOpen &&
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColorPickerOpen]);

  const handleDelete = async () => {
    if (!token) {
      alert("토큰이 없습니다. 다시 로그인해주세요.");
      return;
    }
    try {
      await axiosInstance.delete(`/api/menus/${menu.menuId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("메뉴 삭제 실패");
    }
  };

  const handleSave = async () => {
    if (!menuName.trim() || price < 0) {
      alert("이름과 가격을 확인하세요.");
      return;
    }
    if (!token) {
      alert("토큰이 없습니다. 다시 로그인해주세요.");
      return;
    }

    // HALF가 이미 있으면 FULL 불가
    // (hasHalfInSameCell이 true면, 여기서도 FULL 선택 disabled)
    const bodyData = {
      menuId: menu.menuId,
      menuName,
      price,
      discountRate: 0,
      colorCode,
      positionX: menu.menuStyle.positionX,
      positionY: menu.menuStyle.positionY,
      sizeType,
    };

    try {
      await axiosInstance.patch("/api/menus", bodyData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("메뉴 수정 실패");
    }
  };

  return (
    <div className="relative font-mono p-6 w-80 bg-white">
      <h2 className="text-md text-center font-semibold mb-4 text-gray-700">
        Modify Item
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
            disabled={hasHalfInSameCell}
            // 셀에 HALF가 있다면 FULL 불가
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

      {/* 메뉴 이름 입력 */}
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

        {/* 색상 */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <label className="mr-[0.4rem] text-gray-700">Color</label>
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
                className="w-12 h-[2.4rem] border rounded"
                style={{ backgroundColor: colorCode }}
                onClick={() => setIsColorPickerOpen(true)}
              />
            </div>
          </div>
          {isColorPickerOpen && (
            <div
              ref={colorPickerRef}
              className="absolute z-10 bg-white p-2 border rounded shadow mt-2"
            >
              <HexColorPicker color={colorCode} onChange={setColorCode} />
            </div>
          )}
        </div>
      </div>

      {/* 버튼들 */}
      <div className="mt-6 text-xs flex justify-center gap-4">
        <button
          onClick={handleSave}
          className="px-5 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="px-4 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
