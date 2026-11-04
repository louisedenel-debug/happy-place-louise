// Choix des indicateurs affichés dans la vue d'ensemble : un choix par compte, gardé dans ce navigateur.
export const DEFAULT_KPIS = ["training_kpi", "active_users"];

const storageKey = (email: string) => `hp-kpis:${email.toLowerCase()}`;

/** Les clés choisies, ou la sélection par défaut tant que l'utilisateur n'a rien choisi. */
export function getKpiSelection(email: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((k) => typeof k === "string")) return parsed;
    }
  } catch {
    // stockage indisponible ou illisible : sélection par défaut
  }
  return DEFAULT_KPIS;
}

export function setKpiSelection(email: string, keys: string[]) {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(keys));
  } catch {
    // le choix ne sera pas conservé, mais il reste appliqué pendant la visite
  }
}

export function resetKpiSelection(email: string) {
  try {
    localStorage.removeItem(storageKey(email));
  } catch {
    // rien à faire
  }
}
