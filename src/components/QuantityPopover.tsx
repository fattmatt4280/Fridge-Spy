import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  qty: number;
  unit?: string | null;
  onSet: (next: number) => void;
  children: React.ReactNode;
}

const FRACTIONS = [0.25, 0.5, 0.75, 1];

/**
 * Lightweight popover for fractional quantity edits.
 * Whole +/- still live next to the trigger; this handles "used ½".
 */
export function QuantityPopover({ qty, unit, onSet, children }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  function apply(delta: number) {
    const next = Math.max(0, Math.round((qty - delta) * 1000) / 1000);
    onSet(next);
    setOpen(false);
    setCustom("");
  }

  function applyCustom() {
    const n = parseFloat(custom);
    if (!isFinite(n) || n <= 0) return;
    apply(n);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-56 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Use partial · {qty}{unit && unit !== "unit" ? ` ${unit}` : ""}
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {FRACTIONS.map(f => (
            <button
              key={f}
              onClick={() => apply(f)}
              disabled={f > qty}
              className="rounded-md border border-border bg-background/40 py-1.5 text-xs font-bold disabled:opacity-40 hover:border-primary"
            >
              {f === 0.25 ? "¼" : f === 0.5 ? "½" : f === 0.75 ? "¾" : "1"}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            inputMode="decimal"
            placeholder="0.0"
            className="w-full rounded-md border border-border bg-background/40 px-2 py-1.5 text-xs outline-none focus:border-primary"
          />
          <button
            onClick={applyCustom}
            className="rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground"
          >
            Use
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
