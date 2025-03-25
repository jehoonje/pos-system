"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormStore } from "@/store/formStore";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import { SquareChartGantt } from "lucide-react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Html, OrbitControls } from "@react-three/drei";
import _ from "lodash";

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

function AverageValueVisual({ data }: { data: AverageValueData | undefined }) {
  if (!data) return null;

  const [hover, setHover] = useState(false);
  const [rotate, setRotate] = useState(false);
  const cylinderRef = useRef<THREE.Mesh>(null);
  const baseRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (baseRef.current && rotate) {
      baseRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <mesh
        ref={cylinderRef}
        position={[0, -2, -2]}
        scale={hover ? 1.1 : 1}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onClick={() => setRotate(!rotate)}
      >
        <cylinderGeometry args={[2, 2, 0.3, 32]} />
        <meshStandardMaterial color={hover ? "#ffffff" : "#e2e8f0"} />
      </mesh>

      <mesh ref={baseRef} position={[0, -1.5, -2]}>
        <cylinderGeometry args={[1.5, 1.8, 0.5, 32]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      <Text
        position={[0, 2.5, 0]}
        fontSize={0.8}
        color="white"
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

      {hover && (
        <Html position={[0, 1.5, 0]}>
          <div className="bg-white p-2 rounded shadow-lg text-sm">
            <strong>Average Order Value</strong>
            <p>${data.averageValue.toLocaleString()}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

function CategoryVisual({ data }: { data: CategoryData[] | undefined }) {
  if (!data || data.length === 0) return null;

  const colors = ["#fcd34d", "#f87171", "#60a5fa", "#4ade80", "#a78bfa"];
  const total = data.reduce((sum, item) => sum + item.totalSales, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const barRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    barRefs.current = Array(data.length).fill(null);
  }, [data.length]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    barRefs.current.forEach((mesh, index) => {
      if (mesh && activeIndex !== index) {
        mesh.position.y = Math.sin(time * 0.5 - index) * 0.1 - 0.5;
      }
    });
  });

  return (
    <group>
      {data.map((category, index) => {
        const spacing = 2.5;
        const totalWidth = (data.length - 1) * spacing;
        const xPos = index * spacing - totalWidth / 2;
        const ratio = category.totalSales / total;
        const height = ratio * 3;

        return (
          <group key={index} position={[xPos, 0, 0]}>
            <mesh
              ref={(mesh) => {
                barRefs.current[index] = mesh;
              }}
              position={[0, 0, 0]}
              scale={activeIndex === index ? 1.1 : 1}
              onPointerOver={() => setActiveIndex(index)}
              onPointerOut={() => setActiveIndex(null)}
            >
              <boxGeometry args={[1, height, 1]} />
              <meshStandardMaterial color={colors[index % colors.length]} />
            </mesh>

            <Text
              position={[0, height - 3.3, 2]}
              fontSize={0.3}
              color="#1e293b"
              font="/NanumGothic-Bold.json"
              anchorX="center"
              anchorY="middle"
            >
              {`${category.categoryName} (${category.ratio})`}
            </Text>

            <Text
              position={[0, height - 0.5, 0]}
              fontSize={0.5}
              color="#475569"
              font="/NanumGothic-Bold.json"
              anchorX="center"
              anchorY="middle"
            >
              {`$${category.totalSales.toLocaleString()}`}
            </Text>

            {activeIndex === index && (
              <Html position={[0, height + 1.2, 0]}>
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

function PeakTimeVisual({ data }: { data: PeakTimeData[] | undefined }) {
  if (!data || data.length === 0) return null;

  const latestDay = data[0];
  const maxAmount = Math.max(...latestDay.detail.map((item) => item.amount));
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const barRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    barRefs.current = Array(latestDay.detail.length).fill(null);
  }, [latestDay.detail.length]);

  return (
    <group>
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.4}
        color="#1e293b"
        font="/NanumGothic-Bold.json"
        anchorX="center"
        anchorY="middle"
      >
        {`${latestDay.date} Peak Time Analysis`}
      </Text>

      {latestDay.detail.map((timeData, index) => {
        const spacing = 1.2;
        const totalWidth = (latestDay.detail.length - 1) * spacing;
        const xPos = index * spacing - totalWidth / 2;
        const height = (timeData.amount / maxAmount) * 2;

        return (
          <group key={index} position={[xPos, 0, 0]}>
            <mesh
              ref={(mesh) => {
                barRefs.current[index] = mesh;
              }}
              position={[0, height / 2, 0]}
              scale={activeBar === index ? [1.1, 1, 1.1] : 1}
              onPointerOver={() => setActiveBar(index)}
              onPointerOut={() => setActiveBar(null)}
            >
              <boxGeometry args={[0.8, height, 0.8]} />
              <meshStandardMaterial
                color={`hsl(${210 + index * 30}, 70%, 60%)`}
              />
            </mesh>

            <Text
              position={[0, -0.3, 0]}
              fontSize={0.25}
              color="#475569"
              font="/NanumGothic-Bold.json"
              anchorX="center"
              anchorY="middle"
            >
              {timeData.timeRange}
            </Text>

            <Text
              position={[0, height + 0.3, 0]}
              fontSize={0.25}
              color="#1e293b"
              font="/NanumGothic-Bold.json"
              anchorX="center"
              anchorY="middle"
            >
              {`$${timeData.amount.toLocaleString()}`}
            </Text>

            {activeBar === index && (
              <Html position={[0, height + 0.8, 0]}>
                <div className="bg-white p-2 rounded shadow-lg">
                  <strong>{timeData.timeRange}</strong>
                  <p>Sales: ${timeData.amount.toLocaleString()}</p>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function PaymentTypeVisual({ data }: { data: PaymentTypeData | undefined }) {
  if (!data || !data.typeAndDetail) return null;

  const colors = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6"];
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y =
        Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Text
        position={[0, 2, 0]}
        fontSize={0.4}
        color="#1e293b"
        font="/NanumGothic-Bold.json"
        anchorX="center"
        anchorY="middle"
      >
        Sales Analysis by Payment Method
      </Text>

      {data.typeAndDetail.map((payment, index) => {
        const spacing = 2;
        const xPos =
          index * spacing - ((data.typeAndDetail.length - 1) * spacing) / 2;
        const ratio = parseFloat(payment.ratio) / 100;
        const height = ratio * 4;

        return (
          <group key={index} position={[xPos, -2, 0]}>
            <mesh
              position={[0, height / 2, 0]}
              scale={activeSection === index ? 1.1 : 1}
              onPointerOver={() => setActiveSection(index)}
              onPointerOut={() => setActiveSection(null)}
            >
              <boxGeometry args={[1.5, height, 1]} />
              <meshStandardMaterial color={colors[index % colors.length]} />
            </mesh>

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

function CameraControls() {
  const { camera } = useThree();
  const controlsRef = useRef<any>();

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.5}
    />
  );
}

type AnalysisType =
  | "average"
  | "categories"
  | "peakTime"
  | "paymentType"
  | null;

export default function OrderPage() {
  const router = useRouter();
  const { storeId } = useFormStore();
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    setFontLoaded(true);
  }, []);

  const fetchAverageValue = async (): Promise<AverageValueData> => {
    const response = await axiosInstance.get(
      `/api/reports/average?storeId=${storeId}`
    );
    return response.data;
  };

  const fetchCategories = async (): Promise<CategoryData[]> => {
    const response = await axiosInstance.get(
      `/api/reports/categories?storeId=${storeId}`
    );
    return response.data;
  };

  const fetchPeakTime = async (): Promise<PeakTimeData[]> => {
    const response = await axiosInstance.get(
      `/api/reports/peak-time?storeId=${storeId}`
    );
    return response.data;
  };

  const fetchPaymentType = async (): Promise<PaymentTypeData> => {
    const response = await axiosInstance.get(
      `/api/reports/payment-type?storeId=${storeId}`
    );
    return response.data;
  };

  const { data: averageData } = useQuery<AverageValueData>({
    queryKey: ["average", storeId],
    queryFn: fetchAverageValue,
    enabled: !!storeId && analysisType === "average",
  });

  const { data: categoriesData } = useQuery<CategoryData[]>({
    queryKey: ["categories", storeId],
    queryFn: fetchCategories,
    enabled: !!storeId && analysisType === "categories",
  });

  const { data: peakTimeData } = useQuery<PeakTimeData[]>({
    queryKey: ["peakTime", storeId],
    queryFn: fetchPeakTime,
    enabled: !!storeId && analysisType === "peakTime",
  });

  const { data: paymentTypeData } = useQuery<PaymentTypeData>({
    queryKey: ["paymentType", storeId],
    queryFn: fetchPaymentType,
    enabled: !!storeId && analysisType === "paymentType",
  });

  const handleAnalysisChange = (type: AnalysisType) => {
    setAnalysisType(type);
  };

  const getCameraPosition = (
    analysisType: AnalysisType
  ): [number, number, number] => {
    const basePosition: [number, number, number] = [0, 0, 8]; // 기본 위치를 더 멀리 설정
    const angleOffset = THREE.MathUtils.degToRad(300); // 3도를 라디안으로 변환

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
  };

  return (
    <div className="flex items-center font-mono justify-center h-screen w-screen relative">
      <div className="relative w-4/5 h-4/5 bg-white bg-opacity-20 border border-gray-400 rounded-2xl flex overflow-hidden">
        <div className="w-3/4 h-full bg-gray-50 relative">
          {analysisType && fontLoaded && (
            <div className="w-full h-full">
              <Canvas
                camera={{ fov: 60, position: getCameraPosition(analysisType) }}
                onCreated={({ camera }) => {
                  camera.lookAt(0, 0, 0);
                }}
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
                  <PeakTimeVisual data={peakTimeData} />
                )}
                {analysisType === "paymentType" && (
                  <PaymentTypeVisual data={paymentTypeData} />
                )}
              </Canvas>

              <div className="absolute bottom-4 right-4 bg-white bg-opacity-70 p-2 rounded text-xs">
                <p>Tip: Drag to rotate, scroll to zoom, right-click to pan</p>
                <p>Hover over elements for details</p>
              </div>
            </div>
          )}

          {!analysisType && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-xl mb-2">Please select an analysis type</p>
                <p>Click on any option in the right menu</p>
              </div>
            </div>
          )}

          {analysisType && (
            <div className="absolute top-4 left-4 bg-white bg-opacity-70 p-2 rounded-lg z-10">
              <h2 className="text-xl font-semibold text-gray-800">
                {analysisType === "average" && "Average Order Value"}
                {analysisType === "categories" && "Sales Analysis by Category"}
                {analysisType === "peakTime" && "Sales Analysis by Time"}
                {analysisType === "paymentType" && ""}
              </h2>
            </div>
          )}
        </div>

        <div className="flex flex-col p-4 items-center justify-between w-1/4 bg-white">
          <div className="flex flex-row w-full gap-1 px-2">
            <SquareChartGantt className="mt-1 text-gray-700" />
            <span className="font-sans text-2xl text-left font-semibold text-gray-800">
              Management
            </span>
          </div>
          <div className="flex flex-col items-center justify-center mb-20">
            <p className="flex text-gray-700 border-b border-gray-300 mb-4 w-full p-1 pl-2 text-center">
              Details
            </p>
            <div className="flex flex-col">
              <div className="flex flex-col justify-center items-center gap-2 mb-4">
                <button
                  className={`rounded w-full py-4 ${
                    analysisType === "average"
                      ? "bg-blue-100 border border-blue-400"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => handleAnalysisChange("average")}
                >
                  Average Order Value
                </button>
                <button
                  className={`rounded w-full py-4 ${
                    analysisType === "categories"
                      ? "bg-blue-100 border border-blue-400"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => handleAnalysisChange("categories")}
                >
                  Sales Analysis by Category
                </button>
                <button
                  className={`rounded w-full py-4 ${
                    analysisType === "peakTime"
                      ? "bg-blue-100 border border-blue-400"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => handleAnalysisChange("peakTime")}
                >
                  Sales Analysis by Time
                </button>
                <button
                  className={`rounded w-full py-4 ${
                    analysisType === "paymentType"
                      ? "bg-blue-100 border border-blue-400"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => handleAnalysisChange("paymentType")}
                >
                  Sales Analysis by Payment Method
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center items-center gap-2 my-2">
            <button
              className="bg-gray-200 rounded py-4 w-full hover:bg-gray-300"
              onClick={() => router.push("/setting")}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
