import { useState, useEffect } from "react";
import { CUISINE_OPTIONS, DIETARY_OPTIONS, SKILL_LEVELS, COOK_TIME_OPTIONS, type SkillLevel } from "@/lib/cooking";

export type CookingProfile = {
  cuisines_liked: string[];
  cuisines_learning: string[];
  dietary_restrictions: string[];
  avoid_ingredients: string[];
  skill_level: SkillLevel;
  typical_cook_time_min: number;
};

export const EMPTY_PROFILE: CookingProfile = {
  cuisines_liked: [],
  cuisines_learning: [],
  dietary_restrictions: [],
  avoid_ingredients: [],
  skill_level: "comfortable",
  typical_cook_time_min: 30,
};

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
        on
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background/40 text-foreground hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter(x => x !== v) : [...list, v];
}

export function CuisinePicker({
  value,
  onChange,
  title,
  subtitle,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="text-sm font-bold">{title}</div>
      {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
      <div className="mt-3 flex flex-wrap gap-2">
        {CUISINE_OPTIONS.map(c => (
          <Chip key={c} on={value.includes(c)} onClick={() => onChange(toggle(value, c))}>{c}</Chip>
        ))}
      </div>
    </div>
  );
}

export function DietaryEditor({
  profile,
  onChange,
}: {
  profile: CookingProfile;
  onChange: (next: CookingProfile) => void;
}) {
  const [avoidText, setAvoidText] = useState(profile.avoid_ingredients.join(", "));
  useEffect(() => { setAvoidText(profile.avoid_ingredients.join(", ")); }, [profile.avoid_ingredients]);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-bold">Dietary</div>
        <div className="mt-0.5 text-xs text-muted-foreground">Pick any that apply.</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map(d => (
            <Chip key={d} on={profile.dietary_restrictions.includes(d)}
              onClick={() => onChange({ ...profile, dietary_restrictions: toggle(profile.dietary_restrictions, d) })}>
              {d}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-bold">Avoid ingredients</div>
        <div className="mt-0.5 text-xs text-muted-foreground">Allergies or dislikes — comma separated (e.g. cilantro, mushrooms).</div>
        <input
          value={avoidText}
          onChange={e => setAvoidText(e.target.value)}
          onBlur={() => onChange({
            ...profile,
            avoid_ingredients: avoidText.split(",").map(s => s.trim()).filter(Boolean),
          })}
          className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          placeholder="cilantro, mushrooms, blue cheese"
        />
      </div>

      <div>
        <div className="text-sm font-bold">Skill level</div>
        <div className="mt-3 flex gap-2">
          {SKILL_LEVELS.map(s => (
            <Chip key={s} on={profile.skill_level === s}
              onClick={() => onChange({ ...profile, skill_level: s })}>
              {s[0].toUpperCase() + s.slice(1)}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-bold">Typical weeknight cook time</div>
        <div className="mt-3 flex gap-2">
          {COOK_TIME_OPTIONS.map(t => (
            <Chip key={t} on={profile.typical_cook_time_min === t}
              onClick={() => onChange({ ...profile, typical_cook_time_min: t })}>
              {t === 60 ? "60+ min" : `${t} min`}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
