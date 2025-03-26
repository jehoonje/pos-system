"use client";
import React, { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";

type AddCategoryModalProps = {
  isOpen: boolean;
  isDarkMode?: boolean; 
  onClose: () => void;
  onSubmit: (name: string, color: string) => void;
};

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSubmit,
}: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#FFFFFF");
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

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
    onSubmit(name, color);
  };

  return (
    <div className="relative font-mono">
      <div className="p-6 w-80">
        <h2 className="text-md font-semibold text-center font-semibold mb-4 text-gray-700">
          Add New Category
        </h2>

        {/* 입력 필드 */}
        <div className="space-y-3">
          <div className="flex flex-row items-center text-sm gap-4">
            <label className="w-[3rem] text-gray-700 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <div className="flex flex-row items-center text-sm gap-4">
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
              <div ref={colorPickerRef} className="absolute left-0 mt-2 z-10 bg-white p-4 border rounded shadow-lg">
                <HexColorPicker color={color} onChange={setColor} />
              </div>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-6 text-xs flex justify-center space-x-2">
          <button onClick={onClose} className="w-16 py-1 bg-gray-300 rounded hover:bg-gray-400">
            Cancel
          </button>
          <button onClick={handleSave} className="w-16 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
