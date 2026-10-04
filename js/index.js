// js/index.js — página de inicio: genera las tarjetas de "Destacados" con el DOM
import { cargarProductos } from "./productos.js";

// Ids de los productos que se muestran como destacados
const IDS_DESTACADOS = [1, 2, 3, 4];

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("destacados");
  if (!contenedor) return;

  try {
    const productos = await cargarProductos();
    const destacados = IDS_DESTACADOS
      .map((id) => productos.find((p) => p.id === id))
      .filter(Boolean);
    contenedor.innerHTML = destacados.map((p) => p.tarjetaDestacada()).join("");
  } catch (error) {
    console.error("No se pudieron cargar los destacados:", error);
    contenedor.innerHTML =
      `<p class="alert alert-danger">No pudimos cargar los destacados. Recarga la página.</p>`;
  }
});
