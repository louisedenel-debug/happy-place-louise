import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrandHeader } from "@/components/brand-header";
import { processAttachmentDeletionQueue } from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/manage")({
  head: () => ({
    meta: [
      { title: "Gestion des données — Happy Place" },
      {
        name: "description",
        content:
          "Gérer les actualités du cabinet, les propositions internes, les alertes sur les recrutements et les indicateurs de performance.",
      },
      { property: "og:title", content: "Gestion des données — Happy Place" },
      {
        property: "og:description",
        content: "Gestion de l'activité d'un cabinet de recrutement spécialisé dans l'IT et le digital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") throw redirect({ to: "/" });
  },
  component: ManageLayout,
});

// Deux familles, comme dans le menu : « Vos actions » et « Gérer les données ».
const actionTabs = [
  { to: "/manage/blockers", label: "Points bloquants" },
  { to: "/manage/metrics", label: "Indicateurs" },
  { to: "/manage/news", label: "Actualités" },
] as const;
const dataTabs = [
  { to: "/manage/reminders", label: "Rappels de départ" },
  { to: "/manage/users", label: "Utilisateurs autorisés" },
] as const;

function ManageLayout() {
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const dataSection = pathname.startsWith("/manage/users") || pathname.startsWith("/manage/reminders");
  const tabs = dataSection ? dataTabs : actionTabs;
  const section = dataSection ? "Gérer les données" : "Vos actions";
  const pageTitle = [...dataTabs, ...actionTabs].find((t) => pathname.startsWith(t.to))?.label ?? section;
  // Suppression silencieuse des pièces jointes échues, une fois par chargement de /manage
  useEffect(() => {
    processAttachmentDeletionQueue()
      .then((r) => {
        if (r.remaining > 0) toast.error(`${r.remaining} document(s) n'ont pas pu être supprimés.`);
        else if (r.deleted > 0) toast.success(`${r.deleted} document(s) supprimé(s)`);
      })
      .catch(() => toast.error("La suppression des documents échus a échoué."))
      .finally(() => qc.invalidateQueries({ queryKey: ["attachment_deletion_queue"] }));
  }, [qc]);
  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen">
      <BrandHeader />
      <main className="w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <p className="text-sm text-on-surface-variant">{section}</p>
            <h1 className="mt-2 font-headline-lg text-headline-lg text-primary">{pageTitle}</h1>
          </div>
          <Link
            to="/vue"
            className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-primary px-5 text-base font-semibold text-primary hover:bg-surface-container"
          >
            <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span>
            Retour à la vue d'ensemble
          </Link>
        </div>

        <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <div role="tablist" aria-label={dataSection ? "Données à gérer" : "Vos actions"} className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const active = pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  role="tab"
                  aria-selected={active}
                  className={`inline-flex min-h-12 items-center rounded-lg border px-5 text-base font-semibold ${
                    active
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline text-primary hover:bg-surface-container"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
