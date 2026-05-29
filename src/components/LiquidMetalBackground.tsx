import { useEffect, useState } from "react";
import { LiquidMetal } from "@paper-design/shaders-react";

/**
 * Global animated background — Paper Shaders "Liquid Metal" tuned to the
 * FridgeSpy royal-blue palette. Renders client-only behind all content.
 * Falls back to the CSS radial gradient on SSR and prefers-reduced-motion.
 */
export function LiquidMetalBackground() {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMounted(true);
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="liquid-metal-bg" aria-hidden="true">
      {mounted && !reduced && (
        <LiquidMetal
          style={{ width: "100%", height: "100%" }}
          colorBack="#0a0f1c"
          colorTint="#1d4ed8"
          repetition={3}
          softness={0.55}
          shiftRed={0.25}
          shiftBlue={0.45}
          distortion={0.25}
          contour={0.45}
          shape="circle"
          offsetX={0}
          offsetY={0}
          scale={0.85}
          speed={0.4}
        />
      )}
    </div>
  );
}
