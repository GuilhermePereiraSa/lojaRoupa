// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let produtoEmEdicaoId = null;
let msgProduto = null;
let btnSubmitProduto = null;

// ==========================================
// INICIALIZAÇÃO DA PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const btnLogoutAdmin = document.getElementById("logout-admin");
  if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("Token");
      localStorage.removeItem("cart");
      window.location.href = "/pages/login.html";
    });
  }

  msgProduto = document.getElementById("produto-mensagem");
  btnSubmitProduto = document.querySelector("#form-add-produto .btn-submit");

  // Carrega os dados assim que a página abre
  loadAdminOrders();

  // Lógica do Formulário
  const formAddProduto = document.getElementById("form-add-produto");

  formAddProduto.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgProduto.innerText = produtoEmEdicaoId
      ? "Atualizando produto..."
      : "Salvando produto...";
    msgProduto.style.color = "blue";

    const formData = new FormData(formAddProduto);
    const token =
      localStorage.getItem("token") || localStorage.getItem("Token");

    const url = produtoEmEdicaoId
      ? `https://api-lojaleila.onrender.com/api/produtos/${produtoEmEdicaoId}`
      : "https://api-lojaleila.onrender.com/api/produtos/criar";

    const method = produtoEmEdicaoId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const textData = await response.text();
      let data = {};
      try {
        data = textData ? JSON.parse(textData) : {};
      } catch (e) {
        console.error("Resposta não é JSON válido:", textData);
      }

      if (response.ok) {
        msgProduto.style.color = "green";
        msgProduto.innerText = produtoEmEdicaoId
          ? "Roupa atualizada com sucesso!"
          : "Roupa adicionada ao estoque!";

        formAddProduto.reset();
        produtoEmEdicaoId = null;
        btnSubmitProduto.innerText = "+ Salvar Produto no Estoque";
        carregarProdutos(token);
      } else {
        msgProduto.style.color = "red";
        msgProduto.innerText =
          data.error ||
          `Erro ${response.status}: Rota não encontrada ou erro na API.`;
      }
    } catch (error) {
      console.error("Erro no upload/edição:", error);
      msgProduto.style.color = "red";
      msgProduto.innerText = "Falha grave de comunicação com o servidor.";
    }
  });
}); // <---- FECHAMENTO CORRETO DO DOMContentLoaded AQUI!

// ==========================================
// FUNÇÕES GLOBAIS DE LISTAGEM (READ)
// ==========================================
async function loadAdminOrders() {
  const token = localStorage.getItem("Token") || localStorage.getItem("token");

  if (!token) {
    alert("Acesso negado. Faça login como administrador.");
    window.location.href = "login.html";
    return;
  }

  carregarProdutos(token);
  carregarClientes(token);
  carregarPedidos(token);
}

async function carregarProdutos(token) {
  const tbody = document.getElementById("lista-admin-produtos");
  tbody.innerHTML = '<tr><td colspan="6">Carregando estoque...</td></tr>';

  try {
    const response = await fetch(
      "https://api-lojaleila.onrender.com/api/produtos",
    );
    const produtos = await response.json();

    tbody.innerHTML = "";

    if (produtos.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6">Nenhuma roupa cadastrada no estoque.</td></tr>';
      return;
    }

    produtos.forEach((produto) => {
      const precoFormatado = Number(produto.price).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      const caminhoImagem = produto.image
        ? produto.image
        : "../img/placeholder.png";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${produto.id}</td>
        <td><img src="${caminhoImagem}" alt="${produto.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
        <td>${produto.name}</td>
        <td>${produto.size}</td>
        <td>${precoFormatado}</td>
        <td>
          <button class="btn-acao btn-editar" onclick="editarProduto(${produto.id})">Editar</button>
          <button class="btn-acao btn-deletar" onclick="deletarProduto(${produto.id}, '${token}')">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    tbody.innerHTML =
      '<tr><td colspan="6" style="color: red;">Erro ao carregar o estoque.</td></tr>';
  }
}

async function carregarClientes(token) {
  const tbody = document.getElementById("lista-admin-clientes");
  tbody.innerHTML = '<tr><td colspan="4">Carregando clientes...</td></tr>';

  try {
    const response = await fetch(
      "https://api-lojaleila.onrender.com/api/auth/usuarios",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) throw new Error("Sem permissão ou erro no server");

    const clientes = await response.json();
    tbody.innerHTML = "";

    clientes.forEach((cliente) => {
      const dataCadastro = new Date(cliente.createdAt).toLocaleDateString(
        "pt-BR",
      );
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>#${cliente.id}</td>
        <td>${cliente.username}</td>
        <td>${cliente.email}</td>
        <td>${cliente.isAdmin ? "Sim (Admin)" : "Não (Cliente)"}</td>
        <td>${dataCadastro}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
    tbody.innerHTML =
      '<tr><td colspan="4" style="color: red;">Erro ao buscar lista de clientes.</td></tr>';
  }
}

async function carregarPedidos(token) {
  const tbody = document.getElementById("lista-admin-pedidos");
  tbody.innerHTML = '<tr><td colspan="6">Carregando pedidos...</td></tr>';

  try {
    const response = await fetch(
      "https://api-lojaleila.onrender.com/api/pedidos/admin",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) throw new Error("Erro ao carregar pedidos");

    const pedidos = await response.json();
    tbody.innerHTML = "";

    if (pedidos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">Nenhum pedido recente.</td></tr>';
      return;
    }

    pedidos.forEach((pedido) => {
      const dataPedido = new Date(pedido.createdAt).toLocaleDateString("pt-BR");
      const total = Number(pedido.totalPrice).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      const nomeCliente = pedido.User
        ? pedido.User.username
        : `Cliente #${pedido.userId}`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${pedido.id}</td>
        <td>${nomeCliente}</td>
        <td>${dataPedido}</td>
        <td>${total}</td>
        <td>
          <select class="status-select" onchange="alterarStatusPedido(${pedido.id}, this.value, '${token}')" style="padding: 5px; border-radius: 4px;">
            <option value="Pendente" ${pedido.status === "Pendente" ? "selected" : ""}>Pendente</option>
            <option value="Pago" ${pedido.status === "Pago" ? "selected" : ""}>Pago</option>
            <option value="Sem Estoque" ${pedido.status === "Sem Estoque" ? "selected" : ""}>Sem Estoque</option>
            <option value="Pronto para Retirada" ${pedido.status === "Pronto para Retirada" ? "selected" : ""}>Pronto para Retirada</option>
            <option value="Saiu para Entrega" ${pedido.status === "Saiu para Entrega" ? "selected" : ""}>Saiu para Entrega</option>
            <option value="Finalizado" ${pedido.status === "Finalizado" ? "selected" : ""}>Finalizado</option>
          </select>
        </td>
        <td>
           ${pedido.status === "Pendente" ? `<button class="btn-acao btn-editar" style="background-color: #28a745; color: white;" onclick="confirmarPix(${pedido.id}, '${token}')">Confirmar Pix</button>` : "Nenhuma"}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    tbody.innerHTML =
      '<tr><td colspan="6" style="color: red;">Erro ao listar pedidos.</td></tr>';
  }
}

// ==========================================
// FUNÇÕES DE AÇÃO (UPDATE & DELETE)
// ==========================================
async function alterarStatusPedido(id, novoStatus, token) {
  try {
    const response = await fetch(
      `https://api-lojaleila.onrender.com/api/pedidos/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      },
    );

    if (response.ok) {
      alert("Status do pedido atualizado com sucesso!");
    } else {
      const error = await response.json();
      alert("Erro ao atualizar: " + error.error);
    }
  } catch (error) {
    alert("Erro de comunicação ao atualizar status.");
  }
}

async function confirmarPix(id, token) {
  if (
    !confirm(
      "Deseja confirmar o pagamento manual deste pedido? O estoque será debitado.",
    )
  )
    return;
  try {
    const response = await fetch(
      `https://api-lojaleila.onrender.com/api/pedidos/${id}/confirmar-pagamento`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.ok) {
      alert("Pagamento Pix confirmado!");
      carregarPedidos(token); // Atualiza a tabela
    } else {
      const error = await response.json();
      alert("Erro: " + error.error);
    }
  } catch (error) {
    alert("Erro de comunicação ao confirmar Pix.");
  }
}

async function deletarProduto(id, token) {
  if (
    !confirm(
      "Tem certeza que deseja deletar esta roupa do estoque? Essa ação não pode ser desfeita.",
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      `https://api-lojaleila.onrender.com/api/produtos/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.ok) {
      alert("Roupa removida do estoque com sucesso.");
      carregarProdutos(token);
    } else {
      const data = await response.json();
      alert(`Erro ao excluir: ${data.error || "Tente novamente."}`);
    }
  } catch (error) {
    console.error("Erro ao deletar:", error);
    alert("Falha de conexão ao tentar deletar o produto.");
  }
}

async function editarProduto(id) {
  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    const response = await fetch(
      `https://api-lojaleila.onrender.com/api/produtos/${id}`,
    );

    if (!response.ok) throw new Error("Erro ao buscar dados do produto");

    const produto = await response.json();

    document.getElementById("nomeProduto").value = produto.name;
    document.getElementById("precoProduto").value = produto.price;
    document.getElementById("tamanhoProduto").value = produto.size;
    document.getElementById("estoqueProduto").value = produto.stock;

    document.getElementById("imagemProduto").removeAttribute("required");

    produtoEmEdicaoId = id;
    if (btnSubmitProduto) btnSubmitProduto.innerText = "🔄 Atualizar Produto";
    if (msgProduto) {
      msgProduto.innerText = "Editando produto ID: " + id;
      msgProduto.style.color = "#ffc107";
    }
  } catch (error) {
    console.error("Erro ao entrar em modo de edição:", error);
    alert("Não foi possível carregar os dados desta roupa para edição.");
  }
}
