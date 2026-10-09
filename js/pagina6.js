// js/pagina6.js — página 404 y ayuda: buscador, formulario de soporte, teléfonos, horario y mapa

/* ========================================================================
   Datos de la tienda (cámbialos por los reales)
   ======================================================================== */
const TIENDA = {
  nombre: "Camisetas",
  direccion: ["Av. Juárez 000, Centro", "44100 Guadalajara, Jalisco, México"],
  lat: 20.6767,
  lng: -103.3475,
  delta: 0.004,            // "zoom" del mapa: más pequeño = más cerca
  zonaHoraria: "America/Mexico_City",
  // Horario: 1 = lunes … 6 = sábado (domingo cerrado)
  abre: 10,
  cierra: 19,
  dias: [1, 2, 3, 4, 5, 6],
};

/* ========================================================================
   Referencias al DOM
   ======================================================================== */
const $ruta = document.getElementById("ruta-solicitada");

const $buscar = document.getElementById("buscar-ayuda");
const $items = [...document.querySelectorAll("[data-ayuda]")];
const $ayudaVacio = document.getElementById("ayuda-vacio");
const $estadoAyuda = document.getElementById("estado-ayuda");

const $form = document.getElementById("form-soporte");
const $enviar = document.getElementById("btn-soporte");
const $resultado = document.getElementById("resultado-soporte");
const $descripcion = document.getElementById("s-descripcion");
const $contador = document.getElementById("contador-soporte");

const $mapa = document.getElementById("mapa");
const $enlaceMapa = document.getElementById("enlace-mapa");
const $direccion = document.getElementById("direccion");
const $estadoTienda = document.getElementById("estado-tienda");
const $aviso = document.getElementById("aviso");
const $avisoTexto = document.getElementById("aviso-texto");

const MIN_DESCRIPCION = 10;
const MAX_DESCRIPCION = 400;

/* ========================================================================
   Utilidades
   ======================================================================== */
const normalizar = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const correoValido = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);

function mostrarAviso(mensaje, ok = true) {
  $avisoTexto.textContent = mensaje;
  $aviso.classList.remove("text-bg-success", "text-bg-danger");
  $aviso.classList.add(ok ? "text-bg-success" : "text-bg-danger");
  bootstrap.Toast.getOrCreateInstance($aviso, { delay: 3000 }).show();
}

/* ========================================================================
   404: muestra la dirección que no se encontró
   ======================================================================== */
function mostrarRuta() {
  const ruta = location.pathname;
  // Si se abre directamente pagina6.html (o la raíz) no hay nada "perdido" que mostrar
  if (/\/(pagina6\.html)?$/.test(ruta)) return;
  $ruta.textContent = `Dirección solicitada: ${ruta}`; // textContent: nada se interpreta como HTML
  $ruta.classList.remove("d-none");
}

/* ========================================================================
   Ayuda: buscador
   ======================================================================== */
function filtrarAyuda() {
  const texto = normalizar($buscar.value.trim());
  let visibles = 0;

  $items.forEach((item) => {
    const coincide = !texto || normalizar(item.textContent).includes(texto);
    item.classList.toggle("d-none", !coincide);
    if (coincide) visibles++;
  });

  $ayudaVacio.classList.toggle("d-none", visibles > 0);
  $estadoAyuda.textContent = texto
    ? `${visibles} ${visibles === 1 ? "resultado" : "resultados"}.`
    : "";
}

/* ========================================================================
   Formulario de soporte: validación
   ======================================================================== */
// Devuelve el texto del error, o "" si el campo es correcto
const REGLAS = {
  nombre: (v) => (v.trim().length < 2 ? "Escribe tu nombre (mínimo 2 letras)." : ""),
  correo: (v) =>
    !v.trim() ? "Escribe tu correo."
      : !correoValido(v.trim()) ? "Escribe un correo válido, por ejemplo nombre@correo.com."
        : "",
  tipo: (v) => (!v ? "Elige dónde ocurre el problema." : ""),
  descripcion: (v) =>
    v.trim().length < MIN_DESCRIPCION
      ? `Describe el problema con al menos ${MIN_DESCRIPCION} caracteres.`
      : "",
};

function validarCampo(campo) {
  const regla = REGLAS[campo.name];
  if (!regla) return true;

  const error = regla(campo.value);
  const $error = document.getElementById(`e-${campo.name}`);

  $error.textContent = error;
  campo.classList.toggle("is-invalid", Boolean(error));
  campo.classList.toggle("is-valid", !error);
  campo.setAttribute("aria-invalid", error ? "true" : "false");
  return !error;
}

function limpiarValidacion() {
  [...$form.elements].forEach((campo) => {
    campo.classList.remove("is-valid", "is-invalid");
    campo.removeAttribute("aria-invalid");
  });
  $form.querySelectorAll(".invalid-feedback").forEach((e) => (e.textContent = ""));
}

function actualizarContador() {
  $contador.textContent = `${$descripcion.value.length} / ${MAX_DESCRIPCION}`;
}

function mostrarResultado(texto, ok) {
  $resultado.innerHTML = "";
  const caja = document.createElement("div");
  caja.className = `alert ${ok ? "alert-success" : "alert-danger"} mb-3`;
  caja.textContent = texto;
  $resultado.appendChild(caja);
  $resultado.focus();
}

// Simula el envío con una promesa (aquí iría una llamada a la BD o a un servicio de correo)
const enviarReporte = (datos) =>
  new Promise((resolver) => setTimeout(() => resolver({ ok: true, datos }), 700));

async function alEnviar(evento) {
  evento.preventDefault();

  const campos = [...$form.elements].filter((c) => c.name);
  const resultados = campos.map(validarCampo); // valida todos para mostrar todos los errores
  if (resultados.includes(false)) {
    campos.find((c) => c.classList.contains("is-invalid"))?.focus();
    mostrarResultado("Revisa los campos marcados en rojo.", false);
    return;
  }

  const datos = Object.fromEntries(new FormData($form));
  $enviar.disabled = true;
  $enviar.textContent = "Enviando…";

  try {
    await enviarReporte(datos);
    mostrarResultado(
      `¡Reporte enviado! Gracias, ${datos.nombre.trim()}. Te responderemos a ${datos.correo.trim()}.`,
      true
    );
    mostrarAviso("Reporte enviado.");
    $form.reset();
    limpiarValidacion();
    actualizarContador();
  } catch (error) {
    console.error("No se pudo enviar el reporte:", error);
    mostrarResultado("No pudimos enviar tu reporte. Intenta de nuevo.", false);
  } finally {
    $enviar.disabled = false;
    $enviar.textContent = "Enviar reporte";
  }
}

/* ========================================================================
   Teléfonos: copiar al portapapeles
   ======================================================================== */
async function copiarTelefono(numero) {
  try {
    await navigator.clipboard.writeText(numero);
    mostrarAviso(`Copiaste ${numero}.`);
  } catch (error) {
    console.warn("No se pudo copiar:", error);
    mostrarAviso("No pudimos copiar el número. Cópialo manualmente.", false);
  }
}

/* ========================================================================
   Horario: ¿abierto o cerrado ahora?
   ======================================================================== */
function tiendaAbierta(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: TIENDA.zonaHoraria,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(fecha);

  const diaTexto = partes.find((p) => p.type === "weekday").value;
  const hora = Number(partes.find((p) => p.type === "hour").value);
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(diaTexto);

  return TIENDA.dias.includes(dia) && hora >= TIENDA.abre && hora < TIENDA.cierra;
}

function mostrarEstadoTienda() {
  const abierta = tiendaAbierta();
  $estadoTienda.textContent = abierta ? "Abierto ahora" : "Cerrado ahora";
  $estadoTienda.classList.remove("text-bg-secondary", "text-bg-success", "text-bg-danger");
  $estadoTienda.classList.add(abierta ? "text-bg-success" : "text-bg-danger");
}

/* ========================================================================
   Dirección y mapa interactivo (OpenStreetMap)
   ======================================================================== */
function mostrarDireccion() {
  $direccion.replaceChildren(
    ...TIENDA.direccion.flatMap((linea, i) =>
      i === 0 ? [document.createTextNode(linea)] : [document.createElement("br"), document.createTextNode(linea)]
    )
  );
}

function mostrarMapa() {
  const { lat, lng, delta } = TIENDA;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");

  const marco = document.createElement("iframe");
  marco.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  marco.title = `Mapa interactivo con la ubicación de ${TIENDA.nombre}`;
  marco.loading = "lazy";
  marco.referrerPolicy = "no-referrer";

  $mapa.replaceChildren(marco);
  $enlaceMapa.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

/* ========================================================================
   Eventos
   ======================================================================== */
$buscar.addEventListener("input", filtrarAyuda);

document.getElementById("lista-telefonos").addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-copiar]");
  if (boton) copiarTelefono(boton.dataset.copiar);
});

$form.addEventListener("submit", alEnviar);
$form.addEventListener("reset", () => {
  // el reset del navegador ocurre después de este evento
  setTimeout(() => {
    limpiarValidacion();
    actualizarContador();
    $resultado.innerHTML = "";
  });
});
$form.addEventListener("focusout", (evento) => {
  if (evento.target.name) validarCampo(evento.target);
});
$form.addEventListener("input", (evento) => {
  if (evento.target === $descripcion) actualizarContador();
  if (evento.target.classList.contains("is-invalid")) validarCampo(evento.target);
});
$form.addEventListener("change", (evento) => {
  if (evento.target.name) validarCampo(evento.target);
});

/* ========================================================================
   Inicio
   ======================================================================== */
mostrarRuta();
mostrarDireccion();
mostrarMapa();
mostrarEstadoTienda();
setInterval(mostrarEstadoTienda, 60_000); // se actualiza si dejas la página abierta
actualizarContador();
