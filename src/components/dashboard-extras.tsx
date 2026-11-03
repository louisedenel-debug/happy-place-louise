import { TeamFilter } from "@/components/team-filter";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AttachmentLink } from "@/components/attachment-link";
import { SubmissionPreview, formatExactDate } from "@/components/expandable-card";
import { fetchResolvedBlockers, fetchValidatedSubmissions, ideaTitle, type Submission } from "@/lib/dashboard";

/** Fenêtre « Archive des points bloquants » (lecture seule, statut RÉSOLU). */
export function BlockerArchive({ open, onClose }: { open: boolean; onClose: () => void }) {
  const q = useQuery({ queryKey: ["blockers", "resolved"], queryFn: fetchResolvedBlockers, enabled: open, retry: false });
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content className="fixed z-50 inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[min(48rem,calc(100vw-2rem))] h-dvh md:h-auto md:max-h-[85vh] flex flex-col bg-surface-container-lowest border border-outline shadow-lg focus:outline-none">
          <div className="flex items-start justify-between gap-sm border-b border-outline-variant p-md">
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-headline-sm text-headline-sm text-primary">
                Archive des points bloquants
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="font-label-sm text-label-sm text-on-surface-variant">
                Points résolus, du plus récent au plus ancien
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close aria-label="Fermer" className="text-on-surface-variant hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span aria-hidden="true" className="material-symbols-outlined">close</span>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-md space-y-sm">
            {q.isLoading && <p className="text-body-sm text-on-surface-variant">Chargement…</p>}
            {q.isError && <p className="text-body-sm text-error">L'archive est indisponible.</p>}
            {q.data?.length === 0 && (
              <p className="text-body-sm text-on-surface-variant italic">Aucun point bloquant résolu.</p>
            )}
            {q.data?.map((b) => (
              <div key={b.id} className="bg-card border border-outline-variant p-sm min-w-0">
                <p className="font-body-md text-primary font-bold wrap-anywhere">{b.title}</p>
                {b.description && (
                  <p className="text-body-sm text-on-surface-variant whitespace-pre-line wrap-anywhere">{b.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-sm mt-xs text-[11px] font-label-sm">
                  <span className="bg-surface-container-highest px-xs py-0.5">{b.department}</span>
                  <span className="text-on-surface-variant">Sévérité : {b.severity}</span>
                  <span className="text-on-surface-variant">Mis à jour le {formatExactDate(b.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Peut lire la pièce jointe : mêmes règles que le stockage (auteur, manager de l'équipe, admin). */
export function canReadAttachment(
  s: Submission,
  ctx: { role: string | null | undefined; email: string; managerTeams: string[] },
) {
  if (ctx.role === "admin") return true;
  if (ctx.email && (s.submitted_by_email ?? "").toLowerCase() === ctx.email.toLowerCase()) return true;
  return ctx.role === "manager" && ctx.managerTeams.includes(s.team);
}

const PAGE = 4;

export function ValidatedSubmissions({
  order,
  role,
  email,
  managerTeams,
  onRead,
}: {
  order?: number;
  role: string | null | undefined;
  email: string;
  managerTeams: string[];
  onRead: (s: Submission) => void;
}) {
  const q = useQuery({ queryKey: ["submissions", "validated"], queryFn: fetchValidatedSubmissions, retry: false });
  const [team, setTeam] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const teams = useMemo(
    () => [...new Set((q.data ?? []).map((s) => s.team))].sort((a, b) => a.localeCompare(b, "fr")),
    [q.data],
  );
  const filtered = (q.data ?? []).filter((s) => !team || s.team === team);
  const shown = filtered.slice(0, limit);

  return (
    <section
      aria-labelledby="t-valid"
      style={order ? { order } : undefined}
      className="col-span-12 min-w-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant bg-mod-demandes-tint p-5">
        <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-[10px] bg-mod-demandes text-white">
          <span className="material-symbols-outlined">task_alt</span>
        </span>
        <h2 id="t-valid" className="flex-1 font-headline-sm text-[28px] leading-tight text-mod-demandes">
          Idées validées
        </h2>
        <TeamFilter teams={teams} value={team} onChange={(t) => { setTeam(t); setLimit(PAGE); }} />
      </div>
      <div className="flex flex-col gap-4 p-5">
      <p>Toutes les idées validées du cabinet. Choisissez une équipe dans le filtre pour cibler ses idées.</p>
      {q.isLoading && <p className="text-base text-on-surface-variant">Chargement…</p>}
      {q.isError && <p className="text-base text-error">Les idées validées sont indisponibles.</p>}
      {q.data && filtered.length === 0 && (
        <p className="text-base text-on-surface-variant">Aucune idée validée pour le moment.</p>
      )}
      <div className="grid items-start gap-4 md:grid-cols-2">
        {shown.map((s) => (
          <div key={s.id} className="min-w-0 space-y-2 overflow-hidden rounded-[10px] border border-outline-variant bg-[#FAFAF7] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-primary wrap-anywhere">{ideaTitle(s)}</h3>
              {email && (s.submitted_by_email ?? "").toLowerCase() === email.toLowerCase() && (
                <span className="inline-flex items-center rounded-lg border border-st-ok bg-st-ok-tint px-2.5 py-0.5 text-sm font-semibold text-st-ok">
                  Validée
                </span>
              )}
            </div>
            <p className="text-sm text-on-surface-variant wrap-anywhere">
              {s.author_name} · {s.team} ·{" "}
              {s.validated_at ? `Validée le ${formatExactDate(s.validated_at)}` : `Soumise le ${formatExactDate(s.created_at)}`}
            </p>
            <SubmissionPreview content={s.content} onOpen={() => onRead(s)} />
            {s.attachment_path &&
              (canReadAttachment(s, { role, email, managerTeams }) ? (
                <AttachmentLink path={s.attachment_path} name={s.attachment_name} />
              ) : (
                <p className="text-[11px] font-label-sm text-on-surface-variant italic">Pièce jointe réservée à l'équipe</p>
              ))}
          </div>
        ))}
      </div>
      {(filtered.length > limit || limit > PAGE) && (
        <div className="mt-md flex flex-wrap gap-md">
          {filtered.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE)}
              className="font-label-sm text-label-sm text-primary underline"
            >
              Afficher plus ({filtered.length - limit} restantes)
            </button>
          )}
          {limit > PAGE && (
            <button
              type="button"
              onClick={() => setLimit(PAGE)}
              className="font-label-sm text-label-sm text-primary underline"
            >
              Afficher moins
            </button>
          )}
        </div>
      )}
      </div>
    </section>
  );
}
