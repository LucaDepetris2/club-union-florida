
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".nav-center");

    toggle.addEventListener("click", () => {
        menu.classList.toggle("show");
    });

    // Cierra el menú al hacer clic en un link
    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => menu.classList.remove("show"));
    });
});