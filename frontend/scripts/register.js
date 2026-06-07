document.addEventListener("DOMContentLoaded", () => {
  const formRegistro = document.getElementById("formRegistro");

  if (formRegistro) {
    formRegistro.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("reg-username").value;
      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;

      try {
        const response = await fetch(
          "https://api-lojaleila.onrender.com/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          alert("Conta criada com sucesso!");
          window.location.href = "login.html";
        } else {
          alert(`Erro: ${data.message}`);
        }
      } catch (error) {
        console.error("Erro ao conectar com a API: ", error);
        alert("Servidor indisponível.");
      }
    });
  }
});
