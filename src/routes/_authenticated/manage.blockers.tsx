import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ConfirmDelete,
  ErrorSummary,
  Field,
  FormActions,
  Modal,
  RowActions,
  Select,
  TextArea,
  TextInput,
} from "@/components/manage/crud-ui";
import { blockerSchema, validate, type FieldErrors } from "@/lib/manage-schemas";
import {
  createBlocker,
  deleteBlocker,
  fetchAllBlockers,
  timeAgo,
  updateBlocker,
  type Blocker,
  type BlockerInput,
} from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/manage/blockers")({
  head: () => ({
    meta: [
      { title: "Gestion des points bloquants — Happy Place" },
      { name: "description", content: "Créez, modifiez et supprimez les points bloquants dans Happy Place." },
      { property: "og:title", content: "Gestion des points bloquants — Happy Place" },
      { property: "og:description", content: "Gérez les alertes opérationnelles des missions de recrutement dans Happy Place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManageBlockers,
});

const severityLabels: Record<string, string> = {
  critical: "Critique",
  warning: "Avertissement",
  info: "Information",
};

const empty: BlockerInput = {
  title: "",
  description: "",
  department: "",
  severity: "warning",
  status: "EN COURS",
};

function ManageBlockers() {
  const qc = useQueryClient();
  const [form, setForm] = useState<BlockerInput | null>(null);
  const [editing, setEditing] = useState<Blocker | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [toDelete, setToDelete] = useState<Blocker | null>(null);

  const list = useQuery({ queryKey: ["blockers", "all"], queryFn: fetchAllBlockers, retry: false });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["blockers"] });
  const onError = (e: unknown) => toast.error((e as Error).message);

  const save = useMutation({
    mutationFn: (input: BlockerInput) =>
      editing ? updateBlocker(editing.id, input) : createBlocker(input),
    onSuccess: () => {
      toast.success(editing ? "Point bloquant modifié" : "Point bloquant créé");
      close();
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBlocker(id),
    onSuccess: () => {
      toast.success("Point bloquant supprimé");
      setToDelete(null);
      invalidate();
    },
    onError,
  });

  function close() {
    setForm(null);
    setEditing(null);
    setErrors({});
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const res = validate(blockerSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    save.mutate(res.data);
  }

  return (
    <section className="space-y-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold leading-snug text-primary">
          Points bloquants ({list.data?.length ?? 0})
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setErrors({});
            setForm({ ...empty });
          }}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 text-base font-semibold text-on-primary hover:opacity-90"
        >
          <span aria-hidden="true" className="material-symbols-outlined">add</span>Nouveau point bloquant
        </button>
      </div>

      {list.isLoading && <p className="text-body-sm text-on-surface-variant">Chargement…</p>}
      {list.isError && (
        <p className="text-body-sm text-error">Impossible de charger les points bloquants.</p>
      )}

      <div className="flex flex-col gap-4">
        {list.data?.map((b) => (
          <article
            key={b.id}
            className={`flex flex-wrap items-start justify-between gap-x-4 gap-y-3 rounded-[12px] border border-l-[6px] border-outline-variant bg-[#FAFAF7] p-5 ${
              b.severity === "critical" ? "border-l-sev-crit" : "border-l-sev-alert"
            }`}
          >
            <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1.5">
              <p className="font-semibold wrap-anywhere">{b.title}</p>
              <p className="wrap-anywhere">{b.description}</p>
              <p className="flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
                <span>{b.department}</span>
                <span
                  className={`rounded-lg border px-2.5 py-1 font-semibold ${
                    b.severity === "critical"
                      ? "border-sev-crit bg-sev-crit-tint text-sev-crit"
                      : "border-sev-alert bg-sev-alert-tint text-sev-alert"
                  }`}
                >
                  {b.severity === "critical" ? "Critique" : "Alerte"}
                </span>
                <span className="rounded-lg border border-outline px-2.5 py-1 font-semibold text-on-surface">
                  {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                </span>
                <span>Mis à jour {timeAgo(b.updated_at)}</span>
              </p>
            </div>
            <RowActions
              onEdit={() => {
                setEditing(b);
                setErrors({});
                setForm({
                  title: b.title,
                  description: b.description ?? "",
                  department: b.department,
                  severity: b.severity,
                  status: b.status,
                });
              }}
              onDelete={() => setToDelete(b)}
            />
          </article>
        ))}
        {list.data?.length === 0 && (
          <p className="text-body-sm italic text-on-surface-variant">Aucun point bloquant.</p>
        )}
      </div>

      {form && (
        <Modal
          title={editing ? "Modifier le point bloquant" : "Nouveau point bloquant"}
          onClose={close}
        >
          <form onSubmit={submit} className="space-y-sm" noValidate>
            <ErrorSummary errors={errors} />
            <Field label="Titre" error={errors.title}>
              <TextInput
                value={form.title}
                maxLength={160}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Description" error={errors.description}>
              <TextArea
                rows={4}
                value={form.description}
                maxLength={2000}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field label="Pôle concerné" error={errors.department}>
              <TextInput
                value={form.department}
                maxLength={60}
                placeholder="Ex. Data & IA"
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </Field>
            <Field label="Sévérité" error={errors.severity}>
              <Select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option value="critical">Critique</option>
                <option value="warning">Avertissement</option>
                <option value="info">Information</option>
              </Select>
            </Field>
            <Field label="Statut" error={errors.status}>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="OUVERT">OUVERT</option>
                <option value="EN COURS">EN COURS</option>
                <option value="SURVEILLANCE">SURVEILLANCE</option>
                {editing && (
                  <option
                    value="RÉSOLU"
                    disabled={form.status === "OUVERT"}
                    title={form.status === "OUVERT" ? "Passe d'abord par EN COURS" : undefined}
                  >
                    RÉSOLU
                  </option>
                )}
              </Select>
            </Field>
            <FormActions pending={save.isPending} onCancel={close} />
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDelete
          label={toDelete.title}
          pending={remove.isPending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => remove.mutate(toDelete.id)}
        />
      )}
    </section>
  );
}
