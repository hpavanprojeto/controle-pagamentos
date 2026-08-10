export const HOSPITAIS_CONHECIDOS = ["Unimed", "Tacchini"];
export const STATUS_PAGAMENTO = ["Pendente", "Pago"];

function comparar(a, b) {
  return (a || "").trim().localeCompare((b || "").trim(), undefined, { sensitivity: "base" }) === 0;
}

/**
 * Unimed: fonte pagadora é sempre Unimed, convênio não se aplica.
 * Tacchini + Tacchimed = Tacchimed. Tacchini + qualquer outro convênio (inclusive SUS) = Hospital Tacchini.
 */
export function resolverFontePagadora(hospital, convenio) {
  if (comparar(hospital, "Unimed")) return "Unimed";
  if (comparar(hospital, "Tacchini")) {
    return comparar(convenio, "Tacchimed") ? "Tacchimed" : "Hospital Tacchini";
  }
  return null;
}

export function hospitalReconhecido(hospital) {
  return HOSPITAIS_CONHECIDOS.some((h) => comparar(h, hospital));
}

export function convenioNecessario(hospital) {
  return !comparar(hospital, "Unimed");
}
