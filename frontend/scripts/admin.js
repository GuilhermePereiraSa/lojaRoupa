document.addEventListener("DOMContentLoaded", () => {
  loadAdminOrders();
});

async function loadAdminOrders() {
  const token = localStorage.getItem("Token") || localStorage.getItem("token");

  if (!token) {
    alert("Acesso negado. Faça login como administrador.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:3001/api/pedidos/admin", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao carregar pedidos.");
    }

    const orders = await response.json();
    const tableBody = document.getElementById("admin-orders-table");
    tableBody.innerHTML = "";

    if (orders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum pedido realizado ainda.</td></tr>`;
      return;
    }

    orders.forEach((order) => {
      const tr = document.createElement("tr");

      // Formata a lista de itens para ficar bonita na tabela
      const itensFormatados = order.items
        .map((item) => `${item.name} (1x)`)
        .join(", ");

      // Formata a data de criação do banco
      const dataPedido = new Date(order.createdAt).toLocaleString("pt-BR");

      // Define a cor da tag de status
      const statusClass =
        order.status === "Pago" ? "status-pago" : "status-pendente";

      // Define o que aparece na coluna de Ação
      let acaoHTML = `<span>Concluído ✔️</span>`;
      if (order.status === "Pendente") {
        acaoHTML = `<button class="btn-confirmar" onclick="confirmPayment(${order.id})">Confirmar Recebimento</button>`;
      }

      tr.innerHTML = `
                <td><strong>#${order.id}</strong></td>
                <td>${dataPedido}</td>
                <td>${itensFormatados}</td>
                <td><strong>R$ ${parseFloat(order.totalPrice).toFixed(2)}</strong></td>
                <td><span class="${statusClass}">${order.status}</span></td>
                <td>${acaoHTML}</td>
            `;

      tableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro no painel admin:", error);
    alert("Erro ao carregar a lista de pedidos.");
  }
}

// Função global chamada pelo clique do botão na linha da tabela
async function confirmPayment(orderId) {
  const token = localStorage.getItem("Token") || localStorage.getItem("token");

  if (
    !confirm(
      `Deseja confirmar o recebimento do pagamento para o pedido #${orderId}?`,
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3001/api/pedidos/${orderId}/confirmar`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (response.ok) {
      alert("Sucesso! O pedido agora consta como PAGO.");
      loadAdminOrders(); // Atualiza a tabela dinamicamente sem recarregar a página
    } else {
      alert("Erro ao confirmar pagamento: " + data.error);
    }
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    alert("Erro de comunicação com o servidor.");
  }
}
