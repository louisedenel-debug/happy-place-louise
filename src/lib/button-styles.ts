// Une seule forme de bouton pour toute l'app : angles arrondis, texte en casse normale, gras.
// Variantes « Sm » pour les lignes denses (listes d'utilisateurs, par exemple).
const base = "inline-flex items-center justify-center rounded-lg font-semibold";
const big = `${base} min-h-12 px-5 text-base`;
const small = `${base} min-h-10 px-4 text-sm`;

export const btnPrimary = `${big} bg-primary text-on-primary hover:opacity-90 disabled:opacity-60`;
export const btnSecondary = `${big} border border-primary text-primary hover:bg-surface-container disabled:opacity-50`;
export const btnDanger = `${big} bg-sev-crit text-white hover:opacity-90 disabled:opacity-60`;
export const btnDangerOutline = `${big} border border-sev-crit text-sev-crit hover:bg-sev-crit-tint disabled:opacity-50`;

export const btnPrimarySm = `${small} bg-primary text-on-primary hover:opacity-90 disabled:opacity-60`;
export const btnSecondarySm = `${small} border border-primary text-primary hover:bg-surface-container disabled:opacity-50`;
export const btnDangerOutlineSm = `${small} border border-sev-crit text-sev-crit hover:bg-sev-crit-tint disabled:opacity-50`;
