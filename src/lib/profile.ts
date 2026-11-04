import { supabase } from "@/integrations/supabase/client";
import { fetchOwnRole, type AppRole } from "@/lib/auth";

export type Profile = {
  email: string;
  name: string;
  initials: string;
  role: AppRole;
  roleLabel: string;
  team: string;
};

export const ROLE_LABELS: Record<AppRole, string> = {
  collaborateur: "Collaborateur",
  manager: "Manager",
  admin: "Administrateur",
};

/** Profil du compte connecté, lu avec ses propres droits (RLS) ; null tant qu'aucun rôle n'est choisi. */
export async function fetchProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email?.toLowerCase();
  if (!email) return null;
  const role = await fetchOwnRole(email);
  if (!role) return null;

  const { data: user, error } = await supabase
    .from("allowed_users")
    .select("id, first_name, last_name, team")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;

  let team = user?.team ?? "";
  if (role === "manager" && user) {
    const { data: teams } = await supabase.from("manager_teams").select("team").eq("allowed_user_id", user.id);
    const names = (teams ?? []).map((t) => t.team).sort();
    if (names.length) team = names.join(", ");
  }

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || email.split("@")[0];
  const initials =
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .map((p) => (p as string).charAt(0))
      .join("")
      .toUpperCase() || name.slice(0, 2).toUpperCase();
  return { email, name, initials, role, roleLabel: ROLE_LABELS[role], team };
}
