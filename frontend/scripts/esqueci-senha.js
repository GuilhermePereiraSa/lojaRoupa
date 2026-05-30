document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-forgot-password");
  const messageDiv = document.getElementById("forgot-message");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      messageDiv.style.color = "blue";
      messageDiv.innerText = "Aguarde, processando...";

      try {
        const response = await fetch(
          "http://localhost:3001/api/auth/forgot-password",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          messageDiv.style.color = "green";
          messageDiv.innerText = data.message || "Link enviado com sucesso!";
          form.reset();
        } else {
          messageDiv.style.color = "red";
          messageDiv.innerText = `Erro: ${data.message}`;
        }
      } catch (error) {
        console.error("Erro ao conectar com a API: ", error);
        messageDiv.style.color = "red";
        messageDiv.innerText =
          "Servidor indisponível. Tente novamente mais tarde.";
      }
    });
  }
});
