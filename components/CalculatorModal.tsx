"use client";

import { useFormStore } from "@/store/formStore";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CalculatorModalProps {
  isDarkMode?: boolean;
}

export default function CalculatorModal({ isDarkMode = false }: CalculatorModalProps) {
  const { isCalculatorModalOpen, setCalculatorModalOpen } = useFormStore();
  const [display, setDisplay] = useState<string>("0");
  const [currentValue, setCurrentValue] = useState<string>("");
  const [operator, setOperator] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: window.innerWidth / 2 - 309, // 초기 중앙 위치
    y: window.innerHeight / 2 - 350,
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    isDragging: boolean;
  }>({
    startX: 0,
    startY: 0,
    isDragging: false,
  });

  // 드래그 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 버튼 클릭 방지 (버튼 내에서는 드래그 시작하지 않음)
    if (e.target instanceof HTMLButtonElement) return;

    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX - position.x;
    dragRef.current.startY = e.clientY - position.y;

    // 이벤트 전파 중단하여 버튼 클릭과 충돌 방지
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current.isDragging || !modalRef.current) return;

    const newX = e.clientX - dragRef.current.startX;
    const newY = e.clientY - dragRef.current.startY;

    // 창이 화면 밖으로 나가지 않도록 제한
    const maxX = window.innerWidth - modalRef.current.offsetWidth;
    const maxY = window.innerHeight - modalRef.current.offsetHeight;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
  };

  // 이벤트 리스너 추가/제거
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // 계산기 로직
  const handleNumberClick = (num: string) => {
    if (currentValue === "0" && num !== ".") {
      setCurrentValue(num);
      setDisplay(num);
    } else if (num === "." && currentValue.includes(".")) {
      return;
    } else {
      setCurrentValue(currentValue + num);
      setDisplay(currentValue + num);
    }
  };

  const handleOperatorClick = (op: string) => {
    if (currentValue === "") return;

    if (previousValue && operator) {
      const result = calculate();
      setPreviousValue(result.toString());
      setDisplay(result.toString());
    } else {
      setPreviousValue(currentValue);
    }

    setOperator(op);
    setCurrentValue("");
    setDisplay(currentValue + " " + op);
  };

  const handleEqualsClick = () => {
    if (!previousValue || !operator || currentValue === "") return;

    const result = calculate();
    setDisplay(result.toString());
    setPreviousValue(null);
    setOperator(null);
    setCurrentValue(result.toString());
  };

  const handleClearClick = () => {
    setDisplay("0");
    setCurrentValue("");
    setPreviousValue(null);
    setOperator(null);
  };

  const calculate = (): number => {
    const num1 = parseFloat(previousValue!);
    const num2 = parseFloat(currentValue);

    switch (operator) {
      case "+":
        return num1 + num2;
      case "-":
        return num1 - num2;
      case "*":
        return num1 * num2;
      case "/":
        return num2 !== 0 ? num1 / num2 : NaN;
      default:
        return 0;
    }
  };

  if (!isCalculatorModalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        ref={modalRef}
        className={`absolute cursor-grabbing ${isDarkMode ? 'bg-gray-800' : 'bg-gray-700'} rounded-lg shadow-lg p-4 w-80 z-50`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: "transform 0.1s ease-out", // 부드러운 이동 효과
        }}
        onMouseDown={handleMouseDown}
      >
        <h2 className="text-lg text-white font-medium mb-2 cursor-move"></h2>
        <div className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'} p-4 rounded-lg opacity-${isDarkMode ? '80' : '50'} mb-4 text-right text-xl font-mono`}>
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={handleClearClick}
          >
            C
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleOperatorClick("/")}
          >
            ÷
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleOperatorClick("*")}
          >
            ×
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleOperatorClick("-")}
          >
            −
          </button>

          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleNumberClick("7")}
          >
            7
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleNumberClick("8")}
          >
            8
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleNumberClick("9")}
          >
            9
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleOperatorClick("+")}
          >
            +
          </button>

          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleNumberClick("4")}
          >
            4
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleNumberClick("5")}
          >
            5
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleNumberClick("6")}
          >
            6
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg row-span-2`}
            onClick={handleEqualsClick}
          >
            =
          </button>

          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleNumberClick("1")}
          >
            1
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleNumberClick("2")}
          >
            2
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleNumberClick("3")}
          >
            3
          </button>

          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg col-span-2`}
            onClick={() => handleNumberClick("0")}
          >
            0
          </button>
          <button
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded p-4 text-lg`}
            onClick={() => handleNumberClick(".")}
          >
            .
          </button>
        </div>
        <button
          className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded p-2 w-full mt-4`}
          onClick={() => setCalculatorModalOpen(false)}
        >
          Close
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
