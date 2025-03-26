"use client";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Search } from "lucide-react";

interface SearchBarProps {
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  handleSearch: () => void;
  isDarkMode?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  handleSearch,
  isDarkMode = false
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  return (
    <div className={`cursor-pointer ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-300'} m-1 rounded p-4 flex items-center`}>
      <Search className={`mr-2 ${isDarkMode ? 'text-gray-300' : ''}`} />
      <span onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>search</span>
      {isDatePickerOpen && (
        <div className={`absolute top-[4rem] left-0 z-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-lg rounded-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col gap-2">
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="시작일 선택"
              className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'} border`}
              wrapperClassName="w-full"
              dateFormat="yyyy-MM-dd"
            />
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || undefined}
              placeholderText="종료일 선택"
              className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'} border`}
              wrapperClassName="w-full"
              dateFormat="yyyy-MM-dd"
            />
            <div className="flex justify-between mt-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleSearch}
              >
                검색
              </button>
              <button
                className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400'} px-4 py-2 rounded`}
                onClick={() => setIsDatePickerOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
