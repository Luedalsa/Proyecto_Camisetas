// js/app.js — navegación (se carga en todas las páginas)
// El menú móvil lo maneja Bootstrap (data-bs-toggle="collapse"),
// aquí solo se marca el enlace de la página actual.
document.addEventListener("DOMContentLoaded", () => {
  const actual = location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("#menu .nav-link").forEach((enlace) => {
    if (enlace.getAttribute("href") === actual) {
      enlace.classList.add("active");           // estilo definido en styles.css
      enlace.setAttribute("aria-current", "page");
    }
  });
});
