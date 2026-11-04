import { useState } from "react";
import { Linkify } from "@/components/linkify";
import { NewsImage, NewsLinks } from "@/components/news-media";
import { timeAgo, type News } from "@/lib/dashboard";
import { ShowMoreActions, ShowMoreButton } from "@/components/show-more-button";

const PAGE = 4;

/** Actualités publiées : 4 affichées, « Voir plus d'actualités » pour la suite ; chaque ligne se déplie sur place (aria-expanded). */
export function NewsFeed({ items, heading }: { items: News[]; heading?: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, PAGE);
  const hidden = items.length - PAGE;
  return (
    <div className="flex flex-col gap-4">
      {heading && <h3 className="text-xl font-bold leading-snug text-primary">{heading}</h3>}
      {items.length === 0 && <p className="text-base text-on-surface-variant">Aucune actualité publiée pour le moment.</p>}
      <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
        {shown.map((n) => {
          const open = openId === n.id;
          return (
            <div key={n.id} className="min-w-0 rounded-[12px] border border-outline-variant bg-[#FAFAF7]">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : n.id)}
                className="flex w-full items-start gap-4 p-5 text-left text-primary"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-semibold wrap-anywhere">{n.title}</span>
                  <span className="text-sm text-on-surface-variant">
                    Publiée {timeAgo(n.created_at)} · par {n.author}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`material-symbols-outlined transition-transform ${open ? "rotate-180" : ""}`}
                >
                  expand_more
                </span>
              </button>
              {open && (
                <div className="flex flex-col gap-3 px-5 pb-5">
                  {n.image_path && <NewsImage path={n.image_path} alt={n.title} />}
                  {n.body && (
                    <p className="whitespace-pre-line wrap-anywhere">
                      <Linkify text={n.body} />
                    </p>
                  )}
                  <NewsLinks links={n.links} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hidden > 0 && (
        <ShowMoreActions>
          <ShowMoreButton expanded={showAll} onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Voir moins d'actualités" : `Voir plus d'actualités (${hidden})`}
          </ShowMoreButton>
        </ShowMoreActions>
      )}
    </div>
  );
}
