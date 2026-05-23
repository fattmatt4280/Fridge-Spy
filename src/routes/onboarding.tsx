import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui-fs/Logo";
import { Camera, Receipt, Barcode, ArrowRight } from "lucide-react";
import { ScoreRing } from "@/components/ScoreRing";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome to FridgeSpy" }] }),
  component: Onboarding,
});

const ONBOARD_KEY = "fridgespy.onboarded";

function Onboarding() {
  const [i, setI] = useState(0);
  const [ringScore, setRingScore] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ONBOARD_KEY)) {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (i === 2) {
      const t = setTimeout(() => setRingScore(95), 200);
      return () => clearTimeout(t);
    } else {
      setRingScore(0);
    }
  }, [i]);

  const finish = (dest: "/login" | "/") => {
    try { localStorage.setItem(ONBOARD_KEY, "1"); } catch {}
    // Best-effort notification permission request
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      try { Notification.requestPermission().catch(() => {}); } catch {}
    }
    navigate({ to: dest, replace: true });
  };

  const isLast = i === 2;

  return (
    <div className="relative flex min-h-screen flex-col px-6 pb-10 pt-[max(env(safe-area-inset-top),3rem)]">
      {/* Skip top-right on slides 1 & 2 */}
      {!isLast && (
        <button
          onClick={() => finish("/login")}
          className="absolute right-5 top-[max(env(safe-area-inset-top),1.5rem)] rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Skip
        </button>
      )}

      <div className="flex justify-center"><Logo /></div>

      <div className="flex flex-1 flex-col items-center justify-center text-center fade-in" key={i}>
        {i === 0 && <Slide1 />}
        {i === 1 && <Slide2 />}
        {i === 2 && <Slide3 score={ringScore} />}
      </div>

      <div className="mb-6 flex justify-center gap-1.5">
        {[0,1,2].map(idx => (
          <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />
        ))}
      </div>

      {isLast ? (
        <div className="space-y-3">
          <button
            onClick={() => finish("/login")}
            className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.99]"
          >
            Create Account
          </button>
          <button
            onClick={() => finish("/")}
            className="w-full rounded-xl border border-border bg-surface py-4 text-base font-semibold text-foreground transition active:scale-[0.99]"
          >
            Try as Guest
          </button>
        </div>
      ) : (
        <button
          onClick={() => setI(i + 1)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.99]"
        >
          Continue <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
}

function Slide1() {
  return (
    <>
      <div className="relative mb-6 flex h-32 items-center justify-center">
        <div className="absolute h-32 w-32 animate-ping rounded-full bg-primary/10" />
        <div className="relative text-7xl">💸</div>
      </div>
      <div className="text-xs font-bold uppercase tracking-widest text-primary">Stop the waste</div>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">Stop Throwing Money Away</h1>
      <div className="mt-5 text-5xl font-extrabold tracking-tight text-primary tabular-nums">$1,500</div>
      <p className="mt-1 max-w-xs text-xs uppercase tracking-wider text-muted-foreground">average annual food waste per American household</p>
      <p className="mt-5 max-w-xs text-base font-semibold">FridgeSpy fixes that.</p>
    </>
  );
}

function Slide2() {
  const cards = [
    { icon: <Receipt size={20} />, emoji: "📷", title: "Snap Receipt", sub: "Photo your grocery receipt — we add everything automatically" },
    { icon: <Camera size={20} />, emoji: "📸", title: "Scan Fridge", sub: "Point at your fridge — AI identifies what's inside" },
    { icon: <Barcode size={20} />, emoji: "🔍", title: "Scan Barcode", sub: "Scan any item in seconds" },
  ];
  return (
    <>
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Three Ways to Track</h1>
      <div className="w-full max-w-sm space-y-3">
        {cards.map((c, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left fade-in"
            style={{ animationDelay: `${idx * 120}ms`, animationFillMode: "both" }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-2xl">{c.emoji}</span>
            <div className="min-w-0">
              <div className="font-bold">{c.title}</div>
              <div className="text-xs text-muted-foreground">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Slide3({ score }: { score: number }) {
  return (
    <>
      <div className="mb-5">
        <ScoreRing score={score} size={150} stroke={12} animate />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">Never Waste Food Again</h1>
      <p className="mt-3 max-w-xs text-sm text-muted-foreground">
        Track your kitchen. Cook smarter. Save money.
      </p>
    </>
  );
}
