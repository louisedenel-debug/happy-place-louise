import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Bouton « Filtrer par équipe », identique dans « Idées validées » et « Points bloquants ».
 * `value` vide = toutes les équipes : le bouton affiche « Filtrer par équipe » ; sinon il affiche le nom de l'équipe choisie.
 */
export function TeamFilter({
  teams,
  value,
  onChange,
}: {
  teams: string[];
  value: string;
  onChange: (team: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={value ? `Filtrer par équipe : ${value}` : undefined}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-outline bg-white px-4 text-base font-semibold text-primary hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden="true" className="material-symbols-outlined">filter_list</span>
          {value || "Filtrer par équipe"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[240px] p-2">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuRadioItem value="" className="min-h-11 text-base">
            Toutes les équipes
          </DropdownMenuRadioItem>
          {teams.map((t) => (
            <DropdownMenuRadioItem key={t} value={t} className="min-h-11 text-base">
              {t}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
