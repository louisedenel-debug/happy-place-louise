import { useId, useRef } from "react";
import { ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES } from "@/lib/dashboard";

const sizeLabel = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;

/**
 * Pièce jointe d'une idée : un bouton « Ajouter un fichier », puis une puce avec le nom, la taille
 * et un bouton pour retirer le fichier. Même logique que les pièces jointes des actualités.
 */
export function IdeaAttachment({
  file,
  error,
  onChange,
  onError,
}: {
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
  onError: (message: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const helpId = useId();
  const isPdf = file?.type === "application/pdf";

  function pick(f: File | null) {
    if (!f) return;
    if (!ATTACHMENT_TYPES[f.type]) {
      onError("Seuls les PDF et les images (JPEG, PNG, WebP) sont acceptés.");
      return;
    }
    if (f.size > MAX_ATTACHMENT_BYTES) {
      onError("Le fichier dépasse 20 Mo.");
      return;
    }
    onError(null);
    onChange(f);
  }

  return (
    <div className="space-y-xs">
      <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Pièce jointe (facultatif)</p>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        aria-describedby={helpId}
        data-testid="idea-file-input"
        onChange={(e) => {
          pick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary bg-white px-4 text-base font-semibold text-primary hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden="true" className="material-symbols-outlined">attach_file</span>
          {file ? "Changer de fichier" : "Ajouter un fichier"}
        </button>
        {file && (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-outline bg-white py-1 pl-2.5 pr-1.5 text-sm">
            <span aria-hidden="true" className="material-symbols-outlined !text-base text-mod-demandes">
              {isPdf ? "picture_as_pdf" : "image"}
            </span>
            <span className="wrap-anywhere font-semibold">{file.name}</span>
            <span className="shrink-0 text-on-surface-variant">{sizeLabel(file.size)}</span>
            <button
              type="button"
              aria-label={`Retirer le fichier ${file.name}`}
              onClick={() => {
                onChange(null);
                onError(null);
              }}
              className="grid size-6 shrink-0 place-items-center text-on-surface hover:text-error"
            >
              <span aria-hidden="true" className="material-symbols-outlined !text-base">close</span>
            </button>
          </span>
        )}
      </div>
      <p id={helpId} className="text-body-sm text-on-surface-variant">
        PDF, JPG, PNG ou WebP · 20 Mo maximum
      </p>
      {error && (
        <p role="alert" className="text-body-sm font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
