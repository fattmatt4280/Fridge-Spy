
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  premium_user BOOLEAN NOT NULL DEFAULT false,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  fridgespy_score INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  items_saved_this_week INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Items (inventory)
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  emoji TEXT DEFAULT '🍽️',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unit',
  location TEXT NOT NULL DEFAULT 'fridge' CHECK (location IN ('fridge','freezer','pantry')),
  expiry_date DATE,
  added_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  image_url TEXT,
  barcode TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items select own" ON public.items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "items insert own" ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "items update own" ON public.items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "items delete own" ON public.items FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_items_user_expiry ON public.items(user_id, expiry_date);

-- Shopping list
CREATE TABLE public.shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'unit',
  category TEXT DEFAULT 'Other',
  checked BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','swipe','auto','expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shopping select own" ON public.shopping_list FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shopping insert own" ON public.shopping_list FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shopping update own" ON public.shopping_list FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shopping delete own" ON public.shopping_list FOR DELETE USING (auth.uid() = user_id);

-- Recipes (saved)
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions JSONB NOT NULL DEFAULT '[]',
  prep_time TEXT,
  difficulty TEXT,
  uses_items JSONB DEFAULT '[]',
  missing_ingredients JSONB DEFAULT '[]',
  favorite BOOLEAN NOT NULL DEFAULT false,
  saved_date TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes select own" ON public.recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recipes insert own" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes update own" ON public.recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recipes delete own" ON public.recipes FOR DELETE USING (auth.uid() = user_id);

-- Activity log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity select own" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity insert own" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_items_updated BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
