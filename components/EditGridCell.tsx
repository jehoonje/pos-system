"use client";
import React, { useRef } from "react";
import { Plus } from "lucide-react";
import { useDrop } from "react-dnd";
import MenuButton from "./EditMenuButton";

type Menu = {
  menuId: number;
  menuName: string;
  price: number;
  discountRate?: number;
  uiId: number; // 서버로는 안 보냄
  menuStyle: {
    uiId: number; // 서버로는 안 보냄
    colorCode: string;
    positionX?: number;
    positionY?: number;
    sizeType?: string; // "FULL" or "HALF"
  };
};

interface Props {
  row: number;
  col: number;
  items: Menu[];
  onCellClick: (x: number, y: number) => void;
  onMenuClick: (menu: Menu) => void;
  moveMenuToCell: (draggedMenu: Menu, targetX: number, targetY: number) => void;
}

/**
 * 각 셀(GridCell)은 useDrop 훅을 통해 drop을 처리
 * 셀 내부에는 MenuButton(드래그 가능한 버튼)을 렌더링
 */
export default function GridCell({
  row,
  col,
  items,
  onCellClick,
  onMenuClick,
  moveMenuToCell,
}: Props) {
  // FULL 사이즈 메뉴가 있는지 확인
  const fullItem = items.find((m) => m.menuStyle.sizeType === "FULL");
  // HALF 사이즈 메뉴
  const halfItems = items.filter((m) => m.menuStyle.sizeType === "HALF");

  /**
   * 🚩 핵심: min-h-0 추가하여 부모 높이가 줄어들 때 내부도 함께 줄어듦
   * flex-col + flex-1 구조로 HALF 2개가 세로로 균등 분할 가능
   */
  const baseStyle =
    "w-full h-full flex flex-col min-h-0 overflow-hidden";

  // drop 영역 레퍼런스
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop<
    { type: "MENU"; menu: Menu },
    void,
    { isOver: boolean }
  >({
    accept: "MENU",
    drop: (item) => {
      moveMenuToCell(item.menu, col, row);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  drop(dropAreaRef);

  // 1) 셀이 완전히 비었으면 -> + 버튼
  if (items.length === 0) {
    return (
      <div
        ref={dropAreaRef}
        className={`${baseStyle} bg-gray-200 flex items-center justify-center ${
          isOver ? "bg-green-100" : ""
        }`}
      >
        <button
          onClick={() => onCellClick(col, row)}
          className="flex items-center justify-center"
        >
          <Plus className="w-6 h-6 opacity-30" />
        </button>
      </div>
    );
  }

  // 2) FULL 메뉴가 있으면 단일 버튼
  if (fullItem) {
    return (
      <div
        ref={dropAreaRef}
        className={`${baseStyle} ${
          isOver ? "bg-green-100" : "bg-white"
        }`}
      >
        <MenuButton menu={fullItem} onMenuClick={onMenuClick} />
      </div>
    );
  }

  // 3) HALF 메뉴가 있으면 최대 2개
  return (
    <div
      ref={dropAreaRef}
      className={`${baseStyle} ${isOver ? "bg-green-100" : "bg-white"}`}
    >
      {halfItems.map((menu, idx) => (
        <MenuButton key={menu.menuId} menu={menu} onMenuClick={onMenuClick} />
      ))}
      {/* HALF 메뉴가 1개면 -> 나머지 공간에 + 버튼 */}
      {halfItems.length === 1 && (
        <button
          onClick={() => onCellClick(col, row)}
          className="flex-1 flex items-center justify-center bg-gray-200"
          // style={{ minHeight: "50px" }}
        >
          <Plus className="w-4 h-4 opacity-30" />
        </button>
      )}
    </div>
  );
}
