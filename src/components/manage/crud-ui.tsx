import { useCallback, useState, type ReactNode } from "react";
import type { FieldErrors } from "@/lib/manage-schemas";
import { btnDanger, btnPrimary, btnSecondary } from "@/lib/button-styles";

export function ManageIcon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

const inputBase =
  "w-full rounded-lg bg-card border border-outline-variant focus:border-primary focus:outline-none p-sm font-body-md text-on-surface";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-xs">
      <label className="font-label-sm text-label-sm text-on-surface-variant uppercase block">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-sm md:p-lg">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-2xl bg-surface-container-lowest border border-outline p-md space-y-md rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
          <h2 className="font-headline-sm text-headline-sm text-primary">{title}</h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary"
          >
            <ManageIcon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormActions({
  pending,
  onCancel,
  submitLabel = "Enregistrer",
}: {
  pending?: boolean;
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-xs pt-sm">
      <button
        type="button"
        onClick={onCancel}
        className={btnSecondary}
      >
        Annuler
      </button>
      <button
        type="submit"
        disabled={pending}
        className={btnPrimary}
      >
        {pending ? "…" : submitLabel}
      </button>
    </div>
  );
}

export function ErrorSummary({ errors }: { errors: FieldErrors }) {
  const count = Object.keys(errors).length;
  if (!count) return null;
  return (
    <div role="alert" className="text-body-sm text-error border border-error/40 bg-error-container/30 p-sm wrap-anywhere rounded-lg">
      <p>{count} champ{count > 1 ? "s" : ""} à corriger avant l'enregistrement.</p>
      <ul className="mt-xs list-disc pl-md">
        {Object.entries(errors).map(([k, m]) => (
          <li key={k}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  deleting,
}: {
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex min-h-12 items-center rounded-lg border border-primary px-5 text-base font-semibold text-primary hover:bg-surface-container"
      >
        Modifier
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="inline-flex min-h-12 items-center rounded-lg border border-sev-crit px-5 text-base font-semibold text-sev-crit hover:bg-sev-crit-tint disabled:opacity-50"
      >
        Supprimer
      </button>
    </div>
  );
}

export function ConfirmDelete({
  label,
  onCancel,
  onConfirm,
  pending,
}: {
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <Modal title="Confirmer la suppression" onClose={onCancel}>
      <p className="font-body-md text-on-surface">
        Supprimer définitivement <strong className="text-primary">{label}</strong> ? Cette action est
        irréversible.
      </p>
      <div className="flex justify-end gap-xs pt-sm">
        <button
          type="button"
          onClick={onCancel}
          className={btnSecondary}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={btnDanger}
        >
          {pending ? "Suppression…" : "Supprimer"}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Confirmation dans l'app, à la place de la boîte du navigateur (qui peut ne pas s'afficher du tout).
 * Usage : const [ask, confirmDialog] = useConfirm(); … if (await ask({ title, message })) …; puis {confirmDialog} dans le rendu.
 */
export function useConfirm() {
  const [state, setState] = useState<{
    title: string;
    message: ReactNode;
    confirmLabel: string;
    danger: boolean;
    resolve: (ok: boolean) => void;
  } | null>(null);

  const ask = useCallback(
    (o: { title: string; message: ReactNode; confirmLabel?: string; danger?: boolean }) =>
      new Promise<boolean>((resolve) =>
        setState({ title: o.title, message: o.message, confirmLabel: o.confirmLabel ?? "Confirmer", danger: !!o.danger, resolve }),
      ),
    [],
  );

  const close = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };

  const dialog = state ? (
    <Modal title={state.title} onClose={() => close(false)}>
      <p className="font-body-md text-on-surface wrap-anywhere">{state.message}</p>
      <div className="flex justify-end gap-2 pt-sm">
        <button type="button" onClick={() => close(false)} className={btnSecondary}>
          Annuler
        </button>
        <button type="button" onClick={() => close(true)} className={state.danger ? btnDanger : btnPrimary}>
          {state.confirmLabel}
        </button>
      </div>
    </Modal>
  ) : null;

  return [ask, dialog] as const;
}
