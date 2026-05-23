import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Clock, Bookmark, BookmarkCheck, Loader2, ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateRecipes } from "@/lib/claude.functions";
import { daysUntil } from "@/lib/expiry";
import { toast } from "sonner";

export const Route = createFileRoute("/recipes")({
  head: () => ({ meta: [{ title: "Tonight's Cook — FridgeSpy" }] }),
  component: RecipesPage,
});

type GeneratedRecipe = {
  title: string;
  prep_time: string;
  difficulty: "Easy"|"Medium"|"Hard"|string;
  ingredients: string[];
  instructions: string[];
  uses_items: string[];
  missing_ingredients: string[];
};

function RecipesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const genFn = useServerFn(generateRecipes);
  const [recipes, setRecipes] = useState<GeneratedRecipe[] | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

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
      const inv = items.map(i => ({
        name: i.name, quantity: Number(i.quantity), unit: i.unit ?? "unit",
        days_left: daysUntil(i.expiry_date),
      }));
      return await genFn({ data: { inventory: inv } });
    },
    onSuccess: (res) => {
      setRecipes(res.recipes as GeneratedRecipe[]);
      if (!res.recipes?.length) toast.error("No recipes returned. Try again.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async (r: GeneratedRecipe) => {
      const { error } = await supabase.from("recipes").insert({
        user_id: user!.id,
        title: r.title,
        ingredients: r.ingredients,
        instructions: r.instructions,
        prep_time: r.prep_time,
        difficulty: r.difficulty,
        uses_items: r.uses_items,
        missing_ingredients: r.missing_ingredients,
        favorite: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:["recipes"] }); toast.success("Saved"); },
  });

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <h1 className="py-3 text-2xl font-extrabold tracking-tight">Tonight's Cook</h1>

      <button onClick={() => generate.mutate()} disabled={generate.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60">
        {generate.isPending ? <><Loader2 className="animate-spin" size={18}/> FridgeSpy is thinking...</> : <><Sparkles size={18}/> Use What I Have</>}
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">3 recipes from items expiring soonest.</p>

      {recipes && (
        <div className="mt-5 space-y-3">
          {recipes.map((r, idx) => (
            <article key={idx} className="glass-card overflow-hidden">
              <button onClick={() => setExpanded(expanded===idx?null:idx)} className="w-full p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-bold">{r.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock size={12}/> {r.prep_time}</span>
                      <span className="rounded-full bg-background/50 px-2 py-0.5">{r.difficulty}</span>
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">Uses {r.uses_items?.length ?? 0} of yours</span>
                    </div>
                  </div>
                  <span onClick={e => { e.stopPropagation(); save.mutate(r); }} className="rounded-full p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary">
                    <Bookmark size={18}/>
                  </span>
                </div>
              </button>
              {expanded === idx && (
                <div className="border-t border-border px-4 py-4 fade-in">
                  <H>Ingredients</H>
                  <ul className="mt-1 list-disc pl-5 text-sm">{r.ingredients.map((x,i)=><li key={i}>{x}</li>)}</ul>
                  {r.missing_ingredients?.length > 0 && (
                    <>
                      <H className="mt-3 text-warning">Missing</H>
                      <ul className="mt-1 list-disc pl-5 text-sm">{r.missing_ingredients.map((x,i)=><li key={i}>{x}</li>)}</ul>
                    </>
                  )}
                  <H className="mt-3">Steps</H>
                  <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">{r.instructions.map((x,i)=><li key={i}>{x}</li>)}</ol>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Saved */}
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
    </div>
  );
}

function H({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-xs font-bold uppercase tracking-wider text-muted-foreground ${className}`}>{children}</div>;
}
