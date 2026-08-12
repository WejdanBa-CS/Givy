"use client";

import dynamic from "next/dynamic";

const FigmaGivyApp = dynamic(() => import("@/components/FigmaGivyApp"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center bg-[#FEF6EE] text-[#8A6F5E]">
      Loading givy…
    </div>
  ),
});

export default function HomePage() {
  return <FigmaGivyApp />;
}
