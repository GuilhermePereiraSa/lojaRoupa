document.addEventListener("DOMContentLoaded", () => {
  const formRegistro = document.getElementById("formRegistro");

  if (formRegistro) {
    formRegistro.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("reg-username").value();
      const password = document.getElementById("reg-password").value();

      try {
        const response = await fetch(
          "http://localhost:3000/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringfy({ username, password }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          alert("Conta criada com sucesso!");
          // redireciona
          window.location.href = "loginForms.html";
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
