import { datos } from "./datos.js";

const etiquetaPedido = "(Pedido desde la web)";

export function crearEnlaceWhatsApp(mensaje) {
  return `https://wa.me/${datos.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

export function crearMensajeGeneral() {
  return `Hola, quiero consultar por la disponibilidad de los postres. ${etiquetaPedido}`;
}

export function crearMensajePedido({ producto, variante, fecha, salsa }) {
  const inicio = `Hola, quiero encargar ${producto.articulo} ${producto.nombre.toLowerCase()} (${variante.etiqueta}).`;
  const fechaPedido = fecha
    ? ` Para el ${fecha}.`
    : producto.disponibilidad === "por-fecha"
      ? " ¿Me indican la próxima fecha disponible?"
      : "";
  const seleccionSalsa = producto.opcionSalsa && salsa ? ` Quiero la salsa ${salsa}.` : "";

  return `${inicio}${fechaPedido}${seleccionSalsa} ${etiquetaPedido}`;
}
