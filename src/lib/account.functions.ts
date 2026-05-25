import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Permanently deletes the signed-in user's account.
 * All user data (items, shopping_list, activity_log, profiles, subscriptions)
 * is removed automatically via ON DELETE CASCADE from auth.users.
 *
 * Required by Apple App Store guideline 5.1.1(v) and Google Play User Data policy.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
