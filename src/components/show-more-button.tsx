import type { ReactNode } from "react";
import { btnSecondary } from "@/lib/button-styles";

/**
 * Bouton « Voir plus… » commun à tous les blocs (actualités, idées validées, archive des points bloquants) :
 * même forme que les autres boutons de l'app, centré sous la liste.
 */
export function ShowMoreActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-center gap-3">{children}</div>;
}

export function ShowMoreButton({
  children,
  onClick,
  expanded,
  hasPopup,
}: {
  children: ReactNode;
  onClick: () => void;
  /** Pour un bouton qui déplie ou replie une liste. */
  expanded?: boolean;
  /** Pour un bouton qui ouvre une fenêtre. */
  hasPopup?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-haspopup={hasPopup ? "dialog" : undefined}
      className={btnSecondary}
    >
      {children}
    </button>
  );
}
