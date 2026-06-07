document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("Token");

  // Se tentar acessar a tela de trocar senha sem estar logado, volta pro login
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const form = document.getElementById("form-change-password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const senhaAtual = document.getElementById("senhaAtual").value;
    const novaSenha = document.getElementById("novaSenha").value;
    const confirmarNovaSenha =
      document.getElementById("confirmarNovaSenha").value;
    const messageDiv = document.getElementById("password-message");

    if (novaSenha !== confirmarNovaSenha) {
      messageDiv.style.color = "red";
      messageDiv.innerText =
        "A confirmação da nova senha não confere. Tente novamente.";
      return;
    }

    if (novaSenha.length < 8) {
      messageDiv.style.color = "red";
      messageDiv.innerText = "A nova senha deve ser no mínimo 8 caracteres.";
      return;
    }

    try {
      const response = await fetch(
        "https://api-lojaleila.onrender.com/api/auth/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ senhaAtual, novaSenha }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        messageDiv.style.color = "green";
        messageDiv.innerText = data.message || "Senha alterada com sucesso!";
        form.reset();

        setTimeout(() => {
          window.location.href = "profile.html";
        }, 2000);
      } else {
        messageDiv.style.color = "red";
        messageDiv.innerText = data.error || "Erro ao alterar a senha.";
      }
    } catch (error) {
      console.error("Erro na requisição de senha:", error);
      messageDiv.style.color = "red";
      messageDiv.innerText = "Falha de conexão com o servidor.";
    }
  });
});
