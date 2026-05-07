"use client";

import dynamic from "next/dynamic";

const ScrollScene = dynamic(() => import("@/components/3d/ScrollScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg-dark" />,
});

export default function ScrollSceneSection() {
  return (
    <section className="relative h-[50vh] w-full bg-bg-dark overflow-hidden">
      <div className="absolute inset-0">
        <ScrollScene />
      </div>
      <div className="relative z-10 h-full flex items-center justify-center pointer-events-none">
        <p className="text-xs font-mono tracking-widest text-text-muted uppercase opacity-50">
          scroll
        </p>
      </div>
    </section>
  );
}
