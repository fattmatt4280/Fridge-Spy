import logoSrc from "@/assets/fridgespy-logo.png";

const SIZES = { sm: 28, md: 36, lg: 56, xl: 120, "2xl": 160 } as const;

export function Logo({
  size = "md",
  showWordmark = false,
  animated = false,
}: {
  size?: keyof typeof SIZES;
  showWordmark?: boolean;
  animated?: boolean;
}) {
  const px = SIZES[size];
  return (
    <div className="flex items-center gap-2">
      <div
        className={
          animated
            ? "relative animate-[logo-float_4s_ease-in-out_infinite]"
            : "relative"
        }
        style={{ width: px, height: px }}
      >
        {animated && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-[22%] blur-2xl opacity-70 animate-[logo-pulse_3s_ease-in-out_infinite]"
            style={{ background: "var(--gradient-primary)" }}
          />
        )}
        <img
          src={logoSrc}
          alt="FridgeSpy"
          width={px}
          height={px}
          className="relative rounded-[22%] shadow-xl shadow-primary/40 ring-1 ring-primary-glow/30"
          style={{ width: px, height: px }}
        />
      </div>
      {showWordmark && (
        <span className="font-extrabold tracking-tight text-xl">
          Fridge<span className="text-primary-glow">Spy</span>
        </span>
      )}
    </div>
  );
}
