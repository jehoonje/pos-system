"use client";
import React, { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";

type CategoryType = {
  categoryId: number;
  uiId: number;
  categoryName: string;
  categoryStyle?: {
    uiId?: number;
    colorCode?: string;
  };
};

type ModifyCategoryModalProps = {
  isOpen: boolean;
  isDarkMode?: boolean; 
  onClose: () => void;
  category: CategoryType;
  onModify: (id: number, uiId: number, name: string, color: string) => void;
  onDelete: (id: number) => void;
};

export default function ModifyCategoryModal({
  isOpen,
  onClose,
  category,
  onModify,
  onDelete,
}: ModifyCategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (category) {
      setName(category.categoryName);
      setColor(category.categoryStyle?.colorCode || "#FFFFFF");
    }
  }, [category]);

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

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || !color.trim()) {
      alert("Name과 Color는 필수입니다.");
      return;
    }
    console.log("📌 보내는 데이터:", category.categoryStyle?.uiId); // 백엔드로 보내는 데이터를 로그로 확인
    onModify(
      category.categoryId,
      category.categoryStyle?.uiId ?? 0,
      name,
      color
    );

  };

  return (
    <div className="relative font-mono">
      <div className="p-6 w-80 bg-white">
        <h2 className="text-md font-semibold font-mono text-center font-semibold mb-4 text-gray-700">
          Modify Category
        </h2>

        {/* 입력 필드 */}
        <div className="space-y-3 text-sm">
          <div className="flex flex-row items-center gap-4">
            <label className="w-[3rem] text-gray-700 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative text-sm">
            <div className="flex flex-row items-center gap-4">
              <label className="w-[3rem] text-gray-700 block">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={color}
                  readOnly
                  onClick={() => setIsColorPickerOpen(true)}
                  placeholder="#FFFFFF"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div
                  className="w-14 h-10 border rounded cursor-pointer"
                  style={{ backgroundColor: color }}
                  onClick={() => setIsColorPickerOpen(true)}
                />
              </div>
            </div>
            {isColorPickerOpen && (
              <div
                ref={colorPickerRef}
                className="absolute left-0 mt-2 z-10 bg-white p-4 border rounded shadow-lg"
              >
                <HexColorPicker color={color} onChange={setColor} />
              </div>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-6 text-xs flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={() => onDelete(category.categoryId)}
            className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
