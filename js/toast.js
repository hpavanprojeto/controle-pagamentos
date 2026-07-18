let timer = null;

export function mostrarToast(mensagem) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = mensagem;
  el.classList.add("mostrar");
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove("mostrar"), 2400);
}
