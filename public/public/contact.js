
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".nav-center");

    toggle.addEventListener("click", () => {
        menu.classList.toggle("show");
    });

    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => menu.classList.remove("show"));
    });

    const form = document.getElementById("contact-form");
    const messageDiv = document.getElementById("form-message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = new FormData(form);

        try {
            const res = await fetch("https://formspree.io/f/mvgqbrwe", {
                method: "POST",
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (res.ok) {
                messageDiv.textContent = "Mensaje enviado correctamente.";
                messageDiv.style.color = "green";
                messageDiv.style.display = "block";
                form.reset();
            } else {
                messageDiv.textContent = "Error al enviar el mensaje.";
                messageDiv.style.color = "red";
                messageDiv.style.display = "block";
            }
        } catch (err) {
            messageDiv.textContent = "Hubo un problema al enviar.";
            messageDiv.style.color = "red";
            messageDiv.style.display = "block";
        }
    });
});