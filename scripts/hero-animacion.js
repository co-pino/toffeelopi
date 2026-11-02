const configuracion = {
  activarScroll: true,
  activarCursor: true,
  reduccionMovil: 0.55,
  suavizado: 0.12,
  velocidadScroll: {
    fondo: 0.55,
    principal: 1,
    arriba: 1.35,
    abajo: 1.1,
  },
  distanciaScrollMaxima: {
    fondo: -26,
    principal: 38,
    arriba: -18,
    abajo: 24,
  },
  distanciaRevelado: {
    arriba: 34,
    abajo: 42,
  },
  opacidadInicial: {
    fondo: 1,
    principal: 1,
    arriba: 0.82,
    abajo: 0.76,
  },
  desplazamientoCursor: {
    fondo: 7,
    principal: 13,
    arriba: 18,
    abajo: 10,
  },
};

const hero = document.querySelector(".hero");
const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)");
const cursorFino = window.matchMedia("(hover: hover) and (pointer: fine)");

if (hero && !movimientoReducido.matches) {
  const capas = [
    { selector: ".profundidad-fondo", scroll: "fondo", cursor: "fondo" },
    { selector: ".profundidad-principal", scroll: "principal", cursor: "principal" },
    { selector: ".profundidad-arriba", scroll: "arriba", cursor: "arriba" },
    { selector: ".profundidad-abajo", scroll: "abajo", cursor: "abajo" },
  ]
    .map((capa) => ({ ...capa, elemento: hero.querySelector(capa.selector) }))
    .filter((capa) => capa.elemento);

  let visible = false;
  let cuadroPendiente = 0;
  let inicioHero = 0;
  let altoHero = 1;
  let objetivoCursorX = 0;
  let objetivoCursorY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let progresoScroll = 0;

  const valoresMoviles = window.matchMedia("(max-width: 700px)");

  function programarCuadro() {
    if (!cuadroPendiente && visible) {
      cuadroPendiente = window.requestAnimationFrame(actualizarCapas);
    }
  }

  function actualizarCapas() {
    cuadroPendiente = 0;
    const suavizado = configuracion.suavizado;
    cursorX += (objetivoCursorX - cursorX) * suavizado;
    cursorY += (objetivoCursorY - cursorY) * suavizado;

    const factorMovil = valoresMoviles.matches ? configuracion.reduccionMovil : 1;
    const cursorActivo = configuracion.activarCursor && cursorFino.matches;
    let quedaMovimiento = false;

    capas.forEach((capa) => {
      const progresoCapa = Math.min(1, progresoScroll * configuracion.velocidadScroll[capa.scroll]);
      const distanciaScroll = configuracion.activarScroll
        ? configuracion.distanciaScrollMaxima[capa.scroll] * factorMovil * progresoCapa
        : 0;
      const desplazamientoRevelado =
        configuracion.distanciaRevelado[capa.scroll] !== undefined
          ? configuracion.distanciaRevelado[capa.scroll] * (1 - progresoCapa) * factorMovil
          : 0;
      const factorCursor = cursorActivo
        ? configuracion.desplazamientoCursor[capa.cursor]
        : 0;
      const x = cursorX * factorCursor;
      const y = distanciaScroll + desplazamientoRevelado + cursorY * factorCursor;

      capa.elemento.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      const opacidadInicial = configuracion.opacidadInicial[capa.scroll];
      capa.elemento.style.opacity = String(
        opacidadInicial + (1 - opacidadInicial) * progresoCapa,
      );
      quedaMovimiento ||= Math.abs(objetivoCursorX - cursorX) > 0.05;
      quedaMovimiento ||= Math.abs(objetivoCursorY - cursorY) > 0.05;
    });

    if (quedaMovimiento) {
      programarCuadro();
    }
  }

  function alHacerScroll() {
    const recorrido = Math.max(altoHero * 0.48, 1);
    progresoScroll = Math.min(1, Math.max(0, (window.scrollY - inicioHero) / recorrido));
    programarCuadro();
  }

  function alMoverCursor(evento) {
    objetivoCursorX = (evento.clientX / window.innerWidth - 0.5) * 2;
    objetivoCursorY = (evento.clientY / window.innerHeight - 0.5) * 2;
    programarCuadro();
  }

  const observador = new IntersectionObserver(
    ([entrada]) => {
      if (entrada.isIntersecting) {
        visible = true;
        inicioHero = window.scrollY + entrada.boundingClientRect.top;
        altoHero = entrada.boundingClientRect.height;
        if (configuracion.activarScroll) {
          window.addEventListener("scroll", alHacerScroll, { passive: true });
        }
        if (configuracion.activarCursor && cursorFino.matches) {
          window.addEventListener("pointermove", alMoverCursor, { passive: true });
        }
      } else if (visible) {
        visible = false;
        window.removeEventListener("scroll", alHacerScroll);
        window.removeEventListener("pointermove", alMoverCursor);
        if (cuadroPendiente) {
          window.cancelAnimationFrame(cuadroPendiente);
          cuadroPendiente = 0;
        }
      }
    },
    { threshold: 0 },
  );

  observador.observe(hero);
  movimientoReducido.addEventListener("change", (evento) => {
    if (evento.matches) {
      observador.disconnect();
      visible = false;
      window.removeEventListener("scroll", alHacerScroll);
      window.removeEventListener("pointermove", alMoverCursor);
      capas.forEach((capa) => {
        capa.elemento.style.removeProperty("transform");
        capa.elemento.style.removeProperty("opacity");
      });
    }
  });
}
