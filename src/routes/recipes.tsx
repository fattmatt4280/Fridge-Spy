import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Clock, Bookmark, BookmarkCheck, Loader2, ShoppingCart, ChefHat, GraduationCap, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateRecipes } from "@/lib/claude.functions";
import { markRecipeCooked } from "@/lib/cooking.functions";
import { daysUntil } from "@/lib/expiry";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { usePremium, useUpgradeGate } from "@/hooks/usePremium";
import { UpgradeModal } from "@/components/UpgradeModal";
import { FREE_RECIPE_PER_DAY } from "@/lib/limits";

export const Route = createFileRoute("/recipes")({
  head: () => ({
    meta: [
      { title: "Tonight's Cook — FridgeSpy" },
      { name: "description", content: "Get personalized recipe ideas built from the ingredients already in your kitchen. FridgeSpy turns what you have into dinner tonight." },
      { property: "og:title", content: "Tonight's Cook — Recipes from your fridge" },
      { property: "og:description", content: "Personalized recipes built from the ingredients already in your kitchen." },
      { property: "og:url", content: "https://fridgespy.com/recipes" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/recipes" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    focus: typeof s.focus === "string" ? s.focus : undefined,
  }),
  component: RecipesPage,
});

type GeneratedRecipe = {
  title: string;
  cuisine?: string;
  prep_time: string;
  difficulty: string;
  uses_expiring?: string[];
  uses_items?: string[];
  ingredients?: string[];
  instructions: string[];
  missing_ingredients: string[];
  why_make_this?: string;
  is_learning_pick?: boolean;
};

function RecipesPage() {
  const { user } = useAuth();
  const { focus } = Route.useSearch();
  const qc = useQueryClient();
  const genFn = useServerFn(generateRecipes);
  const cookedFn = useServerFn(markRecipeCooked);
  const { isPremium, recipesLeft, recipesToday } = usePremium();
  const gate = useUpgradeGate();
  const [recipes, setRecipes] = useState<GeneratedRecipe[] | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [cookSheet, setCookSheet] = useState<GeneratedRecipe | null>(null);

  const { data: items = [] } = useQuery({
    queryKey: ["items", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("items").select("*")).data ?? [],
  });
  const { data: saved = [] } = useQuery({
    queryKey: ["recipes", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("recipes").select("*").order("saved_date",{ascending:false})).data ?? [],
  });

  const generate = useMutation({
    mutationFn: async () => {
      if (items.length === 0) throw new Error("Add items to your inventory first.");
      if (!isPremium && recipesLeft <= 0) {
        gate.open("recipe-daily");
        throw new Error("limit");
      }
      const expiring: { name: string }[] = [];
      const other: { name: string }[] = [];
      // If a focus item is passed, force it into the expiring bucket so the
      // model prioritizes it.
      const focusLower = focus?.toLowerCase();
      for (const i of items) {
        const d = daysUntil(i.expiry_date);
        const isFocus = focusLower && i.name.toLowerCase() === focusLower;
        if (isFocus || (d !== null && d <= 7)) expiring.push({ name: i.name });
        else other.push({ name: i.name });
      }
      const res = await genFn({ data: { expiring, other } });
      qc.invalidateQueries({ queryKey: ["usage"] });
      return res;
    },
    onSuccess: (res) => {
      setRecipes(res.recipes as GeneratedRecipe[]);
      if (!res.recipes?.length) toast.error("No recipes returned. Try again.");
    },
    onError: (e: any) => { if (e?.message !== "limit") toast.error(e.message); },
  });

  // Auto-trigger when arriving with ?focus=
  useEffect(() => {
    if (focus && items.length > 0 && !recipes && !generate.isPending) {
      generate.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, items.length]);

  const save = useMutation({
    mutationFn: async (r: GeneratedRecipe) => {
      const { error } = await supabase.from("recipes").insert({
        user_id: user!.id,
        title: r.title,
        ingredients: r.ingredients ?? [],
        instructions: r.instructions,
        prep_time: r.prep_time,
        difficulty: r.difficulty,
        uses_items: r.uses_expiring ?? r.uses_items ?? [],
        missing_ingredients: r.missing_ingredients ?? [],
        favorite: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:["recipes"] }); toast.success("Saved"); },
  });

  const addMissing = useMutation({
    mutationFn: async (names: string[]) => {
      if (!user || !names.length) return 0;
      const rows = names.map(n => ({ user_id: user.id, name: n, source: "recipe" as const }));
      const { error } = await supabase.from("shopping_list").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ["shopping"] }); toast.success(`Added ${n} to shopping list`); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <h1 className="py-3 text-2xl font-extrabold tracking-tight">Tonight's Cook</h1>

      {items.length === 0 ? (
        <EmptyState
          emoji="👨‍🍳"
          title="Your kitchen is empty."
          body="Add some items to your inventory and FridgeSpy will suggest recipes using what you have."
          action={{ label: "Add Items", to: "/add" }}
        />
      ) : (
        <>
          {focus && (
            <div className="mb-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs text-primary">
              Focused on: <strong>{focus}</strong>
            </div>
          )}
          <button onClick={() => generate.mutate()} disabled={generate.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60">
            {generate.isPending ? <><Loader2 className="animate-spin" size={18}/> FridgeSpy is thinking...</> : <><Sparkles size={18}/> Use What I Have</>}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {isPremium
              ? "Unlimited Pro generations. Personalized to your taste."
              : `${Math.max(0, FREE_RECIPE_PER_DAY - recipesToday)} of ${FREE_RECIPE_PER_DAY} free generations left today.`}
          </p>
        </>
      )}

      {generate.isPending && (
        <div className="mt-5 space-y-3">
          {[0,1,2].map(k => (
            <div key={k} className="glass-card p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-background/60" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-background/50" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-background/40" />
            </div>
          ))}
        </div>
      )}

      {recipes && (
        <div className="mt-5 space-y-3">
          {recipes.map((r, idx) => {
            const uses = r.uses_expiring ?? r.uses_items ?? [];
            const missing = r.missing_ingredients ?? [];
            return (
              <article key={idx} className="glass-card overflow-hidden">
                <button onClick={() => setExpanded(expanded===idx?null:idx)} className="w-full p-4 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-base font-bold">{r.title}</div>
                        {r.is_learning_pick && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
                            <GraduationCap size={10}/> Try new
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock size={12}/> {r.prep_time}</span>
                        <span className="rounded-full bg-background/50 px-2 py-0.5">{r.difficulty}</span>
                        {r.cuisine && <span className="rounded-full bg-background/50 px-2 py-0.5">{r.cuisine}</span>}
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">Uses {uses.length} of yours</span>
                      </div>
                      {r.why_make_this && (
                        <div className="mt-2 text-xs italic text-muted-foreground">"{r.why_make_this}"</div>
                      )}
                    </div>
                    <span onClick={e => { e.stopPropagation(); save.mutate(r); }}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary">
                      <Bookmark size={18}/>
                    </span>
                  </div>
                </button>
                {expanded === idx && (
                  <div className="border-t border-border px-4 py-4 fade-in">
                    {uses.length > 0 && (
                      <>
                        <H>Uses from your kitchen</H>
                        <ul className="mt-1 list-disc pl-5 text-sm">{uses.map((x,i)=><li key={i}>{x}</li>)}</ul>
                      </>
                    )}
                    {missing.length > 0 && (
                      <>
                        <H className="mt-3 text-warning">Missing ingredients</H>
                        <ul className="mt-1 list-disc pl-5 text-sm">{missing.map((x,i)=><li key={i}>{x}</li>)}</ul>
                        <button onClick={() => addMissing.mutate(missing)}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 py-2.5 text-sm font-semibold text-primary">
                          <ShoppingCart size={16}/> Add missing to shopping list
                        </button>
                      </>
                    )}
                    <H className="mt-3">Steps</H>
                    <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">{r.instructions.map((x,i)=><li key={i}>{x}</li>)}</ol>

                    <button
                      onClick={() => setCookSheet(r)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      <ChefHat size={16}/> I cooked this
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {saved.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Saved</h2>
          <ul className="space-y-2">
            {saved.map(r => (
              <li key={r.id} className="glass-card flex items-center gap-3 p-3">
                <BookmarkCheck className="text-primary" size={20}/>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.prep_time} · {r.difficulty}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <UpgradeModal reason={gate.reason} onClose={gate.close} />

      {cookSheet && (
        <CookedSheet
          recipe={cookSheet}
          inventory={items}
          onClose={() => setCookSheet(null)}
          onConfirm={async (used) => {
            try {
              await cookedFn({ data: { recipeTitle: cookSheet.title, used } });
              toast.success(`Nice! ${cookSheet.title} logged.`);
              qc.invalidateQueries({ queryKey: ["items"] });
              qc.invalidateQueries({ queryKey: ["usage"] });
              qc.invalidateQueries({ queryKey: ["activity"] });
              qc.invalidateQueries({ queryKey: ["cooked-streak"] });
              setCookSheet(null);
            } catch (e: any) {
              toast.error(e?.message || "Couldn't log cook");
            }
          }}
        />
      )}
    </div>
  );
}

function H({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-xs font-bold uppercase tracking-wider text-muted-foreground ${className}`}>{children}</div>;
}

type Item = { id: string; name: string; quantity: number; unit?: string | null };

function CookedSheet({
  recipe, inventory, onClose, onConfirm,
}: {
  recipe: GeneratedRecipe;
  inventory: Item[];
  onClose: () => void;
  onConfirm: (used: { name: string; quantity: number }[]) => void | Promise<void>;
}) {
  const names = recipe.uses_expiring ?? recipe.uses_items ?? [];
  type Row = { name: string; quantity: number; unit: string; match: Item | null; checked: boolean };

  const initial: Row[] = names.map(n => {
    const match = inventory.find(i => i.name.toLowerCase() === n.toLowerCase()) ?? null;
    return {
      name: n,
      quantity: match ? 1 : 0,
      unit: match?.unit ?? "unit",
      match,
      checked: !!match,
    };
  });

  const [rows, setRows] = useState<Row[]>(initial);
  const [busy, setBusy] = useState(false);

  function update(idx: number, patch: Partial<Row>) {
    setRows(rs => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  async function submit() {
    setBusy(true);
    const used = rows
      .filter(r => r.checked && r.match && r.quantity > 0)
      .map(r => ({ name: r.match!.name, quantity: r.quantity }));
    await onConfirm(used);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Mark as cooked</div>
            <div className="mt-1 text-lg font-extrabold">{recipe.title}</div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-background/40"><X size={18}/></button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Confirm what you actually used — we'll update your inventory.
        </p>

        <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
          {rows.length === 0 && (
            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
              No matching items listed. We'll still log this cook.
            </div>
          )}
          {rows.map((r, idx) => (
            <div key={idx} className={`flex items-center gap-3 rounded-xl border p-3 ${r.match ? "border-border bg-background/40" : "border-dashed border-border bg-background/20 opacity-60"}`}>
              <button
                onClick={() => r.match && update(idx, { checked: !r.checked })}
                disabled={!r.match}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${r.checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}
              >
                {r.checked && <Check size={14}/>}
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.match ? `In stock: ${r.match.quantity} ${r.match.unit ?? ""}` : "Not in your kitchen"}
                </div>
              </div>
              {r.match && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min={0}
                    value={r.quantity}
                    onChange={e => update(idx, { quantity: Math.max(0, Number(e.target.value)) })}
                    className="w-16 rounded-md border border-border bg-background px-2 py-1 text-right text-sm outline-none focus:border-primary"
                  />
                  <span className="text-xs text-muted-foreground">{r.unit}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} disabled={busy} className="flex-1 rounded-xl border border-border bg-background/40 py-3 text-sm font-semibold">Cancel</button>
          <button onClick={submit} disabled={busy} className="flex-[2] rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {busy ? "Logging…" : "Confirm & update inventory"}
          </button>
        </div>
      </div>
    </div>
  );
}
