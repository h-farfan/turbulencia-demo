// script.js
document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("toggle-dark");

  // Al cargar la página, aplicar la preferencia guardada
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    button.textContent = "☀️ Modo claro";
    button.setAttribute("aria-pressed", "true");
  } else {
    button.textContent = "🌙 Modo oscuro";
    button.setAttribute("aria-pressed", "false");
  }

  button.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    // Cambiar texto del botón
    button.textContent = isDark ? "☀️ Modo claro" : "🌙 Modo oscuro";

    // Actualizar atributo accesible
    button.setAttribute("aria-pressed", isDark ? "true" : "false");

    // Guardar preferencia
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});
