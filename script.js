// script.js
document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("toggle-dark");

  button.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    // Cambiar el texto del botón según el estado
    if (document.body.classList.contains("dark-mode")) {
      button.textContent = "☀️ Modo claro";
    } else {
      button.textContent = "🌙 Modo oscuro";
    }
  });
});