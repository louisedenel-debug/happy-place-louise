import { useMemo, useState } from "react";
import { timeAgo, type Blocker } from "@/lib/dashboard";

const STEPS = ["OUVERT", "EN COURS", "SURVEILLANCE", "RÉSOLU"] as const;
const STEP_LABELS: Record<string, string> = {
  OUVERT: "Ouvert",
  "EN COURS": "En cours",
  SURVEILLANCE: "Surveillance",
  RÉSOLU: "Résolu",
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

/**
 * « Points bloquants » : triés par criticité, filtre d'équipe présélectionné sur l'équipe du profil
 * (`defaultTeam`, vide = toutes les équipes), lignes dépliables avec le suivi du statut.
 */
export function BlockersBoard({
  blockers,
  isError,
  defaultTeam,
  onOpenArchive,
  className = "",
  order,
}: {
  blockers: Blocker[] | undefined;
  isError: boolean;
  defaultTeam: string;
  onOpenArchive: () => void;
  className?: string;
  order?: number;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const team = picked ?? defaultTeam;
  const teams = useMemo(
    () =>
      [...new Set([...(blockers ?? []).map((b) => b.department), ...(defaultTeam ? [defaultTeam] : [])])].sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [blockers, defaultTeam],
  );
  // Critiques d'abord ; à criticité égale, le plus récemment mis à jour en premier.
  const list = useMemo(
    () =>
      (blockers ?? [])
        .filter((b) => !team || b.department === team)
        .sort(
          (a, b) =>
            Number(b.severity === "critical") - Number(a.severity === "critical") ||
            b.updated_at.localeCompare(a.updated_at),
        ),
    [blockers, team],
  );

  const note = defaultTeam
    ? `Un filtre automatique cible d'abord les points bloquants de votre équipe, ${defaultTeam}. Choisissez « Toutes les équipes » ou une autre équipe pour avoir une vision globale.`
    : "Vous voyez les points bloquants de toutes les équipes. Choisissez une équipe dans le filtre pour cibler les siens.";

  return (
    <section
      aria-labelledby="t-blo"
      style={order ? { order } : undefined}
      className={`min-w-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant bg-mod-blocages-tint p-5">
        <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-[10px] bg-mod-blocages text-white">
          <Icon name="flag" />
        </span>
        <h2 id="t-blo" className="flex-1 whitespace-nowrap font-headline-sm text-[28px] leading-tight text-mod-blocages">
          Points bloquants
        </h2>
        <span className="rounded-lg bg-sev-crit-tint px-2.5 py-1 text-sm font-semibold text-sev-crit">Priorité haute</span>
        <div className="flex items-center gap-3">
          <label htmlFor="f-team" className="text-sm text-on-surface-variant">
            Équipe
          </label>
          <select
            id="f-team"
            value={team}
            onChange={(e) => setPicked(e.target.value)}
            className="min-h-12 min-w-[220px] rounded-lg border border-outline bg-white px-3 text-base text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">Toutes les équipes</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3 rounded-[10px] border border-mod-blocages bg-mod-blocages-tint px-4 py-3">
          <Icon name="info" className="mt-0.5 text-mod-blocages" />
          <p>{note}</p>
        </div>
        {isError && <p className="text-base text-error">Les points bloquants sont indisponibles.</p>}
        {blockers && list.length === 0 && (
          <p className="text-sm text-on-surface-variant">
            {team ? "Aucun point bloquant pour cette équipe." : "Aucun point bloquant en cours."}
          </p>
        )}
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={onOpenArchive}
          className="self-start text-base font-semibold text-mod-blocages underline"
        >
          Voir l'archive des points résolus
        </button>
        {list.map((b) => {
          const critical = b.severity === "critical";
          const open = openId === b.id;
          return (
            <div
              key={b.id}
              className={`rounded-[10px] border border-outline-variant border-l-[6px] bg-[#FAFAF7] ${
                critical ? "border-l-sev-crit" : "border-l-sev-alert"
              }`}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : b.id)}
                className="flex w-full items-start gap-4 p-5 text-left text-primary"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="font-semibold wrap-anywhere">{b.title}</span>
                  {b.description && <span className="wrap-anywhere">{b.description}</span>}
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold ${
                        critical ? "bg-sev-crit-tint text-sev-crit" : "bg-sev-alert-tint text-sev-alert"
                      }`}
                    >
                      <Icon name={critical ? "error" : "warning"} className="!text-[16px]" />
                      {critical ? "Critique" : "Alerte"}
                    </span>
                    <span className="rounded-lg border border-outline px-2.5 py-1 text-sm font-semibold">
                      {STEP_LABELS[b.status] ?? b.status}
                    </span>
                    <span className="rounded-lg bg-[#e3e3de] px-2.5 py-1 text-sm font-semibold text-[#1a1c19]">
                      {b.department}
                    </span>
                    <span className="text-sm text-on-surface-variant">Mis à jour {timeAgo(b.updated_at)}</span>
                  </span>
                </span>
                <Icon name={open ? "expand_less" : "expand_more"} />
              </button>
              {open && (
                <div className="flex flex-col gap-3 px-5 pb-5">
                  <p className="text-sm text-on-surface-variant">Suivi du statut, étape par étape</p>
                  <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {STEPS.map((st) => (
                      <li
                        key={st}
                        aria-current={st === b.status ? "step" : undefined}
                        className={`rounded-lg border px-2.5 py-1 text-sm ${
                          st === b.status
                            ? "border-primary bg-primary font-semibold text-on-primary"
                            : "border-outline text-on-surface-variant"
                        }`}
                      >
                        {STEP_LABELS[st]}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
