document.addEventListener("DOMContentLoaded", () => {
  const formRegistro = document.getElementById("formRegistro");

  if (formRegistro) {
    formRegistro.addEventListener("submit", async (e) => {
      e.preventDefault();

      // CORREÇÃO 1: Removido os parênteses do value
      const username = document.getElementById("reg-username").value;
      const password = document.getElementById("reg-password").value;

      try {
        // CORREÇÃO 2: Atualizado para a porta 3001
        const response = await fetch(
          "http://localhost:3001/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            // CORREÇÃO 3: stringify escrito corretamente (com 'i')
            body: JSON.stringify({ username, password }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          alert("Conta criada com sucesso!");
          // CORREÇÃO 4: Apontando para o arquivo HTML correto
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
