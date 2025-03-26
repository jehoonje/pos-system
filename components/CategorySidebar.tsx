"use client";
import React from "react";

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

interface Props {
  category: Category;
  selectedCategoryId?: number;
  onSelectCategory: (category: Category) => void;
}

export default function CategorySidebar({
  category,
  selectedCategoryId,
  onSelectCategory,
}: Props) {
  const isSelected = category.categoryId === selectedCategoryId;
  
  return (
    <button
      onClick={() => onSelectCategory(category)}
      style={{ backgroundColor: category.categoryStyle.colorCode }}
      className={`rounded min-w-[5rem] max-w-full h-10 mb-2 px-4 
                  ${isSelected ? "bg-blue-500 text-white" : "bg-white text-gray-700"} 
                  whitespace-nowrap`}
    >
      {category.categoryName}
    </button>
  );
}
