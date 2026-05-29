import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui-fs/Logo";
import { Camera, Receipt, Barcode, ArrowRight } from "lucide-react";
import { ScoreRing } from "@/components/ScoreRing";
import { CuisinePicker, DietaryEditor, EMPTY_PROFILE, type CookingProfile } from "@/components/CookingProfileEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome to FridgeSpy" },
      { name: "description", content: "Set up your FridgeSpy account in a minute. Tell us what you cook, what to avoid, and we'll personalize recipes and alerts to you." },
      { property: "og:title", content: "Get started with FridgeSpy" },
      { property: "og:description", content: "Set up your kitchen and cooking preferences in a minute." },
      { property: "og:url", content: "https://fridgespy.com/onboarding" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/onboarding" }],
  }),
  component: Onboarding,
});

const ONBOARD_KEY = "fridgespy.onboarded";
const PREFS_KEY = "fridgespy.pending_prefs";
const SLIDE_COUNT = 5;

function Onboarding() {
  const [i, setI] = useState(0);
  const [ringScore, setRingScore] = useState(0);
  const [profile, setProfile] = useState<CookingProfile>(EMPTY_PROFILE);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ONBOARD_KEY)) {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (i === SLIDE_COUNT - 1) {
      const t = setTimeout(() => setRingScore(95), 200);
      return () => clearTimeout(t);
    } else {
      setRingScore(0);
    }
  }, [i]);

  async function savePrefs() {
    // If user already signed in (rare on onboarding), persist now. Otherwise
    // stash for login.tsx / post-signup to pick up.
    try {
      if (user) {
        await supabase.from("profiles").update(profile).eq("user_id", user.id);
      } else {
        localStorage.setItem(PREFS_KEY, JSON.stringify(profile));
      }
    } catch {}
  }

  const finish = async (dest: "/login" | "/app") => {
    await savePrefs();
    try {
      localStorage.setItem(ONBOARD_KEY, "1");
      if (dest === "/app") localStorage.setItem("fridgespy.guest", "1");
    } catch {}
    navigate({ to: dest, replace: true });
  };

  const isLast = i === SLIDE_COUNT - 1;

  return (
    <div className="relative flex min-h-screen flex-col px-6 pb-10 pt-[max(env(safe-area-inset-top),3rem)]">
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
        {i === 2 && <SlideCuisines profile={profile} setProfile={setProfile} />}
        {i === 3 && <SlideDietary profile={profile} setProfile={setProfile} />}
        {i === 4 && <Slide3 score={ringScore} />}
      </div>

      <div className="mb-6 flex justify-center gap-1.5">
        {Array.from({ length: SLIDE_COUNT }).map((_, idx) => (
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
            onClick={() => finish("/app")}
            className="w-full rounded-xl border border-border bg-surface py-4 text-base font-semibold text-foreground transition active:scale-[0.99]"
          >
            Try as Guest
          </button>
          <p className="pt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
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
      <p className="mt-0.5 text-[10px] text-muted-foreground/70">Source: USDA</p>
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

function SlideCuisines({ profile, setProfile }: { profile: CookingProfile; setProfile: (p: CookingProfile) => void }) {
  return (
    <div className="w-full max-w-sm text-left">
      <div className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-primary">Tell us what you cook</div>
      <h1 className="mb-5 text-center text-2xl font-extrabold tracking-tight">What do you love to cook?</h1>
      <div className="space-y-6">
        <CuisinePicker
          title="Cuisines I love"
          subtitle="Pick any you reach for often."
          value={profile.cuisines_liked}
          onChange={v => setProfile({ ...profile, cuisines_liked: v })}
        />
        <CuisinePicker
          title="Want to learn"
          subtitle="We'll sneak in a new dish from these now and then."
          value={profile.cuisines_learning}
          onChange={v => setProfile({ ...profile, cuisines_learning: v })}
        />
      </div>
    </div>
  );
}

function SlideDietary({ profile, setProfile }: { profile: CookingProfile; setProfile: (p: CookingProfile) => void }) {
  return (
    <div className="w-full max-w-sm text-left">
      <div className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-primary">A few specifics</div>
      <h1 className="mb-5 text-center text-2xl font-extrabold tracking-tight">Anything to avoid?</h1>
      <DietaryEditor profile={profile} onChange={setProfile} />
    </div>
  );
}

function Slide3({ score }: { score: number }) {
  const [notifAsked, setNotifAsked] = useState(false);
  const canAskNotif = typeof window !== "undefined" && "Notification" in window && Notification.permission === "default";

  async function askNotif() {
    setNotifAsked(true);
    try { await Notification.requestPermission(); } catch {}
  }

  return (
    <>
      <div className="mb-5">
        <ScoreRing score={score} size={150} stroke={12} animate />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">Never Waste Food Again</h1>
      <p className="mt-3 max-w-xs text-sm text-muted-foreground">
        Track your kitchen. Cook smarter. Save money.
      </p>

      {canAskNotif && !notifAsked && (
        <div className="mt-6 w-full max-w-sm rounded-2xl border border-border bg-surface p-4 text-left">
          <div className="text-sm font-bold">Get a heads-up before food expires?</div>
          <p className="mt-1 text-xs text-muted-foreground">
            We'll only notify you about items about to go bad. You can turn this off anytime.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setNotifAsked(true)}
              className="flex-1 rounded-lg border border-border bg-background/40 py-2 text-xs font-semibold text-muted-foreground"
            >
              Not now
            </button>
            <button
              onClick={askNotif}
              className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
            >
              Allow alerts
            </button>
          </div>
        </div>
      )}
    </>
  );
}
