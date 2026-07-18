/**
 * Zoom por pinça e duplo toque numa imagem dentro de um contêiner,
 * já que o app desativa o zoom nativo da página (pra não atrapalhar
 * os formulários) e precisa de um zoom próprio só na foto.
 */
export function ativarZoomFoto(imgEl, containerEl) {
  let escala = 1;
  let panX = 0;
  let panY = 0;
  let distanciaInicial = 0;
  let escalaInicial = 1;
  let inicioToqueX = 0;
  let inicioToqueY = 0;
  let ultimoTapTempo = 0;

  function aplicar() {
    imgEl.style.transform = `translate(${panX}px, ${panY}px) scale(${escala})`;
  }

  function distancia(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  containerEl.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        distanciaInicial = distancia(e.touches);
        escalaInicial = escala;
      } else if (e.touches.length === 1) {
        inicioToqueX = e.touches[0].clientX - panX;
        inicioToqueY = e.touches[0].clientY - panY;

        const agora = Date.now();
        if (agora - ultimoTapTempo < 300) {
          if (escala > 1) {
            escala = 1;
            panX = 0;
            panY = 0;
          } else {
            escala = 2.5;
          }
          aplicar();
        }
        ultimoTapTempo = agora;
      }
    },
    { passive: true }
  );

  containerEl.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const nova = distancia(e.touches);
        escala = Math.min(4, Math.max(1, escalaInicial * (nova / distanciaInicial)));
        aplicar();
      } else if (e.touches.length === 1 && escala > 1) {
        e.preventDefault();
        panX = e.touches[0].clientX - inicioToqueX;
        panY = e.touches[0].clientY - inicioToqueY;
        aplicar();
      }
    },
    { passive: false }
  );

  containerEl.addEventListener("touchend", () => {
    if (escala < 1.05) {
      escala = 1;
      panX = 0;
      panY = 0;
      aplicar();
    }
  });
}
