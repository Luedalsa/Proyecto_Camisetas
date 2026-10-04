// js/app.js — barra de navegación: menú móvil y página activa
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("menu");

  // Abrir / cerrar menú en pantallas pequeñas
  toggle.addEventListener("click", () => {
    const abierto = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", abierto);
    toggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  });

  // Marcar el enlace de la página actual
  const actual = location.pathname.split("/").pop() || "index.html";
  menu.querySelectorAll("a").forEach((enlace) => {
    if (enlace.getAttribute("href") === actual) {
      enlace.setAttribute("aria-current", "page");
    }
  });
});
