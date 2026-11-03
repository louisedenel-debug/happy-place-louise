import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  downloadAttachment,
  downloadDepartureZip,
  fetchMyDepartureNotices,
  markDepartureNoticeDownloaded,
  type DepartureNotice,
} from "@/lib/dashboard";

const frDate = (iso: string) => new Intl.DateTimeFormat("fr-FR").format(new Date(iso));
const frDay = (ymd: string) => ymd.split("-").reverse().join("/");

export function DepartureNotices({ email }: { email: string }) {
  const q = useQuery({
    queryKey: ["departure_notices", email.toLowerCase()],
    queryFn: () => fetchMyDepartureNotices(email),
  });
  const list = q.data ?? [];
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold leading-snug text-primary">Rappels de départ ({list.length} à traiter)</h2>
      {q.isError && <p className="text-base text-error">Les rappels sont indisponibles.</p>}
      {!q.isLoading && !q.isError && list.length === 0 && <p>Tous les départs ont été pris en compte.</p>}
      {list.map((n) => (
        <NoticeBanner key={n.id} notice={n} email={email} />
      ))}
    </div>
  );
}

function NoticeBanner({ notice: n, email }: { notice: DepartureNotice; email: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [zipping, setZipping] = useState(false);
  const count = n.documents.length;
  const deleteOn = new Date(new Date(n.created_at).getTime() + 7 * 86400000).toISOString();
  const text =
    count === 0
      ? n.kind === "préavis"
        ? `${n.departing_label} quitte Happy Place le ${frDay(n.departure_date)}. Aucun document à télécharger.`
        : `${n.departing_label} a quitté Happy Place. Aucun document à télécharger.`
      : n.kind === "préavis"
        ? `${n.departing_label} quitte Happy Place le ${frDay(n.departure_date)} : ${count} document(s) joint(s) à ses demandes seront alors supprimés.`
        : `${n.departing_label} a quitté Happy Place : ${count} document(s) joint(s) à ses demandes seront supprimés le ${frDate(deleteOn)}`;

  const mark = useMutation({
    mutationFn: () => markDepartureNoticeDownloaded(n.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departure_notices", email.toLowerCase()] }),
    onError: (e) => toast.error((e as Error).message),
  });

  async function zipAll() {
    setZipping(true);
    try {
      await downloadDepartureZip(n);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setZipping(false);
    }
  }

  const btn =
    "inline-flex min-h-12 items-center rounded-lg border border-primary px-5 text-base font-semibold text-primary hover:bg-surface-container disabled:opacity-50";
  const btnPrimary =
    "inline-flex min-h-12 items-center rounded-lg bg-primary px-5 text-base font-semibold text-on-primary hover:opacity-90 disabled:opacity-60";

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-[10px] border border-l-[6px] border-outline-variant border-l-sev-alert bg-[#FAFAF7] p-5"
    >
      <p className="wrap-anywhere">
        <strong>Rappel : </strong>
        {text}
      </p>
      <div className="flex flex-wrap gap-2">
        {count > 0 && (
          <>
            <button type="button" className={btn} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? "Masquer les documents" : "Voir les documents"}
            </button>
            <button type="button" className={btn} onClick={zipAll} disabled={zipping}>
              {zipping ? "Préparation…" : "Tout télécharger (.zip)"}
            </button>
          </>
        )}
        <button type="button" className={btnPrimary} onClick={() => mark.mutate()} disabled={mark.isPending}>
          {count > 0 ? "J'ai téléchargé les documents" : "J'ai pris note"}
        </button>
      </div>
      {open && (
        <ul className="border-t border-outline-variant pt-xs space-y-xs">
          {n.documents.map((d) => (
            <li key={d.path} className="flex flex-wrap items-center justify-between gap-xs text-body-sm">
              <span>
                <span className="font-bold">{frDate(d.created_at)}</span> — {d.excerpt}
              </span>
              <button
                type="button"
                className="text-primary underline font-label-sm text-label-sm"
                onClick={() => downloadAttachment(d.path, d.name).catch((e) => toast.error((e as Error).message))}
              >
                Télécharger
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
