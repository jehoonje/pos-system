"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axiosInstance";
import Spinner from "../../components/Spinner";
import { useFormStore } from "../../store/formStore";
import { CheckCircle } from "lucide-react";
import Cookies from "js-cookie";

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  // Zustand 스토어에서 상태와 업데이트 함수를 가져옴
  const {
    storeName,
    storePlace,
    password,
    phoneNumber,
    setStoreName,
    setStorePlace,
    setPassword,
    setPhoneNumber,
  } = useFormStore();

  useEffect(() => {
    console.log("Current step:", step);
  }, [step]);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!token) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/");
    }
  }, [router]);

  const handleGoBack = () => {
    if (step === 1) {
      router.push("/home");
    } else {
      setStep((prev) => prev - 1);
    }
  };

  // --------------------------------------------
  // 1) 매장 이름 입력
  // --------------------------------------------
  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreName(e.target.value);
  };

  // Step 1: 매장 이름 입력
  const handleNextStep1 = () => {
    if (storeName.trim() !== "") {
      setStep(2);
      console.log("Step moved to 2");
    } else {
      alert("매장 이름을 입력해주세요.");
    }
  };



  // --------------------------------------------
  // 2) 매장 주소 입력 (카카오 주소 API 사용)
  // --------------------------------------------
  const handleOpenKakaoAddress = () => {
    if (typeof window === "undefined" || !window.daum?.Postcode) {
      alert(
        "카카오 주소 API가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }
    new (window.daum.Postcode as any)({
      oncomplete: (data: any) => {
        setStorePlace(data.address);
      },
    }).open();
  };

  const handleChangePlace = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStorePlace(e.target.value);
  };

  const handleNextStep2 = () => {
    if (storePlace.trim() !== "") {
      setStep(3);
      console.log("Step moved to 3");
    } else {
      alert("매장 주소를 입력해주세요.");
    }
  };

  // --------------------------------------------
  // 3) 비밀번호(4자리)
  // --------------------------------------------
  const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPassword(val);
  };

  const handleNextStep3 = () => {
    if (password.length === 4) {
      setStep(4);
    } else {
      alert("비밀번호 4자리를 입력해주세요.");
    }
  };

  // --------------------------------------------
  // 4) 전화번호 입력
  // --------------------------------------------
  const handleChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, ""); // 숫자만 남김
    if (value.length > 11) value = value.slice(0, 11); // 11자리로 제한

    // 하이픈 형식 적용
    if (value.length <= 3) {
      value = value;
    } else if (value.length <= 7) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else {
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
    }

    setPhoneNumber(value);
  };

  const handleNextStep4 = () => {
    if (phoneNumber.replace(/-/g, "").length === 11) {
      submitPayload();
    } else {
      alert("유효한 전화번호(11자리)를 입력해주세요.");
    }
  };

  // --------------------------------------------
  // 최종 제출
  // --------------------------------------------
  const submitPayload = async () => {
    const { storeName, storePlace, password, phoneNumber } = useFormStore.getState();
  
    if (!storeName || !storePlace || password.length !== 4) {
      alert("모든 필드를 올바르게 입력해주세요.");
      return;
    }
  
    try {
      const payload = {
        storeName,
        storePlace,
        password,
        phoneNumber: phoneNumber.replace(/-/g, ""),
      };
  
      console.log("최종 payload:", payload);
  
      const response = await axiosInstance.post("/api/stores", payload);
      alert("매장이 성공적으로 생성되었습니다. 다시 로그인하여 사용해주세요.");
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      Cookies.remove("currentStoreId");
      setStep(5);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("매장 생성 실패:", error);
      alert("매장 생성에 실패했습니다.");
      router.push("/home");
    }
  };

  const renderStep = () => {
    if (step === 5) {
      return <Spinner />;
    }

    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-lg">
              매장 이름을 작성해주세요.
            </p>
            <input
              type="text"
              value={storeName}
              onChange={handleChangeName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNextStep1();
              }}
              className="w-[300px] h-10 rounded-md border border-gray-300 px-3 outline-none"
              placeholder="매장 이름을 입력"
            />
            <button
              onClick={handleNextStep1}
              disabled={storeName.trim() === ""}
              className={`mt-4 flex items-center gap-2 px-4 py-2 text-green-600 transition-all duration-300 ${
                storeName.trim() === ""
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-green-800 hover:scale-110"
              }`}
            >
              <CheckCircle className="w-8 h-8" />
              
            </button>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-lg">
              매장 주소를 작성해주세요.
            </p>
            <input
              type="text"
              value={storePlace}
              onChange={handleChangePlace}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNextStep2();
              }}
              className="w-[300px] h-10 rounded-md border border-gray-300 px-3 outline-none mb-2"
              placeholder="직접 주소를 입력하거나 검색하기"
            />
            <button
              onClick={handleOpenKakaoAddress}
              className="mt-2 border-none text-xs text-gray-500 rounded-md hover:text-gray-900 transition"
            >
              카카오 주소 검색
            </button>
            <button
              onClick={handleNextStep2}
              disabled={storePlace.trim() === ""}
              className={`mt-4 flex items-center gap-2 px-4 py-2 text-green-600 transition-all duration-300 ${
                storePlace.trim() === ""
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-green-800 hover:scale-110"
              }`}
            >
              <CheckCircle className="w-8 h-8" />
              
            </button>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-lg">
              사용하실 비밀번호 4자리를 입력해주세요.
            </p>
            <input
              type="password"
              maxLength={4}
              value={password}
              onChange={handleChangePassword}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNextStep3();
              }}
              className="w-[300px] h-10 rounded-md border border-gray-300 px-3 outline-none text-center"
              placeholder=""
            />
            <button
              onClick={handleNextStep3}
              disabled={password.length !== 4}
              className={`mt-4 flex items-center gap-2 px-4 py-2 text-green-600 transition-all duration-300 ${
                password.length !== 4
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-green-800 hover:scale-110"
              }`}
            >
              <CheckCircle className="w-8 h-8" />
              
            </button>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-lg">
              매장 대표번호를 입력해주세요.
            </p>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handleChangePhoneNumber}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNextStep4();
              }}
              className="w-[300px] h-10 rounded-md border border-gray-300 px-3 outline-none"
              placeholder="010-1234-1234"
            />
            <button
              onClick={handleNextStep4}
              disabled={phoneNumber.replace(/-/g, "").length !== 11}
              className={`mt-4 flex items-center gap-2 px-4 py-2 text-green-600 transition-all duration-300 ${
                phoneNumber.replace(/-/g, "").length !== 11
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-green-800 hover:scale-110"
              }`}
            >
              <CheckCircle className="w-8 h-8" />
              
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-transparent relative">
      {step !== 5 && (
        <button
          onClick={handleGoBack}
          className="absolute top-5 left-5 bg-transparent text-gray-500 px-2 py-1 text-sm rounded hover:text-gray-900"
        >
          Back
        </button>
      )}
      <div className="bg-transparent border-none w-[80%] md:w-[600px] h-[300px] rounded-md flex flex-col items-center justify-center">
        {renderStep()}
      </div>
    </div>
  );
}