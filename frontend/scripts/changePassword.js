document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

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
    const messageDiv = document.getElementById("password-message");

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const data = await response.json();

      if (response.ok) {
        messageDiv.style.color = "green";
        messageDiv.innerText = data.message || "Senha alterada com sucesso!";
        form.reset();

        // Opcional: Redirecionar de volta pro perfil após 2 segundos
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
