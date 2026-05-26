
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cuisines_liked text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cuisines_learning text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dietary_restrictions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avoid_ingredients text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skill_level text NOT NULL DEFAULT 'comfortable',
  ADD COLUMN IF NOT EXISTS typical_cook_time_min integer NOT NULL DEFAULT 30;
