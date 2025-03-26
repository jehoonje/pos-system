"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormStore } from "@/store/formStore";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import { SquareChartGantt } from "lucide-react";
import * as THREE from "three";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Html, OrbitControls, useGLTF } from "@react-three/drei";
import _ from "lodash";
import { motion, AnimatePresence } from "framer-motion";

interface AverageValueData {
  averageValue: number;
}

interface CategoryData {
  ratio: string;
  categoryName: string;
  totalSales: number;
}

interface TimeDetail {
  timeRange: string;
  amount: number;
}

interface PeakTimeData {
  date: string;
  detail: TimeDetail[];
}

interface PaymentTypeDetail {
  type: string;
  amount: number;
  ratio: string;
}

interface PaymentTypeData {
  totalAmount: number;
  typeAndDetail: PaymentTypeDetail[];
}

// Utility component for auto-rotating any mesh
function AutoRotate({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function AverageValueVisual({ data }: { data: AverageValueData | undefined }) {
  if (!data) return null;

  const [hover, setHover] = useState(false);
  const [rotate, setRotate] = useState(false);

  // GLB model loading with useGLTF to leverage caching
  const { scene: coinModel } = useGLTF("/3d/note.glb");

  // Setting up refs
  const coinRef = useRef<THREE.Group>(null);
  const baseRef = useRef<THREE.Mesh>(null);

  // 초기화를 위한 useEffect 추가
  useEffect(() => {
    if (coinRef.current) {
      // 초기 위치 및 회전 명시적 설정
      coinRef.current.position.set(0, -1.8, -2);
      coinRef.current.rotation.set(0, 0, 0);
      coinRef.current.scale.set(12, 12, 12);
    }
  }, []);

  // Memoized clone to avoid recreating it on every render
  const modelClone = useMemo(() => coinModel.clone(), [coinModel]);

  // Model rotation animation
  useFrame(() => {
    if (coinRef.current) {
      coinRef.current.rotation.y += 0.015;
    }
    if (baseRef.current) {
      baseRef.current.rotation.y += 0.015;
    }
  });

  return (
    <group>
      <pointLight
        position={[0, 1, -3]}
        intensity={10}
        distance={10}
        color="#ffffff"
      />
      <spotLight
        position={[0, 1, 2]}
        angle={Math.PI / 4}
        penumbra={1}
        intensity={10}
        target-position={[0, -1, -2]}
      />
      {/* GLB model use */}
      <primitive
        ref={coinRef}
        object={modelClone}
        position={[0, -1.8, -2]}
        scale={12}
        onClick={() => setRotate(!rotate)}
      />

      <Text
        position={[0, 2.5, 0]}
        fontSize={0.8}
        color="#333"
        font="/NanumGothic-Bold.json"
        anchorX="center"
        anchorY="middle"
      >
        {`$${data.averageValue.toLocaleString()}`}
      </Text>

      <Text
        position={[0, 1.5, 0]}
        fontSize={0.4}
        color="#1e293b"
        font="/NanumGothic-Bold.json"
        anchorX="center"
        anchorY="middle"
      >
        Average Order Value
      </Text>
    </group>
  );
}

// Preload 3D model to improve initial loading performance
useGLTF.preload("/3d/note.glb");

const CategoryVisual = React.memo(
  ({ data }: { data: CategoryData[] | undefined }) => {
    if (!data || data.length === 0) return null;

    const colors = ["#fcd34d", "#f87171", "#60a5fa", "#4ade80", "#a78bfa"];
    const total = useMemo(
      () => data.reduce((sum, item) => sum + item.totalSales, 0),
      [data]
    );
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const baseY = -2;

    // 초기 위치 설정을 위한 ref
    const groupRef = useRef<THREE.Group>(null);

    useEffect(() => {
      if (groupRef.current) {
        groupRef.current.position.set(0, 0, 0);
      }
    }, []);

    return (
      <group ref={groupRef}>
        <Text
          position={[0, 3, 0]}
          fontSize={0.4}
          color="#1e293b"
          font="/NanumGothic-Bold.json"
          anchorX="center"
          anchorY="middle"
        >
          Sales Analysis by Category
        </Text>
        {data.map((category, index) => {
          const spacing = 3;
          const totalWidth = (data.length - 1) * spacing;
          const xPos = index * spacing - totalWidth / 2;
          const ratio = category.totalSales / total;
          const height = ratio * 5;

          return (
            <group key={index} position={[xPos, 0, 0]}>
              <AutoRotate>
                <mesh
                  position={[0, baseY + height / 2, 0]}
                  scale={activeIndex === index ? 1.1 : 1}
                  onPointerOver={() => setActiveIndex(index)}
                  onPointerOut={() => setActiveIndex(null)}
                >
                  <boxGeometry args={[1.2, height, 1.2]} />
                  <meshStandardMaterial color={colors[index % colors.length]} />
                </mesh>
              </AutoRotate>

              <Text
                position={[0, baseY - 0.5, 0]}
                fontSize={0.3}
                color="#1e293b"
                font="/NanumGothic-Bold.json"
                anchorX="center"
                anchorY="middle"
              >
                {`${category.categoryName} (${category.ratio})`}
              </Text>

              <Text
                position={[0, baseY + height + 0.5, 0]}
                fontSize={0.5}
                color="#475569"
                font="/NanumGothic-Bold.json"
                anchorX="center"
                anchorY="middle"
              >
                {`$${category.totalSales.toLocaleString()}`}
              </Text>

              {activeIndex === index && (
                <Html position={[0, baseY + height + 1.2, 0]}>
                  <div className="bg-white p-2 rounded shadow-lg">
                    <strong>{category.categoryName}</strong>
                    <p>Sales: ${category.totalSales.toLocaleString()}</p>
                    <p>Ratio: {category.ratio}</p>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    );
  }
);

CategoryVisual.displayName = "CategoryVisual";

function PeakTimeVisual({
  data,
  isDateSearched,
}: {
  data: PeakTimeData[] | undefined;
  isDateSearched?: boolean;
}) {
  if (!data || data.length === 0) return null;

  // Calculate the maximum amount across all data for consistent scaling
  const globalMaxAmount = useMemo(() => {
    let max = 0;
    data.forEach((dayData) => {
      const dayMax = Math.max(...dayData.detail.map((item) => item.amount));
      if (dayMax > max) max = dayMax;
    });
    return max;
  }, [data]);

  // Only show the most recent data (first item) if no date search has been performed
  // Otherwise show all data when search is performed
  const displayData = useMemo(() => {
    if (!isDateSearched && data.length > 0) {
      return [data[0]]; // Only display the most recent data
    }
    return data; // Show all data when search is performed
  }, [data, isDateSearched]);

  // Initialize ref for group positioning
  const groupRef = useRef<THREE.Group>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(0, 0, 0);
    }
    return () => {
      setIsTransitioning(true);
    };
  }, []);

  return (
    <group ref={groupRef} scale={isTransitioning ? 1 : 1}>
      <Text
        position={[0, 3, 0]}
        fontSize={0.4}
        color="#1e293b"
        font="/NanumGothic-Bold.json"
        anchorX="center"
        anchorY="middle"
      >
        Peak Time Analysis
      </Text>

      {displayData.map((dayData, dayIndex) => {
        // Calculate horizontal spacing between different date groups
        const dateSpacing = 3;
        const totalDatesWidth = (displayData.length - 1) * dateSpacing;
        const dateGroupX = dayIndex * dateSpacing - totalDatesWidth / 2;

        return (
          <group key={dayIndex} position={[dateGroupX, 0, 0]}>
            {dayData.detail.map((timeData, index) => {
              const spacing = 1.2;
              const totalWidth = (dayData.detail.length - 1) * spacing;
              const xPos = index * spacing - totalWidth / 2;
              // Use global maximum for consistent heights across date groups
              const height = (timeData.amount / globalMaxAmount) * 3;

              return (
                <group key={index} position={[xPos, -2, 0]}>
                  <AutoRotate>
                    <mesh position={[0, height / 2, 0]}>
                      <boxGeometry args={[1.2, height, 1.2]} />
                      <meshStandardMaterial
                        color={`hsl(${210 + ((index * 30) % 360)}, 70%, 60%)`}
                      />
                    </mesh>
                  </AutoRotate>

                  <Text
                    position={[0, -0.8, 0]}
                    fontSize={0.4}
                    color="#475569"
                    font="/NanumGothic-Bold.json"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {timeData.timeRange}
                  </Text>

                  <Text
                    position={[0, -1.4, 0]}
                    fontSize={0.3}
                    color="#475569"
                    font="/NanumGothic-Bold.json"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {dayData.date}
                  </Text>
                  <Text
                    position={[0, height + 0.5, 0]}
                    fontSize={0.4}
                    color="#1e293b"
                    font="/NanumGothic-Bold.json"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {`$${timeData.amount.toLocaleString()}`}
                  </Text>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

const PaymentTypeVisual = React.memo(
  ({ data }: { data: PaymentTypeData | undefined }) => {
    if (!data || !data.typeAndDetail) return null;

    const colors = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6"];
    const [activeSection, setActiveSection] = useState<number | null>(null);

    // 초기 위치 설정을 위한 ref
    const groupRef = useRef<THREE.Group>(null);

    useEffect(() => {
      if (groupRef.current) {
        groupRef.current.position.set(0, 0, 0);
      }
    }, []);

    return (
      <group ref={groupRef}>
        <Text
          position={[0, 3, 0]}
          fontSize={0.4}
          color="#1e293b"
          font="/NanumGothic-Bold.json"
          anchorX="center"
          anchorY="middle"
        >
          Sales Analysis by Payment Method
        </Text>

        {data.typeAndDetail.map((payment, index) => {
          const spacing = 3;
          const xPos =
            index * spacing - ((data.typeAndDetail.length - 1) * spacing) / 2;
          const ratio = parseFloat(payment.ratio) / 100;
          const height = ratio * 4;

          return (
            <group key={index} position={[xPos, -2, 0]}>
              <AutoRotate>
                <mesh
                  position={[0, height / 2, 0]}
                  scale={activeSection === index ? 1.1 : 1}
                  onPointerOver={() => setActiveSection(index)}
                  onPointerOut={() => setActiveSection(null)}
                >
                  <boxGeometry args={[1.2, height, 1.2]} />
                  <meshStandardMaterial color={colors[index % colors.length]} />
                </mesh>
              </AutoRotate>

              <Text
                position={[0, -0.5, 0]}
                fontSize={0.3}
                color="#1e293b"
                font="/NanumGothic-Bold.json"
                anchorX="center"
                anchorY="middle"
              >
                {payment.type}
              </Text>

              <Text
                position={[0, height + 0.3, 0]}
                fontSize={0.3}
                color="#1e293b"
                font="/NanumGothic-Bold.json"
                anchorX="center"
                anchorY="middle"
              >
                {`${payment.ratio}%`}
              </Text>

              <Text
                position={[0, height + 0.7, 0]}
                fontSize={0.25}
                color="#475569"
                font="/NanumGothic-Bold.json"
                anchorX="center"
                anchorY="middle"
              >
                {`$${payment.amount.toLocaleString()}`}
              </Text>

              {activeSection === index && (
                <Html position={[0, height + 1.2, 0]}>
                  <div className="bg-white p-2 rounded shadow-lg">
                    <strong>{payment.type}</strong>
                    <p>Amount: ${payment.amount.toLocaleString()}</p>
                    <p>Ratio: {payment.ratio}%</p>
                  </div>
                </Html>
              )}
            </group>
          );
        })}

        <Text
          position={[0, -3, 0]}
          fontSize={0.4}
          color="#1e293b"
          font="/NanumGothic-Bold.json"
          anchorX="center"
          anchorY="middle"
        >
          {`Total: $${data.totalAmount.toLocaleString()}`}
        </Text>
      </group>
    );
  }
);

PaymentTypeVisual.displayName = "PaymentTypeVisual";

const CameraControls = React.memo(() => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix(); // 카메라 업데이트 추가
    }

    // cleanup 함수 추가
    return () => {
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.5}
      makeDefault // 이 컨트롤을 기본으로 설정
    />
  );
});

CameraControls.displayName = "CameraControls";

type AnalysisType =
  | "average"
  | "categories"
  | "peakTime"
  | "paymentType"
  | null;

export default function ManagementPage() {
  const router = useRouter();
  const { storeId } = useFormStore();
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  // States for date pickers and query
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [queryStartDate, setQueryStartDate] = useState<Date | null>(null);
  const [queryEndDate, setQueryEndDate] = useState<Date | null>(null);
  // 현재 활성화된 분석 타입을 트래킹하기 위한 추가 상태
  const [prevAnalysisType, setPrevAnalysisType] = useState<AnalysisType>(null);
  // 위치 고정을 위한 상태 변수 추가
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setFontLoaded(true);
  }, []);

  const handleSearch = useCallback(() => {
    setQueryStartDate(selectedStartDate);
    setQueryEndDate(selectedEndDate);
  }, [selectedStartDate, selectedEndDate]);

  const fetchAverageValue = useCallback(async (): Promise<AverageValueData> => {
    const response = await axiosInstance.get(
      `/api/reports/average?storeId=${storeId}`
    );
    return response.data;
  }, [storeId]);

  const fetchCategories = useCallback(async (): Promise<CategoryData[]> => {
    const response = await axiosInstance.get(
      `/api/reports/categories?storeId=${storeId}`
    );
    return response.data;
  }, [storeId]);

  const fetchPeakTime = useCallback(
    async (startDate?: string, endDate?: string): Promise<PeakTimeData[]> => {
      let url = `/api/reports/peak-time?storeId=${storeId}`;
      if (startDate) {
        url += `&startDate=${startDate}`;
      }
      if (endDate) {
        url += `&endDate=${endDate}`;
      }
      const response = await axiosInstance.get(url);
      return response.data;
    },
    [storeId]
  );

  const fetchPaymentType = useCallback(async (): Promise<PaymentTypeData> => {
    const response = await axiosInstance.get(
      `/api/reports/payment-type?storeId=${storeId}`
    );
    return response.data;
  }, [storeId]);

  const { data: averageData } = useQuery<AverageValueData>({
    queryKey: ["average", storeId],
    queryFn: fetchAverageValue,
    enabled: !!storeId && analysisType === "average",
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const { data: categoriesData } = useQuery<CategoryData[]>({
    queryKey: ["categories", storeId],
    queryFn: fetchCategories,
    enabled: !!storeId && analysisType === "categories",
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const { data: peakTimeData } = useQuery<PeakTimeData[]>({
    queryKey: ["peakTime", storeId, queryStartDate, queryEndDate],
    queryFn: () =>
      fetchPeakTime(
        queryStartDate?.toISOString().split("T")[0],
        queryEndDate?.toISOString().split("T")[0]
      ),
    enabled: !!storeId && analysisType === "peakTime",
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const { data: paymentTypeData } = useQuery<PaymentTypeData>({
    queryKey: ["paymentType", storeId],
    queryFn: fetchPaymentType,
    enabled: !!storeId && analysisType === "paymentType",
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // 분석 타입 변경 함수 - 메모이제이션
  const handleAnalysisChange = useCallback(
    (type: AnalysisType) => {
      if (type === analysisType) return;

      setIsTransitioning(true);

      // 타입 직접 변경 (null로 설정하지 않음)
      setTimeout(() => {
        setAnalysisType(type);

        if (type === "peakTime") {
          setQueryStartDate(null);
          setQueryEndDate(null);
          setSelectedStartDate(null);
          setSelectedEndDate(null);
        }

        // 트랜지션 상태 해제
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 300);
    },
    [analysisType]
  );

  // 카메라 포지션 계산 - 메모이제이션
  const getCameraPosition = useCallback(
    (analysisType: AnalysisType): [number, number, number] => {
      const basePosition: [number, number, number] = [0, 0, 8];
      const angleOffset = THREE.MathUtils.degToRad(300);

      switch (analysisType) {
        case "average":
          return [
            basePosition[0] - 2 * Math.sin(angleOffset),
            basePosition[1] + 2,
            basePosition[2] + 5 * Math.cos(angleOffset),
          ];
        case "categories":
          return [
            basePosition[0] - 2 * Math.sin(angleOffset),
            basePosition[1] + 2,
            basePosition[2] + 6 * Math.cos(angleOffset),
          ];
        case "peakTime":
          return [
            basePosition[0] - 2 * Math.sin(angleOffset),
            basePosition[1] + 1,
            basePosition[2] + 6 * Math.cos(angleOffset),
          ];
        case "paymentType":
          return [
            basePosition[0] - 2 * Math.sin(angleOffset),
            basePosition[1] + 0,
            basePosition[2] + 7 * Math.cos(angleOffset),
          ];
        default:
          return [
            basePosition[0] - 2 * Math.sin(angleOffset),
            basePosition[1] + 0,
            basePosition[2] + 5 * Math.cos(angleOffset),
          ];
      }
    },
    []
  );

  // Three.js 렌더러 설정 - 메모이제이션
  const rendererConfig = useMemo(
    () => ({
      powerPreference: "high-performance" as WebGLPowerPreference,
      antialias: true,
      preserveDrawingBuffer: true,
    }),
    []
  );

  // Updated getButtonClass to be more responsive
  const getButtonClass = useCallback(
    (type: AnalysisType) => {
      return `rounded ${
        type === "paymentType" ? "w-full" : "w-full sm:w-60 sm:h-12 sm:text-sm"
      } ${type === "categories" || type === "paymentType" ? "py-0" : "py-0"} ${
        type === "peakTime" ? "px-2" : ""
      } ${
        analysisType === type
          ? "bg-blue-500 border-none sm:w-60 text-white font-bold"
          : "bg-gray-200 sm:w-60 hover:bg-gray-300"
      } transition-all`;
    },
    [analysisType]
  );

  return (
    <div className="flex items-center font-mono justify-center min-h-screen w-full relative p-2 sm:p-4">
      <div className="relative w-full max-w-7xl h-[85vh] bg-white bg-opacity-20 border border-gray-400 rounded-2xl flex flex-col md:flex-row overflow-hidden">
        <div className="w-3/4 h-full bg-gray-50 flex flex-col">
          <div className="flex-grow relative">
            <AnimatePresence mode="sync">
              {analysisType && fontLoaded && (
                <motion.div
                  key={analysisType}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.3 },
                  }}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    transformOrigin: "center center",
                  }}
                  className="w-full h-full"
                >
                  <Canvas
                    style={{ height: "100%" }}
                    camera={{
                      fov: 60,
                      position: getCameraPosition(analysisType),
                    }}
                    onCreated={({ camera }) => {
                      camera.lookAt(0, 0, 0);
                      camera.updateProjectionMatrix();
                    }}
                    gl={rendererConfig}
                    dpr={[1, 2]} // 반응형 해상도 설정
                    frameloop="always" // 필요할 때만 렌더링
                  >
                    <ambientLight intensity={0.6} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <spotLight
                      position={[0, 5, 10]}
                      angle={0.3}
                      penumbra={1}
                      intensity={1}
                    />
                    <CameraControls />

                    {analysisType === "average" && (
                      <AverageValueVisual data={averageData} />
                    )}
                    {analysisType === "categories" && (
                      <CategoryVisual data={categoriesData} />
                    )}
                    {analysisType === "peakTime" && (
                      <PeakTimeVisual
                        data={peakTimeData}
                        isDateSearched={!!(queryStartDate || queryEndDate)}
                      />
                    )}
                    {analysisType === "paymentType" && (
                      <PaymentTypeVisual data={paymentTypeData} />
                    )}
                  </Canvas>
                </motion.div>
              )}
            </AnimatePresence>

            {!analysisType && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="text-xl mb-2">Please select an analysis type</p>
                  <p>Click on any option in the right menu</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 right-4 bg-white bg-opacity-70 p-2 rounded text-xs">
              <p>Tip: Drag to rotate, scroll to zoom, right-click to pan</p>
            </div>
          </div>

          <AnimatePresence>
            {analysisType === "peakTime" && (
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute w-4/5 p-2 bg-transparent z-10"
              >
                <div className="flex justify-center gap-2">
                  <DatePicker
                    selected={selectedStartDate}
                    onChange={(date: Date | null) => setSelectedStartDate(date)}
                    selectsStart
                    startDate={selectedStartDate}
                    endDate={selectedEndDate}
                    placeholderText="Start Date"
                    className="border py-1 rounded text-center"
                  />
                  <DatePicker
                    selected={selectedEndDate}
                    onChange={(date: Date | null) => setSelectedEndDate(date)}
                    selectsEnd
                    startDate={selectedStartDate}
                    endDate={selectedEndDate}
                    minDate={selectedStartDate ? selectedStartDate : undefined}
                    placeholderText="End Date"
                    className="border py-1 rounded text-center"
                  />
                  <button
                    className="bg-blue-500 text-white px-4 text-sm rounded"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col p-4 items-center justify-between w-1/4 bg-white">
          <div className="flex flex-row w-full gap-1 px-2">
            <SquareChartGantt className="mt-1 text-gray-700" />
            <span className="font-sans text-2xl text-left font-semibold text-gray-800">
              Management
            </span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="flex text-gray-700 border-b border-gray-300 mb-8 w-full p-1 pl-2 text-center">
              Details
            </p>
            <div className="flex flex-col">
              <div className="flex flex-col justify-center px-2 items-center gap-3 mb-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={getButtonClass("average")}
                  onClick={() => handleAnalysisChange("average")}
                >
                  Average Order Value
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={getButtonClass("categories")}
                  onClick={() => handleAnalysisChange("categories")}
                >
                  Sales Analysis by Category
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={getButtonClass("peakTime")}
                  onClick={() => handleAnalysisChange("peakTime")}
                >
                  Sales Analysis by Time
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={getButtonClass("paymentType")}
                  onClick={() => handleAnalysisChange("paymentType")}
                >
                  Sales Analysis by Payment Method
                </motion.button>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center items-center gap-2 my-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gray-200 rounded w-60 py-5 px-2 hover:bg-gray-300"
              onClick={() => router.push("/setting")}
            >
              Back
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
