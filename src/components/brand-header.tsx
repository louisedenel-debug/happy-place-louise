import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import sharkLogo from "@/assets/bigger-boat-shark.png";
import { signOut, type AppRole } from "@/lib/auth";
import { exportMyRecentSubmissions } from "@/lib/dashboard";
import { fetchProfile, type Profile } from "@/lib/profile";
import { fetchActionsBadge, markActionsSeen } from "@/lib/action-badge";
import { PersonaBar } from "@/components/persona-bar";

type NavItem = {
  label: string;
  to: "/vue" | "/actions" | "/manage/reminders" | "/manage/blockers";
  match: string[];
  badge?: boolean;
};

const OVERVIEW: NavItem = { label: "Vue d'ensemble", to: "/vue", match: ["/vue"] };
const NAV: Record<AppRole, NavItem[]> = {
  collaborateur: [OVERVIEW, { label: "Vos actions", to: "/actions", match: ["/actions"], badge: true }],
  manager: [OVERVIEW, { label: "Vos actions", to: "/actions", match: ["/actions"], badge: true }],
  admin: [
    OVERVIEW,
    { label: "Gérer les données", to: "/manage/reminders", match: ["/manage/reminders", "/manage/users"] },
    { label: "Vos actions", to: "/manage/blockers", match: ["/manage/blockers", "/manage/metrics", "/manage/news"] },
  ],
};

function Avatar({ initials, size }: { initials: string; size: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="grid flex-none place-items-center rounded-full bg-primary font-bold text-on-primary"
    >
      {initials}
    </span>
  );
}

function ProfileMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const exportIdeas = useMutation({
    mutationFn: () => exportMyRecentSubmissions(profile.email),
    onSuccess: (count) => {
      if (count === 0) toast.info("Aucune idée en attente ou validée sur les 30 derniers jours.");
      else toast.success(`${count} idée${count > 1 ? "s" : ""} exportée${count > 1 ? "s" : ""} au format CSV.`);
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });

  const item =
    "flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary px-5 text-base font-semibold text-primary hover:bg-surface-container disabled:opacity-60";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-profil"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-12 items-center gap-2.5 rounded-lg border border-primary py-0 pl-2 pr-4 text-base font-semibold text-primary hover:bg-surface-container"
      >
        <Avatar initials={profile.initials} size={32} />
        Profil
        <span aria-hidden="true" className="material-symbols-outlined !text-[18px]">expand_more</span>
      </button>
      {open && (
        <div
          id="menu-profil"
          className="absolute right-0 top-[calc(100%+8px)] z-40 flex w-[340px] max-w-[86vw] flex-col gap-4 rounded-xl border border-outline bg-card p-5 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <Avatar initials={profile.initials} size={72} />
            <div className="min-w-0">
              <p className="wrap-anywhere text-lg font-bold leading-snug text-primary">{profile.name}</p>
              <p className="text-base">{profile.roleLabel}</p>
              {profile.team && <p className="text-sm text-on-surface-variant">Équipe {profile.team}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-outline-variant pt-4">
            <button type="button" className={item} disabled={exportIdeas.isPending} onClick={() => exportIdeas.mutate()}>
              <span aria-hidden="true" className="material-symbols-outlined !text-[20px]">download</span>
              {exportIdeas.isPending ? "Export en cours…" : "Exporter mes idées"}
            </button>
            <Link to="/choisir-role" className={item} onClick={() => setOpen(false)}>
              <span aria-hidden="true" className="material-symbols-outlined !text-[20px]">swap_horiz</span>
              Changer de rôle
            </Link>
            <button type="button" className={item} onClick={() => signOut()}>
              <span aria-hidden="true" className="material-symbols-outlined !text-[20px]">logout</span>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Vrai tant que la page « Vos actions » est la dernière page ouverte (survit aux changements de page, pas au rechargement).
let onActionsPage = false;

export function BrandHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // gcTime 0 : après un changement de rôle, l'en-tête ne montre jamais l'ancien profil.
  const profile = useQuery({ queryKey: ["profile"], queryFn: fetchProfile, retry: false, gcTime: 0 });
  const items = profile.data ? NAV[profile.data.role] : [];
  const badge = useQuery({
    queryKey: ["actions-badge", profile.data?.email],
    queryFn: () => fetchActionsBadge(profile.data!.role, profile.data!.email),
    enabled: !!profile.data,
    retry: false,
    refetchInterval: 60_000,
  });
  const unread = badge.data ?? 0;

  // Les nouveautés sont marquées comme lues quand on QUITTE « Vos actions » (ou ferme l'onglet),
  // pas à l'arrivée : on atterrit sur cette page, la pastille doit rester visible pendant la visite.
  const qc = useQueryClient();
  const email = profile.data?.email;
  useEffect(() => {
    if (!email) return;
    if (pathname === "/actions") {
      onActionsPage = true;
      const onHide = () => markActionsSeen(email);
      window.addEventListener("pagehide", onHide);
      return () => window.removeEventListener("pagehide", onHide);
    }
    if (onActionsPage) {
      onActionsPage = false;
      markActionsSeen(email);
      qc.invalidateQueries({ queryKey: ["actions-badge"] });
    }
  }, [pathname, email, qc]);

  return (
    <header className="border-b border-outline-variant bg-surface-container-lowest">
      <PersonaBar />
      <div className="mx-auto flex min-h-[72px] w-full max-w-interface flex-wrap items-center gap-x-8 gap-y-2 px-sm py-xs md:px-md">
        <Link to="/" className="flex min-w-0 items-center gap-sm" aria-label="Bigger Boat — accueil">
          <img
            src={sharkLogo}
            alt=""
            width={1024}
            height={1024}
            className="h-11 w-14 shrink-0 object-contain"
          />
          <span className="font-label-md text-lg font-bold uppercase text-primary">Bigger Boat</span>
        </Link>
        {items.length > 0 && (
          <nav aria-label="Navigation principale" className="flex flex-wrap items-center gap-2 md:mr-auto">
            {items.map((n) => {
              const current = n.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={current ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center border-b-[3px] px-4 text-base font-semibold text-primary hover:bg-surface-container ${
                    current ? "border-primary" : "border-transparent"
                  }`}
                >
                  {n.label}
                  {n.badge && unread > 0 && (
                    <span
                      aria-hidden="true"
                      className="ml-2 grid h-6 min-w-6 place-items-center rounded-full bg-sev-crit px-1.5 text-sm font-bold leading-none text-white"
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                  {n.badge && unread > 0 && (
                    <span className="sr-only">
                      , {unread} nouveauté{unread > 1 ? "s" : ""} non lue{unread > 1 ? "s" : ""}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-md">
          {profile.data ? (
            <ProfileMenu profile={profile.data} />
          ) : (
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Happy Place</span>
          )}
        </div>
      </div>
    </header>
  );
}
