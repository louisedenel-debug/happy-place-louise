import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";
import { fetchMySubmissions, fetchSubmissions } from "@/lib/dashboard";

// « Vos actions » affiche une pastille quand il y a du nouveau depuis la dernière ouverture de cette page.
// La date de dernière ouverture est gardée dans ce navigateur, par compte.
const seenKey = (email: string) => `hp-actions-seen:${email.toLowerCase()}`;

export function getActionsSeen(email: string): string {
  try {
    return localStorage.getItem(seenKey(email)) ?? new Date(0).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

export function markActionsSeen(email: string) {
  try {
    localStorage.setItem(seenKey(email), new Date().toISOString());
  } catch {
    // stockage indisponible : la pastille restera affichée
  }
}

/**
 * Collaborateur : idées dont le statut a changé (validée ou refusée) depuis la dernière ouverture.
 * Manager : idées de son équipe arrivées en attente depuis la dernière ouverture.
 * Admin : rien à faire dans « Vos actions ».
 */
export async function fetchActionsBadge(role: AppRole, email: string): Promise<number> {
  const since = getActionsSeen(email);
  if (role === "manager") {
    const pending = await fetchSubmissions();
    return pending.filter((s) => s.created_at > since).length;
  }
  if (role === "collaborateur") {
    const mine = await fetchMySubmissions(email);
    if (!mine.length) return 0;
    const { data, error } = await supabase
      .from("submission_status_history")
      .select("submission_id")
      .in("submission_id", mine.map((s) => s.id))
      .in("new_status", ["validée", "refusée"])
      .gt("changed_at", since);
    if (error) throw error;
    return new Set((data ?? []).map((r) => r.submission_id)).size;
  }
  return 0;
}
