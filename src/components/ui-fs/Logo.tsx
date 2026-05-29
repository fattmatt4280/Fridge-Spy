import logoSrc from "@/assets/fridgespy-logo.png";

const SIZES = { sm: 28, md: 36, lg: 56 } as const;

export function Logo({ size = "md", showWordmark = false }: { size?: keyof typeof SIZES; showWordmark?: boolean }) {
  const px = SIZES[size];
  return (
    <div className="flex items-center gap-2">
      <img
        src={logoSrc}
        alt="FridgeSpy"
        width={px}
        height={px}
        className="rounded-[22%] shadow-md shadow-primary/30"
        style={{ width: px, height: px }}
      />
      {showWordmark && (
        <span className="font-extrabold tracking-tight text-xl">
          Fridge<span className="text-primary-glow">Spy</span>
        </span>
      )}
    </div>
  );
}
