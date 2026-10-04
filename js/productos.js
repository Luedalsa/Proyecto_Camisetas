// js/productos.js — clase Productos y datos compartidos (index.js y pagina2.js la importan)
//
// Hoy los datos son de ejemplo; después pueden venir de la base de datos.
// Para cambiar a Supabase solo hay que reemplazar el cuerpo de cargarProductos().

/* ========================================================================
   POO: Productos
   ======================================================================== */
export class Productos {
  constructor({ id, nombre, descripcion, material, precio, color, colorNombre,
                stock, tallas = ["S", "M", "L", "XL"], etiqueta = "" }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.material = material;
    this.precio = precio;
    this.color = color;
    this.colorNombre = colorNombre;
    this.stock = stock;
    this.tallas = tallas;
    this.etiqueta = etiqueta;
  }

  get precioMXN() {
    return this.precio.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  }

  // Camiseta dibujada en SVG con el color del producto
  svg() {
    return `
      <svg viewBox="0 0 100 100" role="img" aria-label="Camiseta ${this.nombre}">
        <path d="M30 10 L10 25 L20 40 L28 35 L28 90 L72 90 L72 35 L80 40 L90 25 L70 10 Q50 24 30 10 Z"
              fill="${this.color}" stroke="#212529" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`;
  }

  insignia() {
    return this.etiqueta
      ? `<span class="badge text-bg-warning position-absolute top-0 start-0 m-2">${this.etiqueta}</span>`
      : "";
  }

  // Tarjeta corta para "Destacados" del inicio
  tarjetaDestacada() {
    return `
      <div class="col-sm-6 col-lg-3">
        <article class="card producto h-100 position-relative">
          ${this.insignia()}
          <div class="producto-imagen text-center">${this.svg()}</div>
          <div class="card-body d-flex flex-column">
            <h3 class="h6 card-title">${this.nombre}</h3>
            <p class="fw-bold mb-3">${this.precioMXN}</p>
            <a href="pagina2.html#producto-${this.id}" class="btn btn-outline-dark btn-sm mt-auto">Ver más</a>
          </div>
        </article>
      </div>`;
  }

  // Tarjeta completa del catálogo.
  // Las existencias y el estado de los botones los pone actualizarTarjeta() en pagina2.js
  tarjeta() {
    const opcionesTalla = this.tallas
      .map((t) => `<option value="${t}">${t}</option>`)
      .join("");

    return `
      <div class="col-sm-6 col-xl-3">
        <article class="card producto h-100 position-relative" id="producto-${this.id}"
                 data-id="${this.id}" aria-labelledby="titulo-${this.id}">
          ${this.insignia()}
          <span class="badge text-bg-secondary position-absolute top-0 end-0 m-2 d-none" data-agotado>Agotado</span>
          <div class="producto-imagen text-center">${this.svg()}</div>
          <div class="card-body d-flex flex-column">
            <h2 id="titulo-${this.id}" class="h6 card-title">${this.nombre}</h2>
            <p class="small text-secondary mb-1">${this.descripcion}</p>
            <p class="small text-secondary mb-2">${this.material} · Color: ${this.colorNombre}</p>
            <p class="fw-bold mb-1">${this.precioMXN}</p>
            <p class="small mb-3" data-stock></p>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <label for="talla-${this.id}" class="form-label small mb-1">Talla</label>
                <select id="talla-${this.id}" class="form-select form-select-sm" data-talla>
                  ${opcionesTalla}
                </select>
              </div>
              <div class="col-6">
                <label for="cant-${this.id}" class="form-label small mb-1">Cantidad</label>
                <input id="cant-${this.id}" type="number" class="form-control form-control-sm"
                       min="1" value="1" inputmode="numeric" data-cantidad>
              </div>
            </div>

            <button type="button" class="btn btn-brand mt-auto" data-accion="agregar"
                    aria-label="Agregar ${this.nombre} al carrito">Agregar al carrito</button>
          </div>
        </article>
      </div>`;
  }
}

/* ========================================================================
   Datos de ejemplo
   ======================================================================== */
const PRODUCTOS_EJEMPLO = [
  { id: 1, nombre: "Camiseta Clásica Naranja", precio: 249, color: "#e08524", colorNombre: "Naranja",
    stock: 12, etiqueta: "Novedad", material: "Algodón 100%",
    descripcion: "Corte recto y tela suave. La base ideal para estampar tu arte." },
  { id: 2, nombre: "Camiseta Negra Básica", precio: 229, color: "#2b2b2b", colorNombre: "Negro",
    stock: 8, material: "Algodón 100%",
    descripcion: "El negro de siempre, con cuello reforzado que no se deforma." },
  { id: 3, nombre: "Camiseta Azul Océano", precio: 259, color: "#2f6fb5", colorNombre: "Azul",
    stock: 5, etiqueta: "Popular", material: "Algodón peinado",
    descripcion: "Azul profundo que resalta los diseños claros." },
  { id: 4, nombre: "Camiseta Blanca Lienzo", precio: 219, color: "#f4f4f4", colorNombre: "Blanco",
    stock: 3, material: "Algodón 100%",
    descripcion: "Un lienzo en blanco, perfecto para colores vivos." },
  { id: 5, nombre: "Camiseta Verde Bosque", precio: 249, color: "#2e7d4f", colorNombre: "Verde",
    stock: 10, material: "Algodón peinado",
    descripcion: "Verde oscuro, fresco y discreto para uso diario." },
  { id: 6, nombre: "Camiseta Roja Carmín", precio: 259, color: "#c0392b", colorNombre: "Rojo",
    stock: 6, material: "Algodón peinado",
    descripcion: "Rojo intenso con tela de gramaje medio." },
  { id: 7, nombre: "Camiseta Gris Jaspeado", precio: 239, color: "#9aa0a6", colorNombre: "Gris",
    stock: 0, material: "Mezcla algodón-poliéster",
    descripcion: "Gris con textura jaspeada, ligera y resistente al lavado." },
  { id: 8, nombre: "Camiseta Morada Atardecer", precio: 269, color: "#6b4fa0", colorNombre: "Morado",
    stock: 7, etiqueta: "Novedad", material: "Algodón peinado",
    descripcion: "Morado de edición limitada, con acabado suave." },
];

export async function cargarProductos() {
  return PRODUCTOS_EJEMPLO.map((datos) => new Productos(datos));
}
