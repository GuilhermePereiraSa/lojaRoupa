document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-reset-password");
  const messageDiv = document.getElementById("reset-message");

  // Captura o token da URL (ex: ?token=a1b2c3d4)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("Token");

  // Se a pessoa tentar acessar a página sem token na URL, bloqueamos a ação
  if (!token) {
    messageDiv.style.color = "red";
    messageDiv.innerText =
      "Token de recuperação ausente. Por favor, solicite um novo link no e-mail.";
    if (form) form.style.display = "none";
    return;
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const novaSenha = document.getElementById("novaSenha").value;
      const confirmarNovaSenha =
        document.getElementById("confirmarNovaSenha").value;

      if (novaSenha !== confirmarNovaSenha) {
        messageDiv.style.color = "red";
        messageDiv.innerText =
          "A confirmação da nova senha não confere. Tente novamente.";
        return;
      }

      // Validação simples seguindo a regra do seu projeto
      if (novaSenha.length < 8) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "A senha deve ter no mínimo 8 caracteres.";
        return;
      }

      messageDiv.style.color = "blue";
      messageDiv.innerText = "Salvando nova senha...";

      try {
        const response = await fetch(
          "https://api-lojaleila.onrender.com/api/auth/reset-password",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token, novaSenha }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          messageDiv.style.color = "green";
          messageDiv.innerText =
            "Senha redefinida com sucesso! Redirecionando para o login...";
          form.reset();

          // Redireciona para o login após 3 segundos
          setTimeout(() => {
            window.location.href = "login.html";
          }, 3000);
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
