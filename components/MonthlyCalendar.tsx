"use client";
import { useEffect, useRef, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { OrderSummary } from "../types/order";

interface MonthlyCalendarProps {
  orderSummaries: OrderSummary[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  storeId: number;
  isDarkMode?: boolean;
}

interface CalendarDay {
  day: number;
  sales: number;
  date: Date;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  orderSummaries,
  currentMonth,
  setCurrentMonth,
  storeId,
  isDarkMode = false
}) => {
  const [monthlyData, setMonthlyData] = useState<Record<string, number>>({});
  const [totalMonthlySales, setTotalMonthlySales] = useState(0);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(70);

  useEffect(() => {
    if (!orderSummaries || orderSummaries.length === 0) {
      setMonthlyData({});
      setTotalMonthlySales(0);
      return;
    }
  
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });
  
    const data: Record<string, number> = {};
    let total = 0;
  
    const successSummaries = orderSummaries.filter(
      (summary) => !summary.status || summary.status === "success"
    );
  
    daysInMonth.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const summary = successSummaries.find((s) => s.date === dateStr);
      const dailyTotal = summary ? summary.totalPrice : 0;
      data[dateStr] = dailyTotal;
      total += dailyTotal;
    });
  
    setMonthlyData(data);
    setTotalMonthlySales(total);
  
    const updateCellSize = () => {
      if (calendarRef.current && calendarRef.current.parentElement) {
        const parentWidth = calendarRef.current.parentElement.clientWidth;
        const parentHeight = calendarRef.current.parentElement.clientHeight;
        const availableWidth = parentWidth / 7;
        const availableHeight = (parentHeight - 180) / 6;
        const newCellSize = Math.min(availableWidth, availableHeight) - 2;
        setCellSize(Math.max(40, newCellSize));
      }
    };
  
    updateCellSize();
    window.addEventListener("resize", updateCellSize);
    return () => window.removeEventListener("resize", updateCellSize);
  }, [currentMonth, orderSummaries]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const today = new Date();
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start, end });
  const firstDayIndex = getDay(start);
  const calendarGrid: (CalendarDay | null)[] = [];

  for (let i = 0; i < firstDayIndex; i++) {
    calendarGrid.push(null);
  }
  daysInMonth.forEach((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    calendarGrid.push({
      day: day.getDate(),
      sales: monthlyData[dateStr] || 0,
      date: day,
    });
  });
  while (calendarGrid.length % 7 !== 0) {
    calendarGrid.push(null);
  }

  const weeks = [];
  for (let i = 0; i < calendarGrid.length; i += 7) {
    weeks.push(calendarGrid.slice(i, i + 7));
  }

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  if (!orderSummaries || orderSummaries.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${isDarkMode ? 'text-white' : ''}`}>
        <p>해당 월의 매출 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      ref={calendarRef}
      className={`${isDarkMode ? 'border-r border-gray-700' : 'border-r border-gray-400'} shadow w-full h-full flex flex-col overflow-auto`}
    >
      <div className={`flex ${isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-400'} justify-between items-center`}>
        <div className={`flex w-2/5 text-center ${isDarkMode ? 'border-r border-gray-700 text-white' : 'border-r border-gray-400'} flex-col`}>
          <div className={`p-3 ${isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-400'} text-md`}>Monthly</div>
          <div className="p-4 text-lg font-bold">
            Total : ₩{totalMonthlySales.toLocaleString()}
          </div>
        </div>
        <div className={`flex items-center gap-2 mr-4 ${isDarkMode ? 'text-white' : ''}`}>
          <button
            onClick={handlePrevMonth}
            className={`px-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
          >
            {"<"}
          </button>
          <span>{format(currentMonth, "yyyy. MM")}</span>
          <button
            onClick={handleNextMonth}
            className={`px-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
          >
            {">"}
          </button>
        </div>
      </div>
      <div className="p-2 grid grid-cols-7 gap-1">
        {weekdays.map((day) => (
          <div
            key={day}
            className={`text-sm text-center ${
              day === "일" 
                ? "text-red-500" 
                : isDarkMode ? "text-gray-300" : "text-gray-700"
            } ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} py-2`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="px-2 flex-1 overflow-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`p-1 ${isDarkMode ? 'border border-gray-700' : 'border border-gray-200'} flex flex-col justify-between ${
                  day && isSameDay(day.date, today) 
                    ? isDarkMode ? "bg-gray-600" : "bg-gray-100" 
                    : isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
                style={{
                  minHeight: `${cellSize}px`,
                  minWidth: `${cellSize}px`,
                }}
              >
                {day ? (
                  <div className="flex justify-between flex-col h-full">
                    <div className={`text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} text-xs`}>{day.day}</div>
                    {day.sales > 0 && (
                      <div className={`text-sm text-right ${isDarkMode ? 'text-white' : ''}`}>
                        ₩{day.sales.toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyCalendar;
