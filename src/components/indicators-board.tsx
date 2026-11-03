import { TREND_PLAIN, deltaText, formatKpi, type Metric } from "@/lib/dashboard";

const KPIS = [
  { key: "training_kpi", label: "Taux de placement" },
  { key: "active_users", label: "Missions actives" },
] as const;

const TREND_STYLE: Record<Metric["trend"], { cls: string; icon: string }> = {
  hausse: { cls: "border-st-ok bg-st-ok-tint text-st-ok", icon: "arrow_upward" },
  baisse: { cls: "border-st-ko bg-st-ko-tint text-st-ko", icon: "arrow_downward" },
  stable: { cls: "border-st-wait bg-st-wait-tint text-st-wait", icon: "remove" },
};

/** « Indicateurs » : valeur et évolution en chip (hausse en vert, baisse en rouge). */
export function IndicatorsBoard({
  metrics,
  isError,
  className = "",
  order,
}: {
  metrics: Metric[] | undefined;
  isError: boolean;
  className?: string;
  order?: number;
}) {
  return (
    <section
      aria-labelledby="t-ind"
      style={order ? { order } : undefined}
      className={`min-w-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-outline-variant bg-mod-indicateurs-tint p-5">
        <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-[10px] bg-mod-indicateurs text-white">
          <span className="material-symbols-outlined">bar_chart</span>
        </span>
        <h2 id="t-ind" className="flex-1 font-headline-sm text-[28px] leading-tight text-mod-indicateurs">
          Indicateurs
        </h2>
      </div>
      <div className="flex flex-wrap gap-4 p-5">
        {isError && <p className="text-base text-error">Les indicateurs sont indisponibles.</p>}
        {KPIS.map(({ key, label }) => {
          const m = metrics?.find((x) => x.key === key);
          const delta = deltaText(m);
          const t = m ? TREND_STYLE[m.trend] : null;
          return (
            <div
              key={key}
              className="min-w-[200px] flex-1 rounded-[10px] border border-outline-variant bg-white p-5 text-center"
            >
              <p className="text-sm text-on-surface-variant">{label}</p>
              <p className="my-2 font-display text-[44px] leading-[1.1] text-primary">
                {m ? formatKpi(m.value, m.unit) : "—"}
              </p>
              {m && t && (
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
    </section>
  );
}
