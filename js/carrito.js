// js/carrito.js — clase Carrito compartida (pagina2.js y pagina3.js la importan)
//
// Se guarda en localStorage con la clave "carrito".
// Formato: [{ id, nombre, precio, color, talla, cantidad }, ...]

export class Carrito {
  static CLAVE = "carrito";

  constructor() {
    this.items = [];
    this.cargar();
  }

  cargar() {
    try {
      const guardado = JSON.parse(localStorage.getItem(Carrito.CLAVE));
      this.items = Array.isArray(guardado) ? guardado : [];
    } catch {
      this.items = [];
    }
  }

  guardar() {
    try {
      localStorage.setItem(Carrito.CLAVE, JSON.stringify(this.items));
    } catch {
      /* si el navegador bloquea el almacenamiento, el carrito sigue en memoria */
    }
  }

  // Unidades de un producto en el carrito (sumando todas las tallas)
  cantidadDe(id) {
    return this.items
      .filter((i) => i.id === id)
      .reduce((suma, i) => suma + i.cantidad, 0);
  }

  // Valida contra las existencias y agrega. Devuelve { ok, mensaje }
  agregar(producto, talla, cantidad) {
    if (!producto.tallas.includes(talla)) {
      return { ok: false, mensaje: "Elige una talla." };
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return { ok: false, mensaje: "La cantidad debe ser un número entero de 1 o más." };
    }

    const disponible = producto.stock - this.cantidadDe(producto.id);
    if (disponible <= 0) {
      return { ok: false, mensaje: "Este producto está agotado." };
    }
    if (cantidad > disponible) {
      return { ok: false, mensaje: `Solo quedan ${disponible} disponibles.` };
    }

    const existente = this.items.find((i) => i.id === producto.id && i.talla === talla);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      this.items.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        color: producto.color,
        talla,
        cantidad,
      });
    }
    this.guardar();
    return { ok: true, mensaje: `Agregaste ${cantidad} × ${producto.nombre} (talla ${talla}) al carrito.` };
  }

  quitar(id, talla) {
    this.items = this.items.filter((i) => !(i.id === id && i.talla === talla));
    this.guardar();
  }

  vaciar() {
    this.items = [];
    this.guardar();
  }

  cantidadTotal() {
    return this.items.reduce((suma, i) => suma + i.cantidad, 0);
  }

  total() {
    return this.items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
  }
}
