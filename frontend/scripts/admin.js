document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  // Proteção básica: se não tem token, chuta pro login
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Inicializa as listagens
  carregarProdutos(token);
  carregarClientes(token);
  // carregarPedidos(token); // Se você já tiver a função de pedidos, chame aqui

  // Lógica do Formulário de Adicionar Produto (Estoque)
  const formAddProduto = document.getElementById("form-add-produto");
  const msgProduto = document.getElementById("produto-mensagem");
  const btnSubmitProduto = document.querySelector(
    "#form-add-produto .btn-submit",
  );

  formAddProduto.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgProduto.innerText = produtoEmEdicaoId
      ? "Atualizando produto..."
      : "Salvando produto...";
    msgProduto.style.color = "blue";

    const formData = new FormData(formAddProduto);
    const token = localStorage.getItem("token");

    // Define a URL e o Método dependendo se é Cadastro (POST) ou Edição (PUT)
    const url = produtoEmEdicaoId
      ? `/api/produtos/${produtoEmEdicaoId}`
      : "/api/produtos";
    const method = produtoEmEdicaoId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` }, // Sem Content-Type, deixa o navegador resolver o boundary do arquivo
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        msgProduto.style.color = "green";
        msgProduto.innerText = produtoEmEdicaoId
          ? "Roupa atualizada com sucesso!"
          : "Roupa adicionada ao estoque!";

        // Reseta o formulário e volta para o modo "Cadastro"
        formAddProduto.reset();
        produtoEmEdicaoId = null;
        btnSubmitProduto.innerText = "+ Salvar Produto no Estoque";

        carregarProdutos(token); // Atualiza a tabela
      } else {
        msgProduto.style.color = "red";
        msgProduto.innerText = data.error || "Erro ao salvar o produto.";
      }
    } catch (error) {
      console.error("Erro no upload/edição:", error);
      msgProduto.style.color = "red";
      msgProduto.innerText = "Falha de comunicação com o servidor.";
    }
  });
});

// ==========================================
// FUNÇÕES DE LISTAGEM (READ)
// ==========================================

async function carregarProdutos(token) {
  const tbody = document.getElementById("lista-admin-produtos");
  tbody.innerHTML = '<tr><td colspan="6">Carregando estoque...</td></tr>';

  try {
    // Usa a rota GET /api/produtos que já está pronta para a vitrine
    const response = await fetch("/api/produtos");
    const produtos = await response.json();

    tbody.innerHTML = "";

    if (produtos.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6">Nenhuma roupa cadastrada no estoque.</td></tr>';
      return;
    }

    produtos.forEach((produto) => {
      const precoFormatado = Number(produto.preco).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      // Ajuste o caminho da imagem de acordo com o que o Multer salva no banco
      const caminhoImagem = produto.imagem
        ? `/${produto.imagem}`
        : "../img/placeholder.png";

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>#${produto.id}</td>
                <td><img src="${caminhoImagem}" alt="${produto.nome}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td>${produto.nome}</td>
                <td>${produto.tamanho}</td>
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
    const response = await fetch("/api/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    });

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
                <td>${cliente.name || cliente.nome}</td>
                <td>${cliente.email}</td>
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

// ==========================================
// FUNÇÕES DE AÇÃO (UPDATE & DELETE)
// ==========================================

async function deletarProduto(id, token) {
  if (
    !confirm(
      "Tem certeza que deseja deletar esta roupa do estoque? Essa ação não pode ser desfeita.",
    )
  ) {
    return; // Cancela se o usuário clicar em "Não"
  }

  try {
    const response = await fetch(`/api/produtos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      alert("Roupa removida do estoque com sucesso.");
      carregarProdutos(token); // Recarrega a tabela para sumir com o item
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
  // Rola a página para cima suavemente para a Dona Leila ver o formulário
  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    // Busca os dados atuais daquele produto específico no back-end
    const response = await fetch(`/api/produtos/${id}`);

    if (!response.ok) throw new Error("Erro ao buscar dados do produto");

    const produto = await response.json();

    // Preenche os inputs com os dados do banco
    document.getElementById("nomeProduto").value = produto.nome;
    document.getElementById("precoProduto").value = produto.preco;
    document.getElementById("tamanhoProduto").value = produto.tamanho;
    document.getElementById("descricaoProduto").value = produto.descricao;

    // A imagem não pode ser preenchida automaticamente por questões de segurança dos navegadores,
    // então removemos a obrigatoriedade (required) durante a edição.
    // No seu back-end (clothing.controller.js), você deve tratar para manter a imagem antiga se req.file for undefined num PUT.
    document.getElementById("imagemProduto").removeAttribute("required");

    // Altera o estado da variável global e o texto do botão
    produtoEmEdicaoId = id;
    btnSubmitProduto.innerText = "🔄 Atualizar Produto";
    msgProduto.innerText = "Editando produto ID: " + id;
    msgProduto.style.color = "#ffc107"; // Um amarelo/laranja para chamar atenção
  } catch (error) {
    console.error("Erro ao entrar em modo de edição:", error);
    alert("Não foi possível carregar os dados desta roupa para edição.");
  }
}
