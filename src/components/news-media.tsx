import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { toast } from "sonner";
import {
  MAX_NEWS_LINKS,
  NEWS_IMAGE_TYPES,
  imageError,
  linkDisplay,
  linkErrors,
  normalizeLinkUrl,
  signedNewsImageUrl,
  type MediaDraft,
  type NewsLink,
} from "@/lib/news-media";

function I({ name, className = "" }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export function NewsImage({
  path,
  alt,
  className = "",
  banner,
}: {
  path: string;
  alt: string;
  className?: string;
  /** Bandeau en haut d'une carte : pleine largeur, sans bordure, hauteur fixée par `className`. */
  banner?: boolean;
}) {
  const q = useQuery({ queryKey: ["news-image", path], queryFn: () => signedNewsImageUrl(path), staleTime: 50 * 60 * 1000, retry: false });
  if (banner) {
    if (q.isError) return null;
    if (!q.data) return <div aria-hidden="true" className={`w-full animate-pulse bg-surface-container ${className}`} />;
    return <img src={q.data} alt={alt} className={`w-full object-cover ${className}`} />;
  }
  if (!q.data) return null;
  return <img src={q.data} alt={alt} className={`w-full max-h-60 object-cover rounded-lg border border-outline-variant ${className}`} />;
}

export function NewsLinks({ links }: { links: unknown }) {
  const list = Array.isArray(links) ? (links as NewsLink[]) : [];
  if (!list.length) return null;
  return (
    <ul className="space-y-1 min-w-0">
      {list.map((l, i) => (
        <li key={i} className="min-w-0">
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-start gap-1 max-w-full text-primary underline underline-offset-2 font-body-sm text-body-sm wrap-anywhere"
          >
            <span className="wrap-anywhere">{linkDisplay(l)}</span>
            <I name="open_in_new" className="text-sm shrink-0" />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Boutons et champs « Ajouter un média » / « Ajouter un lien » d'un formulaire d'actualité. */
export function NewsMediaEditor({
  value,
  onChange,
  linkErrs,
  disabled,
  title,
}: {
  value: MediaDraft;
  onChange: (v: MediaDraft) => void;
  linkErrs: Record<number, string>;
  disabled?: boolean;
  title: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const preview = useMemo(() => (value.file ? URL.createObjectURL(value.file) : null), [value.file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const showExisting = !value.file && value.existingPath && !value.removeExisting;
  const hasImage = !!value.file || !!showExisting;
  const full = value.links.length >= MAX_NEWS_LINKS;

  const pick = () => input.current?.click();

  return (
    <div className="space-y-sm min-w-0">
      <input
        ref={input}
        type="file"
        accept={NEWS_IMAGE_TYPES.join(",")}
        className="hidden"
        data-testid="news-image-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const err = imageError(f);
          setImgError(err);
          if (err) { toast.error(err); return; }
          onChange({ ...value, file: f });
        }}
      />
      {hasImage && (
        <div className="space-y-xs">
          {preview ? (
            <img src={preview} alt={title || "Aperçu de l'image"} className="w-full max-w-xs max-h-40 object-cover border border-outline-variant rounded-lg" />
          ) : (
            showExisting && <NewsImage path={value.existingPath!} alt={title || "Image de l'actualité"} className="max-w-xs max-h-40" />
          )}
          <div className="flex gap-sm">
            <button type="button" disabled={disabled} onClick={pick} className="font-label-sm text-label-sm text-primary underline disabled:opacity-50">Remplacer</button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...value, file: null, removeExisting: !!value.existingPath })}
              className="font-label-sm text-label-sm text-error underline disabled:opacity-50"
            >
              Retirer
            </button>
          </div>
        </div>
      )}
      {imgError && <p role="alert" className="text-body-sm text-error">{imgError}</p>}

      {value.links.map((l, i) => (
        <div key={i} className="space-y-1 min-w-0">
          <div className="flex flex-col sm:flex-row gap-xs min-w-0">
            <input
              aria-label={`Adresse du lien ${i + 1}`}
              placeholder="https://…"
              maxLength={2000}
              value={l.url}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, links: value.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })}
              className="min-w-0 flex-[2] bg-card border border-outline-variant p-xs font-body-sm focus:outline-none focus:border-primary rounded-lg"
            />
            <div className="flex gap-xs min-w-0 flex-1">
              <input
                aria-label={`Libellé du lien ${i + 1} (facultatif)`}
                placeholder="Libellé (facultatif)"
                maxLength={80}
                value={l.label}
                disabled={disabled}
                onChange={(e) => onChange({ ...value, links: value.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                className="min-w-0 flex-1 bg-card border border-outline-variant p-xs font-body-sm focus:outline-none focus:border-primary rounded-lg"
              />
              <button
                type="button"
                aria-label={`Retirer le lien ${i + 1}`}
                disabled={disabled}
                onClick={() => onChange({ ...value, links: value.links.filter((_, j) => j !== i) })}
                className="text-on-surface-variant hover:text-error"
              >
                <I name="close" />
              </button>
            </div>
          </div>
          {linkErrs[i] && <p role="alert" className="text-body-sm text-error">{linkErrs[i]}</p>}
        </div>
      ))}

      <div className="flex flex-wrap gap-sm items-center">
        <button
          type="button"
          disabled={disabled}
          onClick={pick}
          className="text-on-surface-variant flex items-center gap-xs hover:text-primary transition-colors disabled:opacity-50"
        >
          <I name="image" /> <span className="font-label-sm text-label-sm">{hasImage ? "CHANGER LE MÉDIA" : "AJOUTER UN MÉDIA"}</span>
        </button>
        <button
          type="button"
          disabled={disabled || full}
          title={full ? "3 liens maximum" : undefined}
          onClick={() => onChange({ ...value, links: [...value.links, { url: "", label: "" }] })}
          className="text-on-surface-variant flex items-center gap-xs hover:text-primary transition-colors disabled:opacity-50 disabled:hover:text-on-surface-variant"
        >
          <I name="link" /> <span className="font-label-sm text-label-sm">AJOUTER UN LIEN</span>
        </button>
        {full && <span className="font-label-sm text-label-sm text-on-surface-variant">3 liens maximum</span>}
      </div>
    </div>
  );
}

/**
 * Pièces jointes façon maquette : bouton rond « + » qui ouvre une fenêtre (image ou lien,
 * le lien se saisit directement dans la fenêtre), puis une puce par pièce jointe avec son bouton de retrait.
 * Même modèle de données que NewsMediaEditor : une image et 3 liens au maximum.
 */
export function NewsAttachments({
  value,
  onChange,
  disabled,
}: {
  value: MediaDraft;
  onChange: (v: MediaDraft) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choose" | "link">("choose");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const showExisting = !value.file && value.existingPath && !value.removeExisting;
  const imageName = value.file ? value.file.name : showExisting ? "Image jointe" : null;
  const full = value.links.length >= MAX_NEWS_LINKS;

  const chip =
    "inline-flex max-w-full items-center gap-1.5 rounded-lg border border-outline bg-white py-1 pl-2.5 pr-1.5 text-sm";
  const remove = "grid size-6 shrink-0 place-items-center text-on-surface hover:text-error disabled:opacity-50";
  const dlgBtn =
    "inline-flex min-h-12 items-center gap-2 rounded-lg border border-primary px-5 text-base font-semibold text-primary hover:bg-surface-container disabled:opacity-50";
  const dlgField =
    "mt-1 h-12 w-full rounded-lg border border-outline-variant bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary";

  function openDialog() {
    setStep("choose");
    setUrl("");
    setLabel("");
    setUrlError(null);
    setOpen(true);
  }

  function addLink(e: React.FormEvent) {
    e.preventDefault();
    const draft = { url, label };
    const err = linkErrors([draft])[0];
    if (err) {
      setUrlError(err);
      return;
    }
    onChange({ ...value, links: [...value.links, { url: normalizeLinkUrl(url)!, label: label.trim() }] });
    setOpen(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <input
        ref={input}
        type="file"
        accept={NEWS_IMAGE_TYPES.join(",")}
        className="hidden"
        data-testid="news-image-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const err = imageError(f);
          if (err) { toast.error(err); return; }
          onChange({ ...value, file: f });
        }}
      />
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="m-0 text-sm font-semibold text-on-surface-variant">Pièces jointes</p>
        <button
          type="button"
          aria-label="Ajouter une pièce jointe"
          disabled={disabled}
          onClick={openDialog}
          className="grid size-9 place-items-center rounded-full border-[1.5px] border-mod-actus bg-white text-mod-actus disabled:opacity-50"
        >
          <I name="add" />
        </button>
        {imageName && (
          <span className={chip}>
            <I name="image" className="text-mod-actus !text-base" />
            <span className="wrap-anywhere">{imageName}</span>
            <button
              type="button"
              aria-label={`Retirer l'image ${imageName}`}
              disabled={disabled}
              onClick={() => onChange({ ...value, file: null, removeExisting: !!value.existingPath })}
              className={remove}
            >
              <I name="close" className="!text-base" />
            </button>
          </span>
        )}
        {value.links.map((l, i) => (
          <span key={i} className={chip}>
            <I name="link" className="text-mod-actus !text-base" />
            <span className="wrap-anywhere">{linkDisplay(l)}</span>
            <button
              type="button"
              aria-label={`Retirer le lien ${linkDisplay(l)}`}
              disabled={disabled}
              onClick={() => onChange({ ...value, links: value.links.filter((_, j) => j !== i) })}
              className={remove}
            >
              <I name="close" className="!text-base" />
            </button>
          </span>
        ))}
      </div>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(27,28,28,0.55)]" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex w-[min(480px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-primary bg-white p-6 focus:outline-none">
            <DialogPrimitive.Title className="font-headline-sm text-[28px] leading-tight text-mod-actus">
              {step === "link" ? "Ajouter un lien" : "Ajouter une pièce jointe"}
            </DialogPrimitive.Title>
            {step === "choose" ? (
              <>
                <DialogPrimitive.Description className="text-base">Ajoutez une image ou un lien.</DialogPrimitive.Description>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setOpen(false); input.current?.click(); }} className={dlgBtn}>
                    <I name="image" /> Une image
                  </button>
                  <button
                    type="button"
                    disabled={full}
                    title={full ? "3 liens maximum" : undefined}
                    onClick={() => setStep("link")}
                    className={dlgBtn}
                  >
                    <I name="link" /> Un lien
                  </button>
                </div>
                {full && <p className="text-sm text-on-surface-variant">3 liens maximum.</p>}
                <div className="flex justify-end">
                  <DialogPrimitive.Close className={dlgBtn}>Annuler</DialogPrimitive.Close>
                </div>
              </>
            ) : (
              <form onSubmit={addLink} className="flex flex-col gap-4" noValidate>
                <DialogPrimitive.Description className="text-base">
                  Collez l'adresse du lien. Le libellé est facultatif : sans libellé, on affiche le nom du site.
                </DialogPrimitive.Description>
                <label className="block text-sm font-semibold text-on-surface-variant">
                  Adresse du lien
                  <input
                    autoFocus
                    inputMode="url"
                    placeholder="https://…"
                    maxLength={2000}
                    value={url}
                    aria-invalid={!!urlError}
                    onChange={(e) => { setUrl(e.target.value); setUrlError(null); }}
                    className={dlgField}
                  />
                </label>
                {urlError && <p role="alert" className="-mt-2 text-sm font-semibold text-sev-crit">{urlError}</p>}
                <label className="block text-sm font-semibold text-on-surface-variant">
                  Libellé (facultatif)
                  <input maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} className={dlgField} />
                </label>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setStep("choose")} className={dlgBtn}>Retour</button>
                  <button
                    type="submit"
                    className="inline-flex min-h-12 items-center rounded-lg bg-primary px-5 text-base font-semibold text-on-primary hover:opacity-90"
                  >
                    Ajouter le lien
                  </button>
                </div>
              </form>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
