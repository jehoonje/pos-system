"use client";
import React from "react";

interface Props {
  menuName: string;
  price: number;
  onClick?: () => void;
  color?: string; // 서버에서 받아온 색상 or #f5f5f5
  sizeType?: "FULL" | "HALF"; // 버튼 크기 타입
  isDarkMode?: boolean; // Add dark mode prop
}

// 색상의 상대적 밝기(Luminance)를 계산하는 함수
const getLuminance = (color: string): number => {
  // 기본값: #f5f5f5 (밝은 회색)
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

export default function MenuButton({
  menuName,
  price,
  onClick,
  color = "#f5f5f5",
  sizeType = "FULL",
  isDarkMode = false,
}: Props) {
  // sizeType에 따라 width/height 등 다르게 처리 가능
  const baseStyle =
    sizeType === "FULL"
      ? "w-full h-full " // 가로세로 모두 차지 (그리드 셀 크기에 따라)
      : "w-full h-[50%]"; // 예시: 반만 차지

  // Apply default color based on dark mode if no specific color is provided
  const finalColor = color === "#f5f5f5" && isDarkMode ? "#333333" : color;
  const textColor = getTextColor(finalColor);

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} font-medium font-mono
                  flex items-center justify-center
                  hover:opacity-50 hover:shadow-lg transition-all duration-200`}
      style={{ backgroundColor: finalColor, color: textColor }} // 동적 글씨 색상 적용
    >
      <div className="text-center">
        <div>{menuName}</div>
        <div className="text-sm mt-1">{`₩ ${price}`}</div>
      </div>
    </button>
  );
}
