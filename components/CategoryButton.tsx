"use client";
import React from "react";

interface CategoryButtonProps {
  categoryName: string;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  isDarkMode?: boolean; 
}

// 색상의 상대적 밝기(Luminance)를 계산하는 함수
const getLuminance = (color: string): number => {
  // 기본값: 회색 (#f0f0f0)
  if (!color) return 0.9;

  // HEX 색상을 RGB로 변환
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // 상대적 밝기 계산 (ITU-R BT.709 공식)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// 밝기에 따라 글씨 색상 결정
const getTextColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);
  // 밝기 임계값 (0.5): 밝으면 검정, 어두우면 흰색
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export default function CategoryButton({
  categoryName,
  selected = false,
  onClick,
  style,
}: CategoryButtonProps) {
  const backgroundColor = style?.backgroundColor as string || "#f0f0f0";
  const textColor = getTextColor(backgroundColor);

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center px-4 font-mono
        ${selected ? "h-10 -mt-[0.4rem]" : "h-8 mt-[0.1rem]"}
        hover:opacity-90 transition-all duration-200
      `}
      style={{
        ...style,
        backgroundColor, // 명시적으로 적용
        color: textColor, // 동적 글씨 색상
      }}
    >
      {categoryName}
    </button>
  );
}