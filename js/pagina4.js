// js/pagina4.js — buscador de preguntas frecuentes y formulario de contacto

/* ========================================================================
   Referencias al DOM
   ======================================================================== */
const $buscar = document.getElementById("buscar-faq");
const $preguntas = [...document.querySelectorAll("[data-faq]")];
const $faqVacio = document.getElementById("faq-vacio");
const $estadoFaq = document.getElementById("estado-faq");

const $form = document.getElementById("form-contacto");
const $enviar = document.getElementById("btn-enviar");
const $resultado = document.getElementById("resultado");
const $mensaje = document.getElementById("c-mensaje");
const $contador = document.getElementById("contador");
const $aviso = document.getElementById("aviso");
const $avisoTexto = document.getElementById("aviso-texto");

const MIN_MENSAJE = 10;
const MAX_MENSAJE = 500;

/* ========================================================================
   Utilidades
   ======================================================================== */
// Quita acentos y mayúsculas para que "envio" encuentre "envío"
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
   Preguntas frecuentes: buscador
   ======================================================================== */
function filtrarPreguntas() {
  const texto = normalizar($buscar.value.trim());
  let visibles = 0;

  $preguntas.forEach((item) => {
    const coincide = !texto || normalizar(item.textContent).includes(texto);
    item.classList.toggle("d-none", !coincide);
    if (coincide) visibles++;
  });

  $faqVacio.classList.toggle("d-none", visibles > 0);
  $estadoFaq.textContent = texto
    ? `${visibles} ${visibles === 1 ? "pregunta encontrada" : "preguntas encontradas"}.`
    : "";
}

/* ========================================================================
   Formulario: validación
   ======================================================================== */
// Devuelve el texto del error, o "" si el campo es correcto
const REGLAS = {
  nombre: (v) => (v.trim().length < 2 ? "Escribe tu nombre (mínimo 2 letras)." : ""),
  correo: (v) =>
    !v.trim() ? "Escribe tu correo."
      : !correoValido(v.trim()) ? "Escribe un correo válido, por ejemplo nombre@correo.com."
        : "",
  asunto: (v) => (!v ? "Elige un asunto." : ""),
  mensaje: (v) =>
    v.trim().length < MIN_MENSAJE ? `El mensaje debe tener al menos ${MIN_MENSAJE} caracteres.` : "",
  acepto: (_v, campo) => (!campo.checked ? "Debes aceptar la política de privacidad." : ""),
};

function validarCampo(campo) {
  const regla = REGLAS[campo.name];
  if (!regla) return true;

  const error = regla(campo.value, campo);
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
  $contador.textContent = `${$mensaje.value.length} / ${MAX_MENSAJE}`;
}

function mostrarResultado(texto, ok) {
  $resultado.innerHTML = "";
  const caja = document.createElement("div");
  caja.className = `alert ${ok ? "alert-success" : "alert-danger"} mb-3`;
  caja.textContent = texto; // textContent: nada del usuario se interpreta como HTML
  $resultado.appendChild(caja);
  $resultado.focus();
}

// Simula el envío con una promesa (aquí iría una llamada a la BD o a un servicio de correo)
const enviarMensaje = (datos) =>
  new Promise((resolver) => setTimeout(() => resolver({ ok: true, datos }), 700));

async function alEnviar(evento) {
  evento.preventDefault();

  const campos = [...$form.elements].filter((c) => c.name);
  const resultados = campos.map(validarCampo); // valida todos para mostrar todos los errores
  if (resultados.includes(false)) {
    const primero = campos.find((c) => c.classList.contains("is-invalid"));
    primero?.focus();
    mostrarResultado("Revisa los campos marcados en rojo.", false);
    return;
  }

  const datos = Object.fromEntries(new FormData($form));
  $enviar.disabled = true;
  $enviar.textContent = "Enviando…";

  try {
    await enviarMensaje(datos);
    mostrarResultado(`¡Mensaje enviado! Gracias, ${datos.nombre.trim()}. Te responderemos a ${datos.correo.trim()}.`, true);
    mostrarAviso("Mensaje enviado.");
    $form.reset();
    limpiarValidacion();
    actualizarContador();
  } catch (error) {
    console.error("No se pudo enviar el mensaje:", error);
    mostrarResultado("No pudimos enviar tu mensaje. Intenta de nuevo.", false);
  } finally {
    $enviar.disabled = false;
    $enviar.textContent = "Enviar mensaje";
  }
}

/* ========================================================================
   Eventos
   ======================================================================== */
$buscar.addEventListener("input", filtrarPreguntas);

$form.addEventListener("submit", alEnviar);
$form.addEventListener("reset", () => {
  // el reset del navegador ocurre después de este evento
  setTimeout(() => {
    limpiarValidacion();
    actualizarContador();
    $resultado.innerHTML = "";
  });
});

// Valida cada campo al salir de él (y al cambiar, si ya tenía error)
$form.addEventListener("focusout", (evento) => {
  if (evento.target.name) validarCampo(evento.target);
});
$form.addEventListener("input", (evento) => {
  if (evento.target === $mensaje) actualizarContador();
  if (evento.target.classList.contains("is-invalid")) validarCampo(evento.target);
});
$form.addEventListener("change", (evento) => {
  if (evento.target.name) validarCampo(evento.target);
});

actualizarContador();
