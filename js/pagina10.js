// js/pagina10.js — diseñador de camisetas (Fabric.js)
import { Canvas, Path, Rect, IText, FabricImage, util } from "fabric";
import { jsPDF } from "jspdf";
import { cargarProductos } from "./productos.js";
import { supabase } from "./supabase.js";

/* ========================================================================
   Constantes
   ======================================================================== */
const TAMANO = 500; // el lienzo es cuadrado: 500 × 500 px

// Mismo dibujo de camiseta que usan los productos (viewBox 100 × 100)
const CAMISETA_PATH =
  "M30 10 L10 25 L20 40 L28 35 L28 90 L72 90 L72 35 L80 40 L90 25 L70 10 Q50 24 30 10 Z";

// Área de impresión (pecho). Lo que quede fuera se recorta.
const AREA = { left: 175, top: 135, width: 150, height: 220 };
const CENTRO = { x: AREA.left + AREA.width / 2, y: AREA.top + AREA.height / 2 };

const CLAVE_GUARDADO = "diseno-camiseta";
const TABLA_DISENOS = "disenos";
const TIPOS_IMAGEN = ["image/png", "image/jpeg", "image/webp"];
const MAX_ARCHIVO = 8 * 1024 * 1024; // 8 MB
const MAX_LADO = 800;                 // las imágenes se reducen a 800 px por lado
const PASO = 5;
const PASO_GRANDE = 20;

/* ========================================================================
   Estado
   ======================================================================== */
let canvas;
let camiseta;          // Path de la camiseta (fondo, no seleccionable)
let guia;              // Rect punteado del área de impresión
let productos = [];
let productoActual = null;
let modificado = false; // hay cambios sin guardar
let cargando = false;   // true mientras se arma o se restaura el lienzo

/* ========================================================================
   Referencias al DOM
   ======================================================================== */
const $editor = document.getElementById("editor");
const $avisoMovil = document.getElementById("aviso-movil");
const $lienzo = document.getElementById("lienzo");
const $camiseta = document.getElementById("camiseta");
const $archivo = document.getElementById("archivo-imagen");
const $textoNuevo = document.getElementById("texto-nuevo");
const $textoFuente = document.getElementById("texto-fuente");
const $textoColor = document.getElementById("texto-color");
const $escala = document.getElementById("escala");
const $escalaValor = document.getElementById("escala-valor");
const $angulo = document.getElementById("angulo");
const $anguloValor = document.getElementById("angulo-valor");
const $capas = document.getElementById("lista-capas");
const $capasVacio = document.getElementById("capas-vacio");
const $guardado = document.getElementById("estado-guardado");
const $estadoSeleccion = document.getElementById("estado-seleccion");
const $guardar = document.getElementById("btn-guardar");
const $cargar = document.getElementById("btn-cargar");
const $pdf = document.getElementById("btn-pdf");
const $limpiar = document.getElementById("btn-limpiar");
const $aviso = document.getElementById("aviso");
const $avisoTexto = document.getElementById("aviso-texto");

/* ========================================================================
   Utilidades
   ======================================================================== */
function mostrarAviso(mensaje, ok = true) {
  $avisoTexto.textContent = mensaje;
  $aviso.classList.remove("text-bg-success", "text-bg-danger");
  $aviso.classList.add(ok ? "text-bg-success" : "text-bg-danger");
  bootstrap.Toast.getOrCreateInstance($aviso, { delay: 3000 }).show();
}

// Para elegir el color del contorno de la guía según la camiseta
function esOscuro(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const luz = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luz < 0.5;
}

const limitar = (valor, min, max) => Math.min(max, Math.max(min, valor));
const normalizarAngulo = (a) => ((((a + 180) % 360) + 360) % 360) - 180;

const esFondo = (obj) => obj === camiseta || obj === guia;
const objetosUsuario = () => canvas.getObjects().filter((o) => !esFondo(o));

function etiqueta(obj) {
  if (obj instanceof IText) {
    const texto = obj.text.length > 20 ? `${obj.text.slice(0, 20)}…` : obj.text;
    return `Texto: ${texto}`;
  }
  return obj.nombreCapa || "Imagen";
}

/* ========================================================================
   Estado de guardado (y advertencia al cerrar)
   ======================================================================== */
function marcarModificado(valor) {
  modificado = valor;
  $guardado.textContent = valor ? "Cambios sin guardar" : "Todo guardado";
  $guardado.classList.toggle("text-bg-warning", valor);
  $guardado.classList.toggle("text-bg-success", !valor);
  $guardado.classList.remove("text-bg-secondary");
}

// Cierra o recarga la pestaña, o navega a otra página: el navegador pregunta
// (el texto del mensaje no se puede personalizar en los navegadores actuales)
window.addEventListener("beforeunload", (evento) => {
  if (!modificado) return;
  evento.preventDefault();
  evento.returnValue = "";
});

/* ========================================================================
   Lienzo
   ======================================================================== */
function crearRecorte() {
  return new Rect({ ...AREA, originX: "left", originY: "top", absolutePositioned: true });
}

function crearLienzo() {
  canvas = new Canvas($lienzo, {
    width: TAMANO,
    height: TAMANO,
    backgroundColor: "#f1f1f1",
    preserveObjectStacking: true,
    selection: false, // se elige un elemento a la vez
  });

  camiseta = new Path(CAMISETA_PATH, {
    originX: "left", originY: "top", // Fabric 7 usa el centro como origen por defecto
    left: 50, top: 50, scaleX: 5, scaleY: 5,
    fill: "#e08524", stroke: "#212529", strokeWidth: 0.6, strokeLineJoin: "round",
    selectable: false, evented: false, excludeFromExport: true,
  });

  guia = new Rect({
    ...AREA, originX: "left", originY: "top",
    fill: "transparent", stroke: "#212529", strokeWidth: 1.5, strokeDashArray: [6, 4],
    selectable: false, evented: false, excludeFromExport: true,
  });

  canvas.add(camiseta, guia);
}

function aplicarCamiseta(producto) {
  productoActual = producto;
  camiseta.set("fill", producto.color);
  guia.set("stroke", esOscuro(producto.color) ? "#ffffff" : "#212529");
  canvas.requestRenderAll();
}

// Opciones comunes de todo elemento del usuario
function configurar(obj) {
  obj.set({
    clipPath: crearRecorte(),
    transparentCorners: false,
    cornerStyle: "circle",
    cornerColor: "#e08524",
    cornerStrokeColor: "#212529",
    borderColor: "#e08524",
    cornerSize: 12,
  });
  // Solo esquinas (mantienen la proporción) y la manija de rotación
  ["ml", "mr", "mt", "mb"].forEach((c) => obj.setControlVisible(c, false));
}

function agregarObjeto(obj, nombre) {
  configurar(obj);
  if (nombre) obj.nombreCapa = nombre;
  canvas.add(obj);
  canvas.setActiveObject(obj);
  canvas.requestRenderAll();
}

/* ========================================================================
   Panel: sincronización con el elemento seleccionado
   ======================================================================== */
function sincronizarPanel() {
  const obj = canvas.getActiveObject();
  document.querySelectorAll("[data-requiere-seleccion]").forEach((el) => {
    el.disabled = !obj;
  });
  if (!obj) return;

  const escala = Math.round(obj.scaleX * 100);
  const angulo = Math.round(normalizarAngulo(obj.angle));
  $escala.value = escala;
  $escalaValor.textContent = `${escala}%`;
  $angulo.value = angulo;
  $anguloValor.textContent = `${angulo}°`;

  if (obj instanceof IText) {
    if (/^#[0-9a-f]{6}$/i.test(obj.fill)) $textoColor.value = obj.fill;
    $textoFuente.value = obj.fontFamily;
  }
}

function marcarCapaActiva() {
  const activo = canvas.getActiveObject();
  $capas.querySelectorAll("button").forEach((boton) => {
    const esActiva = boton.objeto === activo;
    boton.classList.toggle("active", esActiva);
    if (esActiva) boton.setAttribute("aria-current", "true");
    else boton.removeAttribute("aria-current");
  });
}

function alCambiarSeleccion() {
  sincronizarPanel();
  marcarCapaActiva();
  const obj = canvas.getActiveObject();
  $estadoSeleccion.textContent = obj
    ? `Seleccionado: ${etiqueta(obj)}`
    : "Ningún elemento seleccionado.";
}

function construirCapas() {
  const lista = objetosUsuario().reverse(); // la de arriba primero
  $capasVacio.classList.toggle("d-none", lista.length > 0);

  $capas.replaceChildren(
    ...lista.map((obj) => {
      const li = document.createElement("li");
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "list-group-item list-group-item-action";
      boton.textContent = etiqueta(obj); // textContent: el texto del usuario nunca se interpreta como HTML
      boton.objeto = obj;
      li.appendChild(boton);
      return li;
    })
  );
  marcarCapaActiva();
}

// Cualquier cambio del diseño pasa por aquí
function cambio() {
  if (cargando) return;
  marcarModificado(true);
  construirCapas();
  sincronizarPanel();
}

/* ========================================================================
   Acciones sobre el elemento seleccionado
   ======================================================================== */
function terminarAccion(obj) {
  obj.setCoords();
  canvas.requestRenderAll();
  cambio();
}

function mover(dx, dy) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.set({ left: obj.left + dx, top: obj.top + dy });
  terminarAccion(obj);
}

function girar(grados) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.rotate(normalizarAngulo(obj.angle + grados));
  terminarAccion(obj);
}

function escalarA(porcentaje) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.scale(limitar(porcentaje, 5, 400) / 100);
  terminarAccion(obj);
}

function centrar() {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.set({ left: CENTRO.x, top: CENTRO.y });
  terminarAccion(obj);
}

function eliminar() {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  canvas.discardActiveObject();
  canvas.remove(obj);
  canvas.requestRenderAll();
  mostrarAviso(`Eliminaste: ${etiqueta(obj)}.`);
}

function cambiarOrden(haciaArriba) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  const indice = canvas.getObjects().indexOf(obj);
  if (haciaArriba) {
    canvas.bringObjectForward(obj);
  } else if (indice > 2) {
    // los lugares 0 y 1 son la camiseta y la guía: el arte nunca baja de ahí
    canvas.sendObjectBackwards(obj);
  }
  canvas.requestRenderAll();
  cambio();
}

/* ========================================================================
   Agregar imágenes y texto
   ======================================================================== */
// Reduce la imagen para que el diseño quepa en localStorage y el PDF no pese de más
async function reducirImagen(archivo) {
  const bitmap = await createImageBitmap(archivo);
  const k = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bitmap.width * k));
  c.height = Math.max(1, Math.round(bitmap.height * k));
  c.getContext("2d").drawImage(bitmap, 0, 0, c.width, c.height);
  bitmap.close?.();
  return c.toDataURL(archivo.type === "image/jpeg" ? "image/jpeg" : "image/png", 0.9);
}

async function agregarImagen(archivo) {
  if (!TIPOS_IMAGEN.includes(archivo.type)) {
    mostrarAviso("Usa una imagen PNG, JPG o WebP.", false);
    return;
  }
  if (archivo.size > MAX_ARCHIVO) {
    mostrarAviso("La imagen pesa más de 8 MB. Elige una más ligera.", false);
    return;
  }
  try {
    const origen = await reducirImagen(archivo);
    const imagen = await FabricImage.fromURL(origen, {}, {
      originX: "center", originY: "center", left: CENTRO.x, top: CENTRO.y,
    });
    const k = Math.min((AREA.width * 0.8) / imagen.width, (AREA.height * 0.8) / imagen.height, 1);
    imagen.scale(k);
    agregarObjeto(imagen, archivo.name);
    mostrarAviso("Imagen agregada.");
  } catch (error) {
    console.error("No se pudo agregar la imagen:", error);
    mostrarAviso("No pudimos leer esa imagen. Prueba con otra.", false);
  }
}

function agregarTexto() {
  const contenido = $textoNuevo.value.trim() || "Tu texto";
  const texto = new IText(contenido, {
    originX: "center", originY: "center", left: CENTRO.x, top: CENTRO.y,
    fontFamily: $textoFuente.value,
    fill: $textoColor.value,
    fontSize: 32,
  });
  agregarObjeto(texto);
  $textoNuevo.value = "";
  mostrarAviso("Texto agregado.");
}

/* ========================================================================
   Guardar, cargar, limpiar y exportar
   ======================================================================== */
function obtenerDatosDiseno() {
  const objetos = canvas
    .toObject(["nombreCapa"])
    .objects.map(({ clipPath, ...resto }) => resto); // el recorte se vuelve a crear al cargar
  return {
    version: 1,
    camisetaId: productoActual?.id ?? null,
    fecha: new Date().toISOString(),
    objetos,
  };
}

function esDatosDiseno(datos) {
  return Boolean(datos && Number(datos.version) === 1 && Array.isArray(datos.objetos));
}

function leerGuardadoLocal() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_GUARDADO));
  } catch {
    return null;
  }
}

async function actualizarEstadoGuardado() {
  let disponible = esDatosDiseno(leerGuardadoLocal());

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from(TABLA_DISENOS)
        .select("id")
        .eq("usuario_id", user.id)
        .maybeSingle();

      if (error) throw error;
      disponible = disponible || Boolean(data);
    }
  } catch (error) {
    console.error("No se pudo comprobar el diseño guardado:", error);
  }

  $cargar.disabled = !disponible;
}

async function guardarDiseno() {
  const datos = obtenerDatosDiseno();
  $guardar.disabled = true;

  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
    $cargar.disabled = false;
  } catch (error) {
    console.error("No se pudo guardar el diseño:", error);
    $guardar.disabled = false;
    mostrarAviso("No se pudo guardar: el diseño es muy pesado o el navegador bloquea el almacenamiento.", false);
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      marcarModificado(false);
      mostrarAviso("Diseño guardado en este navegador. Inicia sesión para guardarlo en la nube.");
      return;
    }

    const { error } = await supabase
      .from(TABLA_DISENOS)
      .upsert({
        usuario_id: user.id,
        camiseta_id: datos.camisetaId,
        datos,
        updated_at: new Date().toISOString(),
      }, { onConflict: "usuario_id" });

    if (error) throw error;
    marcarModificado(false);
    mostrarAviso("Diseño guardado en Supabase.");
  } catch (error) {
    console.error("No se pudo guardar el diseño en Supabase:", error);
    mostrarAviso("Se guardó localmente, pero no se pudo sincronizar con Supabase.", false);
  } finally {
    $guardar.disabled = false;
  }
}

function quitarObjetosUsuario() {
  objetosUsuario().forEach((o) => canvas.remove(o));
}

async function cargarGuardado() {
  if (modificado && !window.confirm("Perderás los cambios sin guardar. ¿Cargar el diseño guardado?")) return;

  let datos = null;
  let origen = "local";

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from(TABLA_DISENOS)
        .select("datos")
        .eq("usuario_id", user.id)
        .maybeSingle();

      if (error) throw error;
      datos = data?.datos ?? null;
      origen = "Supabase";
    }
  } catch (error) {
    console.error("No se pudo cargar el diseño desde Supabase:", error);
  }

  if (!esDatosDiseno(datos)) {
    datos = leerGuardadoLocal();
    origen = "local";
  }
  if (!esDatosDiseno(datos)) {
    mostrarAviso("No hay un diseño guardado válido.", false);
    return;
  }

  cargando = true;
  try {
    canvas.discardActiveObject();
    quitarObjetosUsuario();

    const producto = productos.find((p) => p.id === datos.camisetaId);
    if (producto) {
      $camiseta.value = String(producto.id);
      aplicarCamiseta(producto);
    }

    const objetos = await util.enlivenObjects(datos.objetos);
    objetos.forEach((obj) => {
      configurar(obj);
      canvas.add(obj);
    });
    canvas.requestRenderAll();
    mostrarAviso(`Diseño cargado desde ${origen}.`);
  } catch (error) {
    console.error("No se pudo cargar el diseño:", error);
    mostrarAviso("No pudimos cargar el diseño guardado.", false);
  } finally {
    cargando = false;
    marcarModificado(false);
    construirCapas();
    alCambiarSeleccion();
  }
}

function limpiarDiseno() {
  if (objetosUsuario().length === 0) return;
  if (!window.confirm("¿Quieres quitar todos los elementos del diseño?")) return;
  canvas.discardActiveObject();
  quitarObjetosUsuario();
  canvas.requestRenderAll();
  mostrarAviso("Limpiaste el diseño.");
}

function exportarPDF() {
  if (objetosUsuario().length === 0) {
    mostrarAviso("Agrega una imagen o un texto antes de exportar.", false);
    return;
  }

  // Sin manijas de selección ni la guía punteada en la imagen exportada
  canvas.discardActiveObject();
  guia.visible = false;
  canvas.renderAll();
  const png = canvas.toDataURL({ format: "png", multiplier: 2 });
  guia.visible = true;
  canvas.requestRenderAll();

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.setFontSize(18);
  pdf.text("Diseño de camiseta", 105, 22, { align: "center" });
  pdf.setFontSize(11);
  pdf.text(
    `${productoActual.nombre} - Color: ${productoActual.colorNombre}`,
    105, 30, { align: "center" }
  );
  pdf.addImage(png, "PNG", 25, 40, 160, 160);
  pdf.setFontSize(9);
  pdf.text(`Generado el ${new Date().toLocaleDateString("es-MX")} - Proyecto escolar IL362`, 105, 285, { align: "center" });
  pdf.save("diseno-camiseta.pdf");

  mostrarAviso("PDF exportado.");
}

/* ========================================================================
   Eventos
   ======================================================================== */
function conectarEventos() {
  // Eventos del lienzo
  canvas.on("object:added", ({ target }) => { if (!esFondo(target)) cambio(); });
  canvas.on("object:removed", ({ target }) => { if (!esFondo(target)) cambio(); });
  canvas.on("object:modified", cambio);
  canvas.on("text:changed", cambio);
  ["object:moving", "object:scaling", "object:rotating"].forEach((nombre) =>
    canvas.on(nombre, sincronizarPanel)
  );
  ["selection:created", "selection:updated", "selection:cleared"].forEach((nombre) =>
    canvas.on(nombre, alCambiarSeleccion)
  );

  // Camiseta
  $camiseta.addEventListener("change", () => {
    const producto = productos.find((p) => p.id === Number($camiseta.value));
    if (!producto) return;
    aplicarCamiseta(producto);
    cambio();
  });

  // Agregar
  $archivo.addEventListener("change", async () => {
    const archivo = $archivo.files[0];
    if (archivo) await agregarImagen(archivo);
    $archivo.value = "";
  });
  document.getElementById("btn-texto").addEventListener("click", agregarTexto);
  $textoNuevo.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") agregarTexto();
  });

  // Fuente y color: afectan al texto seleccionado
  $textoFuente.addEventListener("change", () => {
    const obj = canvas.getActiveObject();
    if (!(obj instanceof IText)) return;
    obj.set("fontFamily", $textoFuente.value);
    terminarAccion(obj);
  });
  $textoColor.addEventListener("input", () => {
    const obj = canvas.getActiveObject();
    if (!(obj instanceof IText)) return;
    obj.set("fill", $textoColor.value);
    terminarAccion(obj);
  });

  // Transformaciones
  $escala.addEventListener("input", () => escalarA(Number($escala.value)));
  $angulo.addEventListener("input", () => {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.rotate(Number($angulo.value));
    terminarAccion(obj);
  });

  document.querySelectorAll("[data-mover]").forEach((boton) =>
    boton.addEventListener("click", () => {
      const [x, y] = boton.dataset.mover.split(",").map(Number);
      mover(x * PASO, y * PASO);
    })
  );
  document.querySelectorAll("[data-girar]").forEach((boton) =>
    boton.addEventListener("click", () => girar(Number(boton.dataset.girar)))
  );
  document.querySelectorAll("[data-tamano]").forEach((boton) =>
    boton.addEventListener("click", () => {
      const obj = canvas.getActiveObject();
      if (obj) escalarA(Math.round(obj.scaleX * 100) + Number(boton.dataset.tamano));
    })
  );
  document.getElementById("btn-centrar").addEventListener("click", centrar);
  document.getElementById("btn-adelante").addEventListener("click", () => cambiarOrden(true));
  document.getElementById("btn-atras").addEventListener("click", () => cambiarOrden(false));
  document.getElementById("btn-eliminar").addEventListener("click", eliminar);

  // Capas (delegación de eventos)
  $capas.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button");
    if (!boton || !boton.objeto) return;
    canvas.setActiveObject(boton.objeto);
    canvas.requestRenderAll();
    alCambiarSeleccion();
  });

  // Acciones del diseño
  $guardar.addEventListener("click", guardarDiseno);
  $cargar.addEventListener("click", cargarGuardado);
  $pdf.addEventListener("click", exportarPDF);
  $limpiar.addEventListener("click", limpiarDiseno);

  // Atajos de teclado (se ignoran mientras escribes en un campo o editas un texto)
  document.addEventListener("keydown", (evento) => {
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if (evento.target.closest("input, select, textarea, [contenteditable]")) return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.isEditing) return;

    const paso = evento.shiftKey ? PASO_GRANDE : PASO;
    const teclas = {
      ArrowLeft: () => mover(-paso, 0),
      ArrowRight: () => mover(paso, 0),
      ArrowUp: () => mover(0, -paso),
      ArrowDown: () => mover(0, paso),
      "+": () => escalarA(Math.round(obj.scaleX * 100) + 5),
      "=": () => escalarA(Math.round(obj.scaleX * 100) + 5),
      "-": () => escalarA(Math.round(obj.scaleX * 100) - 5),
      q: () => girar(-5),
      e: () => girar(5),
      Delete: eliminar,
    };
    const accion = teclas[evento.key] || teclas[evento.key.toLowerCase()];
    if (!accion) return;
    evento.preventDefault();
    accion();
  });
}

/* ========================================================================
   Inicio
   ======================================================================== */
function llenarNullShirts() {
  $camiseta.replaceChildren(
    ...productos.map((p) => {
      const opcion = document.createElement("option");
      opcion.value = String(p.id);
      opcion.textContent = `${p.nombre} (${p.colorNombre})`;
      return opcion;
    })
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  // El editor para móviles está fuera de alcance: solo se muestra un aviso
  if (window.matchMedia("(max-width: 767.98px), (pointer: coarse)").matches) {
    $editor.classList.add("d-none");
    $avisoMovil.classList.remove("d-none");
    return;
  }

  try {
    productos = await cargarProductos();
  } catch (error) {
    console.error("No se pudieron cargar los productos:", error);
    $editor.innerHTML =
      `<p class="alert alert-danger">No pudimos cargar las camisetas. Recarga la página.</p>`;
    return;
  }

  cargando = true;
  llenarNullShirts();
  crearLienzo();

  // pagina10.html#producto-3 abre el editor con esa camiseta
  const idHash = /^#producto-(\d+)$/.exec(location.hash);
  const inicial = productos.find((p) => p.id === Number(idHash?.[1])) ?? productos[0];
  $camiseta.value = String(inicial.id);
  aplicarCamiseta(inicial);

  conectarEventos();
  await actualizarEstadoGuardado();
  supabase.auth.onAuthStateChange((evento) => {
    if (["SIGNED_IN", "SIGNED_OUT"].includes(evento)) actualizarEstadoGuardado();
  });
  cargando = false;

  construirCapas();
  alCambiarSeleccion();
});
