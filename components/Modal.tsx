// components/Modal.tsx
"use client";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  isDarkMode?: boolean; 
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-lg z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onClick={handleOverlayClick}
    >
      <motion.div
        className="relative w-[540px] h-[200px] rounded-lg shadow-lg border border-white/30 bg-white p-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center justify-center h-full text-gray-800">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
