import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState } from "react";
import { TREND_PLAIN, deltaText, formatKpi, type Metric } from "@/lib/dashboard";
import { DEFAULT_KPIS, getKpiSelection, resetKpiSelection, setKpiSelection } from "@/lib/kpi-selection";

const TREND_STYLE: Record<Metric["trend"], { cls: string; icon: string }> = {
  hausse: { cls: "border-st-ok bg-st-ok-tint text-st-ok", icon: "arrow_upward" },
  baisse: { cls: "border-st-ko bg-st-ko-tint text-st-ko", icon: "arrow_downward" },
  stable: { cls: "border-st-wait bg-st-wait-tint text-st-wait", icon: "remove" },
};

/** « Indicateurs » : valeur et évolution en chip (hausse en vert, baisse en rouge). */
export function IndicatorsBoard({
  metrics,
  isError,
  email,
  className = "",
  order,
}: {
  metrics: Metric[] | undefined;
  isError: boolean;
  email: string;
  className?: string;
  order?: number;
}) {
  const [selected, setSelected] = useState<string[]>(() => getKpiSelection(email));
  const [picking, setPicking] = useState(false);
  const shown = (metrics ?? []).filter((m) => selected.includes(m.key));

  function toggle(key: string) {
    const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
    setSelected(next);
    setKpiSelection(email, next);
  }

  function reset() {
    resetKpiSelection(email);
    setSelected(DEFAULT_KPIS);
  }

  return (
    <section
      aria-labelledby="t-ind"
      style={order ? { order } : undefined}
      className={`min-w-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant bg-mod-indicateurs-tint p-5">
        <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-mod-indicateurs text-white">
          <span className="material-symbols-outlined">bar_chart</span>
        </span>
        <h2 id="t-ind" className="flex-1 font-headline-sm text-[28px] leading-tight text-mod-indicateurs">
          Indicateurs
        </h2>
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-mod-indicateurs bg-white px-5 text-base font-semibold text-mod-indicateurs hover:bg-surface-container"
        >
          <span aria-hidden="true" className="material-symbols-outlined">tune</span>
          Choisir mes indicateurs
        </button>
      </div>
      <div className="flex flex-wrap gap-4 p-5">
        {isError && <p className="text-base text-error">Les indicateurs sont indisponibles.</p>}
        {!isError && metrics && shown.length === 0 && (
          <p className="text-base text-on-surface-variant">
            Aucun indicateur sélectionné. Utilisez « Choisir mes indicateurs » pour en afficher.
          </p>
        )}
        {shown.map((m) => {
          const { key, label } = m;
          const delta = deltaText(m);
          const t = TREND_STYLE[m.trend];
          return (
            <div
              key={key}
              className="min-w-[200px] flex-1 rounded-[12px] border border-outline-variant bg-white p-5 text-center"
            >
              <p className="text-sm text-on-surface-variant">{label}</p>
              <p className="my-2 font-display text-[44px] leading-[1.1] text-primary">
                {formatKpi(m.value, m.unit)}
              </p>
              {t && (
                <p className="flex justify-center">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-base font-semibold ${t.cls}`}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined !text-[18px]">
                      {t.icon}
                    </span>
                    {TREND_PLAIN[m.trend]}
                    {delta && ` · ${delta}`}
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      <DialogPrimitive.Root open={picking} onOpenChange={setPicking}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(27,28,28,0.55)]" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-primary bg-white p-6 focus:outline-none">
            <DialogPrimitive.Title className="font-headline-sm text-[28px] leading-tight text-mod-indicateurs">
              Choisir mes indicateurs
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-base">
              Cochez les indicateurs à afficher dans votre vue d'ensemble. Votre choix est enregistré sur cet appareil.
            </DialogPrimitive.Description>
            <p className="text-sm font-semibold text-on-surface-variant" role="status">
              {shown.length} sur {metrics?.length ?? 0} affiché{shown.length > 1 ? "s" : ""}
            </p>
            <ul className="-mx-1 flex flex-col gap-2 overflow-y-auto px-1">
              {(metrics ?? []).map((m) => (
                <li key={m.key}>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-outline-variant bg-[#FAFAF7] px-4 py-2 has-[:checked]:border-mod-indicateurs has-[:checked]:bg-mod-indicateurs-tint">
                    <input
                      type="checkbox"
                      checked={selected.includes(m.key)}
                      onChange={() => toggle(m.key)}
                      className="size-5 shrink-0 accent-[var(--color-mod-indicateurs)]"
                    />
                    <span className="min-w-0 flex-1 font-semibold wrap-anywhere">{m.label}</span>
                    <span className="shrink-0 text-sm text-on-surface-variant">{formatKpi(m.value, m.unit)}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap justify-between gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-12 items-center rounded-lg border border-primary px-5 text-base font-semibold text-primary hover:bg-surface-container"
              >
                Rétablir par défaut
              </button>
              <DialogPrimitive.Close className="inline-flex min-h-12 items-center rounded-lg bg-primary px-5 text-base font-semibold text-on-primary hover:opacity-90">
                Terminer
              </DialogPrimitive.Close>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </section>
  );
}
