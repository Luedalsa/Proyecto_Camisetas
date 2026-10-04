// js/index.js — página de inicio: genera las tarjetas de "Destacados" con el DOM

// Clase simple (cubre el requisito de programación orientada a objetos)
class Producto {
  constructor(id, nombre, precio, color, etiqueta = "") {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.color = color;
    this.etiqueta = etiqueta;
  }

  // Camiseta dibujada en SVG con el color del producto
  svg() {
    return `
      <svg viewBox="0 0 100 100" role="img" aria-label="Camiseta ${this.nombre}">
        <path d="M30 10 L10 25 L20 40 L28 35 L28 90 L72 90 L72 35 L80 40 L90 25 L70 10 Q50 24 30 10 Z"
              fill="${this.color}" stroke="#212529" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`;
  }

  tarjeta() {
    const precio = this.precio.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
    const insignia = this.etiqueta
      ? `<span class="badge text-bg-warning position-absolute top-0 start-0 m-2">${this.etiqueta}</span>`
      : "";

    return `
      <div class="col-sm-6 col-lg-3">
        <article class="card producto h-100 position-relative">
          ${insignia}
          <div class="producto-imagen text-center">${this.svg()}</div>
          <div class="card-body d-flex flex-column">
            <h3 class="h6 card-title">${this.nombre}</h3>
            <p class="fw-bold mb-3">${precio}</p>
            <a href="pagina2.html#producto-${this.id}" class="btn btn-outline-dark btn-sm mt-auto">Ver más</a>
          </div>
        </article>
      </div>`;
  }
}

// Datos de ejemplo: luego pueden venir de la base de datos
const destacados = [
  new Producto(1, "Camiseta Clásica Naranja", 249, "#e08524", "Novedad"),
  new Producto(2, "Camiseta Negra Básica", 229, "#2b2b2b"),
  new Producto(3, "Camiseta Azul Océano", 259, "#2f6fb5", "Popular"),
  new Producto(4, "Camiseta Blanca Lienzo", 219, "#f4f4f4"),
];

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("destacados");
  if (!contenedor) return;
  contenedor.innerHTML = destacados.map((p) => p.tarjeta()).join("");
});
