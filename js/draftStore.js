let rascunhoPendente = null;

export function definirRascunho(rascunho) {
  rascunhoPendente = rascunho;
}

export function consumirRascunho() {
  const r = rascunhoPendente;
  rascunhoPendente = null;
  return r;
}
