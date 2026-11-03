import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState } from "react";
import { NewsAttachments } from "@/components/news-media";
import type { MediaDraft } from "@/lib/news-media";
import { HELP_EXAMPLES, HELP_TYPES, wordCount, wordMessage, type HelpKind } from "@/lib/news-help";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

/** Rédaction d'une actualité, avec l'aide à la rédaction (trois exemples à adapter). */
export function NewsWriter({
  title,
  body,
  media,
  linkErrs,
  titleError,
  saving,
  editing,
  onTitle,
  onBody,
  onMedia,
  onPublish,
  onSaveDraft,
  onCancelEdit,
}: {
  title: string;
  body: string;
  media: MediaDraft;
  linkErrs: Record<number, string>;
  titleError: boolean;
  saving: boolean;
  editing: boolean;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  onMedia: (v: MediaDraft) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onCancelEdit: () => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [kind, setKind] = useState<HelpKind | null>(null);
  const ex = kind ? HELP_EXAMPLES[kind] : null;
  const words = wordCount(body);

  function pick(k: HelpKind) {
    setKind(k);
    onTitle(HELP_EXAMPLES[k].title);
    onBody(HELP_EXAMPLES[k].body);
  }

  const label = "mb-1.5 block text-sm font-semibold text-on-surface-variant";
  const field =
    "w-full rounded-lg border border-outline bg-white p-3 text-base text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div id="redaction-actualite" className="flex max-w-[860px] scroll-mt-24 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-bold leading-snug text-primary">Rédiger une actualité</h3>
        <div className="group relative">
          <button
            type="button"
            aria-label="Une bonne actualité"
            className="grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-mod-actus bg-white text-mod-actus"
          >
            <Icon name="info" className="!text-[18px]" />
          </button>
          <div
            role="tooltip"
            className="absolute left-0 top-[calc(100%+8px)] z-20 hidden w-[340px] max-w-[86vw] rounded-[12px] border border-mod-actus bg-mod-actus-tint p-4 shadow-lg group-focus-within:block group-hover:block"
          >
            <p className="mb-2.5 text-lg font-bold leading-snug text-mod-actus">Une bonne actualité</p>
            <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
              <li>La nouvelle est dans la première phrase.</li>
              <li>Entre 60 et 120 mots.</li>
              <li>Des personnes nommées, pas « l'équipe » seule.</li>
              <li>Une phrase sur ce que ça change pour le lecteur.</li>
            </ul>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={helpOpen}
          aria-controls="aide-redac"
          onClick={() => setHelpOpen((o) => !o)}
          className={`ml-auto inline-flex min-h-12 items-center gap-2 rounded-lg border px-5 text-base font-semibold text-white ${
            helpOpen ? "border-[#4F1A51] bg-[#4F1A51] hover:bg-[#5E2060]" : "border-mod-actus bg-mod-actus hover:bg-[#8A3A8C]"
          }`}
        >
          <Icon name="auto_awesome" />
          Aide à la rédaction
        </button>
      </div>

      {editing && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-mod-actus bg-mod-actus-tint px-4 py-3 text-base font-semibold text-mod-actus"
        >
          <Icon name="edit" />
          Vous modifiez un brouillon : « {title || "sans titre"} ». Publiez-le ou enregistrez vos changements.
        </p>
      )}

      <p className="max-w-[640px] text-base">
        Trois minutes suffisent pour faire connaître votre équipe : ses réussites sont vues, ses nouveaux visages
        accueillis, et chacun sait vers qui se tourner. Ce que vous partagez donne envie aux autres équipes d'en faire
        autant.
      </p>

      {helpOpen && (
        <div id="aide-redac" className="flex flex-col gap-3">
          <p className="font-semibold">
            1. Que voulez-vous annoncer ? Un exemple se place dans le texte, à vous de l'adapter.
          </p>
          <div
            role="radiogroup"
            aria-label="Type d'actualité"
            className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]"
          >
            {HELP_TYPES.map((t) => {
              const on = kind === t.kind;
              const e = HELP_EXAMPLES[t.kind];
              return (
                <div key={t.kind} className="group relative">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pick(t.kind)}
                    className={`flex h-full w-full flex-col gap-2 rounded-[12px] border p-4 text-left text-primary ${
                      on ? "border-2 border-mod-actus bg-mod-actus-tint" : "border-outline bg-white hover:bg-surface-container"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="grid h-9 w-9 flex-none place-items-center rounded-[12px] bg-mod-actus text-white">
                        <Icon name={t.icon} />
                      </span>
                    </span>
                    <span className="font-semibold">{t.label}</span>
                    <span className="text-sm text-on-surface-variant">{t.hint}</span>
                  </button>
                  <div
                    role="tooltip"
                    className="absolute left-0 top-[calc(100%+8px)] z-20 hidden w-[340px] max-w-[86vw] rounded-[12px] border border-mod-actus bg-mod-actus-tint p-4 shadow-lg group-focus-within:block group-hover:block"
                  >
                    <p className="mb-2.5 text-lg font-bold leading-snug text-mod-actus">{e.checkTitle}</p>
                    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                      {e.checks.map((c) => (
                        <li key={c.label} className="flex items-start gap-2.5">
                          <Icon name="check" className="mt-0.5 !text-[18px] text-mod-actus" />
                          <span>
                            <strong>{c.label}</strong>
                            <br />
                            <span className="text-sm text-on-surface-variant">{c.hint}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Icon name="info" className="!text-[16px]" />
            Exemples d'illustration : remplacez les noms, dates et chiffres par les vôtres.
          </p>
          <p className="mt-1 font-semibold">2. Rédigez votre actualité</p>
        </div>
      )}

      <div>
        <label className={label} htmlFor="actu-titre">
          Titre de l'actualité
        </label>
        <input
          id="actu-titre"
          type="text"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          className={field}
          aria-invalid={titleError}
          aria-describedby={titleError ? "actu-titre-err" : undefined}
        />
        {titleError && (
          <p id="actu-titre-err" role="alert" className="mt-2 text-sm font-semibold text-sev-crit">
            Ajoutez un titre pour publier.
          </p>
        )}
      </div>

      <div>
        <label className={label} htmlFor="actu-contenu">
          Contenu de l'actualité
        </label>
        <textarea
          id="actu-contenu"
          rows={8}
          value={body}
          onChange={(e) => onBody(e.target.value)}
          className={`${field} resize-y`}
        />
        {helpOpen && <p className="mt-1.5 text-sm text-on-surface-variant">{wordMessage(words)}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <NewsAttachments value={media} onChange={onMedia} disabled={saving} />
        {ex && <p className="text-sm text-on-surface-variant">{ex.att}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4">
        {editing && (
          <button type="button" onClick={onCancelEdit} className="text-base font-semibold text-primary underline">
            Annuler la modification
          </button>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={onSaveDraft}
          className="inline-flex min-h-12 items-center rounded-lg border border-primary px-5 text-base font-semibold text-primary hover:bg-surface-container disabled:opacity-60"
        >
          Enregistrer le brouillon
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onPublish}
          className="inline-flex min-h-14 items-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-on-primary hover:opacity-90 disabled:opacity-60"
        >
          <Icon name="send" />
          Publier
        </button>
      </div>
    </div>
  );
}

/** Confirmation avant de publier : toute l'entreprise verra l'actualité. */
export function PublishConfirm({
  title,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogPrimitive.Root open onOpenChange={(o) => !o && onCancel()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(27,28,28,0.55)]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex w-[min(520px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-primary bg-white p-6 focus:outline-none">
          <DialogPrimitive.Title className="font-headline-sm text-[28px] leading-tight text-mod-actus">
            Publier pour toute l'entreprise ?
          </DialogPrimitive.Title>
          <p className="font-semibold wrap-anywhere">{title}</p>
          <DialogPrimitive.Description className="text-base">
            Toutes les équipes verront cette actualité dans le fil.
          </DialogPrimitive.Description>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-12 items-center rounded-lg border border-primary px-5 text-base font-semibold text-primary hover:bg-surface-container"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onConfirm}
              className="inline-flex min-h-12 items-center rounded-lg bg-primary px-5 text-base font-semibold text-on-primary hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Publication…" : "Publier"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
