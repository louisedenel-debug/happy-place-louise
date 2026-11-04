import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  PERSONAS,
  currentPersonaKey,
  reconcilePersonas,
  saveCurrentSession,
  switchPersona,
  type Persona,
} from "@/lib/personas";

/** Barre de test (version élèves) : trois personnages distincts, chacun avec son compte. */
export function PersonaBar() {
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(currentPersonaKey());
    supabase.auth.getSession().then(async ({ data }) => {
      setSignedIn(!!data.session);
      // Le personnage actif est celui du compte réellement connecté, pas un simple souvenir du navigateur.
      if (data.session) setCurrent(await reconcilePersonas());
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
      void saveCurrentSession();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!signedIn) return null;

  async function pick(p: Persona) {
    if (busy || p.key === current) return;
    setBusy(p.key);
    try {
      await switchPersona(p);
      window.location.assign("/");
    } catch (e) {
      setBusy(null);
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-[#1b1c1c] px-md py-xs text-sm text-white">
      <strong className="text-xs tracking-[0.08em]">PROTOTYPE · TESTER EN TANT QUE</strong>
      <div role="group" aria-label="Personnage à tester" className="flex flex-wrap gap-2">
        {PERSONAS.map((p) => {
          const on = p.key === current;
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={on}
              disabled={busy !== null}
              onClick={() => pick(p)}
              className={`min-h-9 rounded-md border border-white px-3.5 text-sm font-semibold disabled:opacity-60 ${
                on ? "bg-white text-[#1b1c1c]" : "bg-transparent text-white hover:bg-white/15"
              }`}
            >
              {busy === p.key ? "Connexion…" : p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
