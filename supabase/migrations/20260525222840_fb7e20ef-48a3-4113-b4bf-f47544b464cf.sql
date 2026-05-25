-- Restrict profile updates so users cannot escalate premium_user or fridgespy_score
DROP POLICY IF EXISTS "own profile update" ON public.profiles;

CREATE POLICY "own profile update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger-based guard: block changes to privileged columns from non-service callers
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF NEW.premium_user IS DISTINCT FROM OLD.premium_user THEN
      RAISE EXCEPTION 'premium_user can only be modified by the server';
    END IF;
    IF NEW.fridgespy_score IS DISTINCT FROM OLD.fridgespy_score THEN
      NEW.fridgespy_score := OLD.fridgespy_score;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();