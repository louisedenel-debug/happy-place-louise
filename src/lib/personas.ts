import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";
import { fetchProfile } from "@/lib/profile";

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

function writeSaved(saved: Saved) {
  localStorage.setItem(STORE, JSON.stringify(saved));
}

/** Identifiant du compte contenu dans un jeton (champ « sub »). */
function userIdOf(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function currentPersonaKey(): string | null {
  try {
    return localStorage.getItem(CURRENT);
  } catch {
    return null;
  }
}

/**
 * Garde la session en cours dans la case du personnage à qui appartient ce compte (les jetons se renouvellent).
 * On identifie le personnage par le compte, jamais par le simple « personnage actif » : avec deux onglets ouverts,
 * l'autre onglet pouvait sinon ranger la session de Julien dans la case de Léa.
 */
export async function saveCurrentSession() {
  if (switching) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { access_token, refresh_token } = data.session;
  const uid = data.session.user.id;
  const saved = readSaved();
  let key = Object.keys(saved).find((k) => userIdOf(saved[k].access_token) === uid) ?? null;
  if (!key) {
    // Compte pas encore rangé : on le range dans la case du personnage actif, si elle est libre.
    const cur = currentPersonaKey();
    if (!cur || saved[cur]) return;
    key = cur;
  }
  writeSaved({ ...saved, [key]: { access_token, refresh_token } });
}

/**
 * Remet de l'ordre : le personnage actif est celui du compte réellement connecté (reconnu à son nom et son rôle),
 * et une même session ne peut pas servir à deux personnages.
 */
export async function reconcilePersonas(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return currentPersonaKey();
  const profile = await fetchProfile().catch(() => null);
  const match = PERSONAS.find(
    (p) => profile && profile.name === `${p.firstName} ${p.lastName}` && profile.role === p.role,
  );
  if (!match) return currentPersonaKey();
  const uid = data.session.user.id;
  const saved = readSaved();
  for (const k of Object.keys(saved)) {
    if (k !== match.key && userIdOf(saved[k].access_token) === uid) delete saved[k];
  }
  saved[match.key] = { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
  writeSaved(saved);
  localStorage.setItem(CURRENT, match.key);
  return match.key;
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
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      writeSaved({
        ...readSaved(),
        [p.key]: { access_token: data.session.access_token, refresh_token: data.session.refresh_token },
      });
    }
  } finally {
    switching = false;
  }
}
