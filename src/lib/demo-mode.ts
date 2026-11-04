const DEMO_KEY = "hp-demo";
const DEMO_CODE = "bigger-boat";

/**
 * Barre de test des personnages : toujours visible en local ; en ligne, elle n'apparaît qu'après avoir ouvert le site
 * avec ?demo=bigger-boat (?demo=off la cache). L'adresse est lue au démarrage de l'app, avant les redirections
 * qui effacent la partie « ?demo=… » de l'URL.
 */
export function captureDemoFlag() {
  if (typeof window === "undefined") return;
  try {
    const asked = new URLSearchParams(window.location.search).get("demo");
    if (asked === DEMO_CODE) localStorage.setItem(DEMO_KEY, "1");
    if (asked === "off") localStorage.removeItem(DEMO_KEY);
  } catch {
    // stockage indisponible : la barre reste cachée
  }
}

export function demoEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return localStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}
