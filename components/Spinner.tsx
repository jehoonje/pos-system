import React from "react";
import { useThemeStore } from "@/store/themeStore";

export default function Spinner() {
  const { isDarkMode } = useThemeStore();
  

  return (
    <div className={`flex items-center justify-center h-screen ${isDarkMode ? "bg-[#111827]" : "bg-white"}`}>
      <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
    </div>
  );
}
