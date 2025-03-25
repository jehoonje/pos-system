import dynamic from "next/dynamic";

const MagangementPage = dynamic(() => import("@/components/MagangementPage"), { ssr: false });

export default function Page() {
  return <MagangementPage />;
}