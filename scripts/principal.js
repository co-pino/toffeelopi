import { datos } from "./datos.js";
import { crearEnlaceWhatsApp, crearMensajeGeneral, crearMensajePedido } from "./whatsapp.js";
import "./hero-animacion.js";

const listaProductos = document.querySelector("#lista-productos");
const selectorProducto = document.querySelector("#seleccion-producto");
const selectorVariante = document.querySelector("#seleccion-variante");
const selectorFecha = document.querySelector("#seleccion-fecha");
const selectorSalsa = document.querySelector("#seleccion-salsa");
const grupoFecha = document.querySelector("#grupo-fecha");
const grupoSalsa = document.querySelector("#grupo-salsa");
const enlacePedido = document.querySelector("#enlace-pedido");
const enlaceHero = document.querySelector("#enlace-hero");
const seccionDisponibilidad = document.querySelector("#fecha");
const enlaceDisponibilidad = document.querySelector("#hero-disponibilidad");
const mensajeDisponibilidad = document.querySelector("#mensaje-disponibilidad");
const mensajeCupos = document.querySelector("#mensaje-cupos");

const formatoPrecio = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const formatoFecha = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function fechasFuturas() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return datos.fechas
    .map((fecha) => ({ ...fecha, fechaLocal: new Date(`${fecha.fecha}T00:00:00`) }))
    .filter((fecha) => fecha.fechaLocal >= hoy)
    .sort((a, b) => a.fechaLocal - b.fechaLocal);
}

function observarTarjetas() {
  const tarjetas = listaProductos.querySelectorAll(".producto");
  const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!("IntersectionObserver" in window) || movimientoReducido) {
    return;
  }

  const observador = new IntersectionObserver(
    (entradas, observer) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible");
          observer.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
  );

  tarjetas.forEach((tarjeta) => {
    tarjeta.classList.add("revelar");
    observador.observe(tarjeta);
  });
}

function renderizarDisponibilidad() {
  const fechas = fechasFuturas();
  const hayFechas =
    datos.disponibilidad.modo === "fechas-anunciadas" && fechas.length > 0;

  seccionDisponibilidad.hidden = !hayFechas;
  enlaceDisponibilidad.hidden = !hayFechas;
  selectorFecha.replaceChildren(new Option("Elige una fecha", ""));

  if (!hayFechas) {
    return;
  }

  mensajeDisponibilidad.textContent = formatoFecha.format(fechas[0].fechaLocal);
  mensajeCupos.textContent =
    fechas[0].cupos !== undefined && fechas[0].cupos !== null
      ? `${fechas[0].cupos} cupos disponibles`
      : "";

  fechas.forEach((fecha) => {
    selectorFecha.add(
      new Option(formatoFecha.format(fecha.fechaLocal), fecha.fecha),
    );
  });
}

function renderizarSelectorProductos() {
  selectorProducto.replaceChildren(
    ...datos.productos.map(
      (producto) => new Option(producto.nombre, producto.id),
    ),
  );
  actualizarSelectorVariantes();
}

function productoSeleccionado() {
  return datos.productos.find((producto) => producto.id === selectorProducto.value);
}

function actualizarSelectorVariantes() {
  const producto = productoSeleccionado();
  selectorVariante.replaceChildren(
    ...producto.variantes.map(
      (variante) =>
        new Option(
          `${variante.etiqueta} · ${formatoPrecio.format(variante.precio)}`,
          variante.id,
        ),
    ),
  );
  actualizarOpcionesPedido();
}

function actualizarOpcionesPedido() {
  const producto = productoSeleccionado();
  const hayFechas = fechasFuturas().length > 0;
  const necesitaFecha =
    producto.disponibilidad === "por-fecha" &&
    datos.disponibilidad.modo === "fechas-anunciadas" &&
    hayFechas;

  grupoFecha.hidden = !necesitaFecha;
  grupoSalsa.hidden = !producto.opcionSalsa;
  if (!producto.opcionSalsa) {
    selectorSalsa.value = "aparte";
  }
  actualizarEnlacePedido();
}

function actualizarEnlacePedido() {
  const producto = productoSeleccionado();
  const variante = producto?.variantes.find(
    (opcion) => opcion.id === selectorVariante.value,
  );

  if (!producto || !variante) {
    enlacePedido.href = crearEnlaceWhatsApp(crearMensajeGeneral());
    return;
  }

  const fechaElegida = fechasFuturas().find(
    (opcion) => opcion.fecha === selectorFecha.value,
  );
  const mensaje = crearMensajePedido({
    producto,
    variante,
    fecha: fechaElegida ? formatoFecha.format(fechaElegida.fechaLocal) : "",
    salsa: producto.opcionSalsa ? selectorSalsa.value : "",
  });

  enlacePedido.href = crearEnlaceWhatsApp(mensaje);
}

function mostrarActualizaciones() {
  const fechaPrecios = document.querySelector("#precios-actualizacion");
  const fechaDisponibilidad = document.querySelector("#fecha-actualizacion");

  fechaPrecios.hidden = !datos.preciosVigentesDesde;
  fechaDisponibilidad.hidden = !datos.disponibilidadActualizada;

  if (datos.preciosVigentesDesde) {
    fechaPrecios.textContent = `Precios vigentes desde: ${datos.preciosVigentesDesde}`;
  }

  if (datos.disponibilidadActualizada) {
    fechaDisponibilidad.textContent = `Disponibilidad actualizada el: ${datos.disponibilidadActualizada}`;
  }
}

listaProductos.addEventListener("click", (evento) => {
  const enlace = evento.target.closest("a[data-producto][data-variante]");

  if (!enlace) {
    return;
  }

  evento.preventDefault();
  selectorProducto.value = enlace.dataset.producto;
  actualizarSelectorVariantes();
  selectorVariante.value = enlace.dataset.variante;
  actualizarOpcionesPedido();
  document.querySelector("#pedido").scrollIntoView({ behavior: "auto" });
  enlacePedido.focus({ preventScroll: true });
});

selectorProducto.addEventListener("change", actualizarSelectorVariantes);
selectorVariante.addEventListener("change", actualizarEnlacePedido);
selectorFecha.addEventListener("change", actualizarEnlacePedido);
selectorSalsa.addEventListener("change", actualizarEnlacePedido);

renderizarDisponibilidad();
renderizarSelectorProductos();
mostrarActualizaciones();
enlaceHero.href = crearEnlaceWhatsApp(crearMensajeGeneral());
observarTarjetas();
