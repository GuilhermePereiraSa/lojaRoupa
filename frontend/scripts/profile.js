document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  carregarDadosPerfil(token);
  carregarHistoricoPedidos(token);
});

async function carregarDadosPerfil(token) {
  try {
    const response = await fetch("/api/usuarios/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const usuario = await response.json();
      document.getElementById("user-name").innerText =
        usuario.name || usuario.nome;
      document.getElementById("user-email").innerText = usuario.email;

      document.getElementById("dados-carregando").style.display = "none";
      document.getElementById("dados-usuario").style.display = "block";
    } else {
      document.getElementById("dados-carregando").innerText =
        "Erro ao carregar dados do perfil.";
    }
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    document.getElementById("dados-carregando").innerText = "Erro de conexão.";
  }
}

async function carregarHistoricoPedidos(token) {
  const listaPedidos = document.getElementById("lista-pedidos");
  const msgPedidos = document.getElementById("pedidos-mensagem");

  try {
    const response = await fetch("/api/pedidos/meus", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar histórico.");
    }

    const pedidos = await response.json();

    if (pedidos.length === 0) {
      msgPedidos.innerText = "Você ainda não realizou nenhum pedido.";
      document.getElementById("tabela-pedidos").style.display = "none";
      return;
    }

    listaPedidos.innerHTML = "";

    pedidos.forEach((pedido) => {
      const dataFormatada = new Date(pedido.createdAt).toLocaleDateString(
        "pt-BR",
      );
      const totalFormatado = Number(pedido.total).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      const statusClass = `status-${pedido.status.toLowerCase()}`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>#${pedido.id}</td>
                <td>${dataFormatada}</td>
                <td>${totalFormatado}</td>
                <td><span class="status-badge ${statusClass}">${pedido.status}</span></td>
            `;
      listaPedidos.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar pedidos:", error);
    msgPedidos.innerText =
      "Não foi possível carregar seu histórico de pedidos.";
    document.getElementById("tabela-pedidos").style.display = "none";
  }
}
