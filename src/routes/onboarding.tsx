import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/ui-fs/Logo";
import { Camera, Receipt, Barcode } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome to FridgeSpy" }] }),
  component: Onboarding,
});

const slides = [
  {
    title: "Stop Throwing Money Away",
    body: "The average American family wastes $1,500 on food per year. FridgeSpy fixes that.",
    visual: <div className="text-7xl">💸</div>,
  },
  {
    title: "Three Ways to Track",
    body: null,
    visual: (
      <div className="grid grid-cols-1 gap-3 text-left">
        <Row icon={<Receipt size={20} />} title="Snap Receipt" sub="Claude reads it for you." />
        <Row icon={<Camera size={20} />} title="Scan Fridge" sub="AI sees what's on the shelf." />
        <Row icon={<Barcode size={20} />} title="Scan Barcode" sub="Auto-fill from OpenFoodFacts." />
      </div>
    ),
  },
  {
    title: "Get Started",
    body: "Create your kitchen in 10 seconds.",
    visual: <div className="text-7xl">🥬</div>,
  },
];

function Row({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <span className="rounded-xl bg-primary/15 p-2 text-primary">{icon}</span>
      <div><div className="font-semibold">{title}</div><div className="text-xs text-muted-foreground">{sub}</div></div>
    </div>
  );
}

function Onboarding() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const slide = slides[i];
  const isLast = i === slides.length - 1;

  return (
    <div className="flex min-h-screen flex-col px-6 pt-[max(env(safe-area-inset-top),3rem)] pb-10">
      <div className="flex justify-center"><Logo /></div>

      <div className="flex flex-1 flex-col items-center justify-center text-center fade-in">
        <div className="mb-8">{slide.visual}</div>
        <h1 className="text-3xl font-extrabold tracking-tight">{slide.title}</h1>
        {slide.body && <p className="mt-3 max-w-xs text-muted-foreground">{slide.body}</p>}
      </div>

      <div className="mb-6 flex justify-center gap-1.5">
        {slides.map((_, idx) => (
          <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />
        ))}
      </div>

      <button
        onClick={() => isLast ? navigate({ to: "/login" }) : setI(i + 1)}
        className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20"
      >
        {isLast ? "Get Started" : "Continue"}
      </button>
      {!isLast && (
        <button onClick={() => navigate({ to: "/login" })} className="mt-3 text-center text-sm text-muted-foreground">
          Skip
        </button>
      )}
    </div>
  );
}
