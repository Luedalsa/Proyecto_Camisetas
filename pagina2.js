// js/pagina2.js — catálogo de productos y carrito de compras

/* ========================================================================
   POO: Producto
   ======================================================================== */
class Producto {
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

  // Las existencias y el estado de los botones los pone actualizarTarjeta()
  tarjeta() {
    const insignia = this.etiqueta
      ? `<span class="badge text-bg-warning position-absolute top-0 start-0 m-2">${this.etiqueta}</span>`
      : "";
    const opcionesTalla = this.tallas
      .map((t) => `<option value="${t}">${t}</option>`)
      .join("");

    return `
      <div class="col-sm-6 col-xl-3">
        <article class="card producto h-100 position-relative" id="producto-${this.id}"
                 data-id="${this.id}" aria-labelledby="titulo-${this.id}">
          ${insignia}
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
   POO: Carrito (se guarda en localStorage para que pagina3.html lo lea)
   Formato guardado en la clave "carrito":
   [{ id, nombre, precio, color, talla, cantidad }, ...]
   ======================================================================== */
class Carrito {
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

  cantidadTotal() {
    return this.items.reduce((suma, i) => suma + i.cantidad, 0);
  }

  total() {
    return this.items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
  }
}

/* ========================================================================
   Datos. Hoy son de ejemplo; después pueden venir de la base de datos.
   Para cambiar a Supabase solo hay que reemplazar el cuerpo de cargarProductos().
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

async function cargarProductos() {
  return PRODUCTOS_EJEMPLO.map((datos) => new Producto(datos));
}

/* ========================================================================
   Interfaz (DOM)
   ======================================================================== */
const carrito = new Carrito();
let productos = [];

const $catalogo = document.getElementById("catalogo");
const $sinResultados = document.getElementById("sin-resultados");
const $buscador = document.getElementById("buscador");
const $filtroColor = document.getElementById("filtro-color");
const $orden = document.getElementById("orden");
const $contador = document.getElementById("contador-carrito");
const $estado = document.getElementById("estado-carrito");
const $aviso = document.getElementById("aviso");
const $avisoTexto = document.getElementById("aviso-texto");

function mostrarAviso(mensaje, ok) {
  $avisoTexto.textContent = mensaje;
  $aviso.classList.remove("text-bg-success", "text-bg-danger");
  $aviso.classList.add(ok ? "text-bg-success" : "text-bg-danger");
  bootstrap.Toast.getOrCreateInstance($aviso, { delay: 3000 }).show();
}

function actualizarContador() {
  const total = carrito.cantidadTotal();
  $contador.textContent = total;
  $estado.textContent = `Tu carrito tiene ${total} ${total === 1 ? "artículo" : "artículos"}.`;
}

// Refresca existencias y estado de los controles de una sola tarjeta
// (así no se pierden la talla y la cantidad que el usuario ya eligió en las demás)
function actualizarTarjeta(producto) {
  const tarjeta = document.getElementById(`producto-${producto.id}`);
  if (!tarjeta) return;

  const enCarrito = carrito.cantidadDe(producto.id);
  const disponible = producto.stock - enCarrito;
  const agotado = disponible <= 0;

  const $stock = tarjeta.querySelector("[data-stock]");
  if (producto.stock === 0) {
    $stock.textContent = "Sin existencias";
  } else if (agotado) {
    $stock.textContent = "Ya tienes todas las existencias en tu carrito";
  } else {
    $stock.textContent = `Quedan ${disponible}` + (enCarrito ? ` (ya tienes ${enCarrito} en tu carrito)` : "");
  }
  $stock.classList.toggle("text-danger", agotado || disponible <= 3);
  $stock.classList.toggle("text-success", !agotado && disponible > 3);

  tarjeta.querySelector("[data-agotado]").classList.toggle("d-none", !agotado);
  tarjeta.classList.toggle("producto-agotado", agotado);

  const $cantidad = tarjeta.querySelector("[data-cantidad]");
  $cantidad.max = Math.max(disponible, 1);
  if (!agotado && Number($cantidad.value) > disponible) $cantidad.value = disponible;
  $cantidad.disabled = agotado;

  tarjeta.querySelector("[data-talla]").disabled = agotado;

  const $boton = tarjeta.querySelector("[data-accion='agregar']");
  $boton.disabled = agotado;
  $boton.textContent = agotado ? "Agotado" : "Agregar al carrito";
}

// Aplica buscador, color y orden; vuelve a dibujar el catálogo
function mostrarCatalogo() {
  const texto = $buscador.value.trim().toLowerCase();
  const color = $filtroColor.value;

  let lista = productos.filter((p) =>
    (!texto || `${p.nombre} ${p.colorNombre}`.toLowerCase().includes(texto)) &&
    (!color || p.colorNombre === color)
  );

  switch ($orden.value) {
    case "precio-asc":  lista.sort((a, b) => a.precio - b.precio); break;
    case "precio-desc": lista.sort((a, b) => b.precio - a.precio); break;
    default:            lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  $catalogo.innerHTML = lista.map((p) => p.tarjeta()).join("");
  lista.forEach(actualizarTarjeta);
  $sinResultados.classList.toggle("d-none", lista.length > 0);
}

function llenarFiltroColor() {
  const colores = [...new Set(productos.map((p) => p.colorNombre))].sort((a, b) => a.localeCompare(b, "es"));
  $filtroColor.innerHTML =
    `<option value="">Todos</option>` + colores.map((c) => `<option value="${c}">${c}</option>`).join("");
}

// Si llegas desde "Ver más" del inicio (pagina2.html#producto-3), se resalta esa tarjeta
function resaltarDesdeHash() {
  if (!/^#producto-\d+$/.test(location.hash)) return;
  const tarjeta = document.querySelector(location.hash);
  if (!tarjeta) return;
  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  tarjeta.scrollIntoView({ behavior: sinMovimiento ? "auto" : "smooth", block: "center" });
  tarjeta.classList.add("resaltado");
  setTimeout(() => tarjeta.classList.remove("resaltado"), 2000);
}

/* ------------------------------------------------------------------------
   Eventos
   ------------------------------------------------------------------------ */
// Un solo listener para todos los botones "Agregar" (delegación de eventos)
$catalogo.addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-accion='agregar']");
  if (!boton) return;

  const tarjeta = boton.closest("[data-id]");
  const producto = productos.find((p) => p.id === Number(tarjeta.dataset.id));
  const talla = tarjeta.querySelector("[data-talla]").value;
  const cantidad = Number(tarjeta.querySelector("[data-cantidad]").value);

  const resultado = carrito.agregar(producto, talla, cantidad);
  mostrarAviso(resultado.mensaje, resultado.ok);

  if (resultado.ok) {
    tarjeta.querySelector("[data-cantidad]").value = 1;
    actualizarTarjeta(producto);
    actualizarContador();
  }
});

$buscador.addEventListener("input", mostrarCatalogo);
$filtroColor.addEventListener("change", mostrarCatalogo);
$orden.addEventListener("change", mostrarCatalogo);

document.getElementById("limpiar-filtros").addEventListener("click", () => {
  $buscador.value = "";
  $filtroColor.value = "";
  $orden.value = "nombre";
  mostrarCatalogo();
});

// Si el carrito cambia en otra pestaña (o en pagina3.html), se sincroniza aquí
window.addEventListener("storage", (evento) => {
  if (evento.key !== Carrito.CLAVE) return;
  carrito.cargar();
  productos.forEach(actualizarTarjeta);
  actualizarContador();
});

/* ------------------------------------------------------------------------
   Inicio
   ------------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    productos = await cargarProductos();
  } catch (error) {
    console.error("No se pudieron cargar los productos:", error);
    $catalogo.innerHTML = `<p class="alert alert-danger">No pudimos cargar los productos. Recarga la página para intentar de nuevo.</p>`;
    return;
  }
  llenarFiltroColor();
  mostrarCatalogo();
  actualizarContador();
  resaltarDesdeHash();
});
