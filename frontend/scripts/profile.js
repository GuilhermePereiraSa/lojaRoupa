document.addEventListener("DOMContentLoaded", () => {
  carregarDadosPerfil();
  carregarHistoricoPedidos();
});

async function carregarDadosPerfil() {
  const token = localStorage.getItem("Token") || localStorage.getItem("token");

  if (!token) {
    alert("Você precisa estar logado para ver seu perfil.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(
      "https://api-lojaleila.onrender.com/api/auth/perfil",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.ok) {
      const usuario = await response.json();
      document.getElementById("dados-carregando").style.display = "none";
      document.getElementById("dados-usuario").style.display = "block";

      document.getElementById("user-name").textContent = usuario.username;
      document.getElementById("user-email").textContent = usuario.email;
    } else {
      document.getElementById("dados-carregando").textContent =
        "Erro ao carregar dados. Faça login novamente.";
    }
  } catch (error) {
    console.error("Erro no perfil:", error);
  }
}

async function carregarHistoricoPedidos() {
  const token = localStorage.getItem("Token") || localStorage.getItem("token");
  const listaPedidos = document.getElementById("lista-pedidos");

  try {
    const response = await fetch(
      "https://api-lojaleila.onrender.com/api/pedidos",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) throw new Error("Falha ao buscar pedidos");

    const pedidos = await response.json();

    if (pedidos.length === 0) {
      listaPedidos.innerHTML =
        "<tr><td colspan='4'>Você ainda não fez nenhum pedido.</td></tr>";
      return;
    }

    pedidos.forEach((pedido) => {
      const dataFormatada = new Date(pedido.createdAt).toLocaleDateString(
        "pt-BR",
      );
      const total = Number(pedido.totalPrice).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${pedido.id}</td>
        <td>${dataFormatada}</td>
        <td>${total}</td>
        <td><strong style="color: #e02a64;">${pedido.status}</strong></td>
      `;
      listaPedidos.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    listaPedidos.innerHTML =
      "<tr><td colspan='4'>Erro ao carregar histórico de pedidos.</td></tr>";
  }
}
