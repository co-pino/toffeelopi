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

function crearImagen(producto) {
  if (!producto.imagen) {
    return null;
  }

  const figura = document.createElement("figure");
  figura.className = "producto__foto";
  const imagen = document.createElement("img");
  imagen.src = producto.imagen;
  imagen.srcset = `${producto.imagen} ${producto.anchoImagen}w`;
  imagen.sizes = "(min-width: 1200px) 350px, (min-width: 720px) 46vw, calc(100vw - 40px)";
  imagen.alt = `Fotografía de ${producto.nombre.toLowerCase()}`;
  imagen.width = producto.anchoImagen;
  imagen.height = producto.altoImagen;
  imagen.loading = "lazy";
  imagen.decoding = "async";
  figura.append(imagen);
  return figura;
}

function crearTarjetaProducto(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "producto revelar";

  const imagen = crearImagen(producto);
  if (imagen) {
    tarjeta.append(imagen);
  }

  const contenido = document.createElement("div");
  contenido.className = "producto__contenido";

  const titulo = document.createElement("h3");
  titulo.textContent = producto.nombre;
  contenido.append(titulo);

  if (producto.descripcion) {
    const descripcion = document.createElement("p");
    descripcion.className = "producto__descripcion";
    descripcion.textContent = producto.descripcion;
    contenido.append(descripcion);
  }

  const variantes = document.createElement("ul");
  variantes.className = "producto__variantes";

  producto.variantes.forEach((variante) => {
    const fila = document.createElement("li");
    fila.className = "producto__variante";

    const detalle = document.createElement("div");
    detalle.className = "producto__detalle-variante";

    const etiqueta = document.createElement("span");
    etiqueta.textContent = variante.etiqueta;

    const precio = document.createElement("strong");
    precio.textContent = formatoPrecio.format(variante.precio);

    const boton = document.createElement("button");
    boton.className = "boton-elegir";
    boton.type = "button";
    boton.textContent = "Pedir";
    boton.dataset.producto = producto.id;
    boton.dataset.variante = variante.id;
    boton.setAttribute(
      "aria-label",
      `Pedir ${producto.articulo} ${producto.nombre.toLowerCase()}, ${variante.etiqueta}, ${formatoPrecio.format(variante.precio)}`,
    );

    detalle.append(etiqueta, precio);
    fila.append(detalle);

    if (variante.id === "trozo") {
      fila.classList.add("producto__variante--con-foto");
      const espacioFoto = document.createElement("span");
      espacioFoto.className = "producto__foto-trozo";
      espacioFoto.setAttribute("aria-hidden", "true");
      fila.append(espacioFoto);
    }

    fila.append(boton);
    variantes.append(fila);
  });

  contenido.append(variantes);
  tarjeta.append(contenido);
  return tarjeta;
}

function renderizarProductos() {
  listaProductos.replaceChildren(...datos.productos.map(crearTarjetaProducto));
  observarTarjetas();
}

function observarTarjetas() {
  const tarjetas = listaProductos.querySelectorAll(".revelar");
  const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!("IntersectionObserver" in window) || movimientoReducido) {
    tarjetas.forEach((tarjeta) => tarjeta.classList.add("visible"));
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

  tarjetas.forEach((tarjeta) => observador.observe(tarjeta));
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
  const boton = evento.target.closest("[data-producto][data-variante]");

  if (!boton) {
    return;
  }

  selectorProducto.value = boton.dataset.producto;
  actualizarSelectorVariantes();
  selectorVariante.value = boton.dataset.variante;
  actualizarOpcionesPedido();
  document.querySelector("#pedido").scrollIntoView({ behavior: "auto" });
  enlacePedido.focus({ preventScroll: true });
});

selectorProducto.addEventListener("change", actualizarSelectorVariantes);
selectorVariante.addEventListener("change", actualizarEnlacePedido);
selectorFecha.addEventListener("change", actualizarEnlacePedido);
selectorSalsa.addEventListener("change", actualizarEnlacePedido);

renderizarProductos();
renderizarDisponibilidad();
renderizarSelectorProductos();
mostrarActualizaciones();
enlaceHero.href = crearEnlaceWhatsApp(crearMensajeGeneral());
