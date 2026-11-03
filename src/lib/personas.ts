import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";

// Version élèves : un navigateur = une session anonyme = une seule personne.
// Pour tester les trois parcours, chaque personnage a son propre compte, et sa session
// est gardée dans ce navigateur pour qu'on puisse passer de l'un à l'autre sans les mélanger.

export type Persona = {
  key: "lea" | "julien" | "marc";
  label: string;
  role: AppRole;
  firstName: string;
  lastName: string;
  team: string | null;
};

export const PERSONAS: Persona[] = [
  { key: "lea", label: "Léa, collaboratrice", role: "collaborateur", firstName: "Léa", lastName: "Martin", team: "Accounting" },
  { key: "julien", label: "Julien, manager", role: "manager", firstName: "Julien", lastName: "Morel", team: "Accounting" },
  { key: "marc", label: "Marc, admin", role: "admin", firstName: "Marc", lastName: "Simon", team: null },
];

const STORE = "hp-personas";
const CURRENT = "hp-persona-current";
type Saved = Record<string, { access_token: string; refresh_token: string }>;

let switching = false;

function readSaved(): Saved {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? "{}") as Saved;
  } catch {
    return {};
  }
}

export function currentPersonaKey(): string | null {
  try {
    return localStorage.getItem(CURRENT);
  } catch {
    return null;
  }
}

/** Garde la session en cours sous le nom du personnage actif (les jetons se renouvellent). */
export async function saveCurrentSession() {
  const key = currentPersonaKey();
  if (!key || switching) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { access_token, refresh_token } = data.session;
  localStorage.setItem(STORE, JSON.stringify({ ...readSaved(), [key]: { access_token, refresh_token } }));
}

export async function switchPersona(p: Persona) {
  await saveCurrentSession();
  switching = true;
  try {
    const saved = readSaved()[p.key];
    if (saved) {
      const { data, error } = await supabase.auth.setSession(saved);
      if (!error && data.session) {
        localStorage.setItem(CURRENT, p.key);
        return;
      }
    }
    // Première fois (ou session expirée) : nouveau compte pour ce personnage.
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) throw signInError;
    const { error } = await supabase.rpc("choisir_mon_role", {
      _role: p.role,
      _first_name: p.firstName,
      _last_name: p.lastName,
      _team: p.team ?? undefined,
    });
    if (error) throw error;
    await supabase.auth.refreshSession();
    localStorage.setItem(CURRENT, p.key);
  } finally {
    switching = false;
  }
  await saveCurrentSession();
}
