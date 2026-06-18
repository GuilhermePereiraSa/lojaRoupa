// Carrega os produtos assim que a página terminar de carregar o HTML
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});
async function fetchProducts() {
  // 1. O container PRECISA ser declarado antes de qualquer coisa!
  const container = document.querySelector(".pro-container");

  // 2. Verifica se o usuário tem o token
  const token = localStorage.getItem("Token") || localStorage.getItem("token");

  // 3. Trava de segurança: Se NÃO tiver logado
  if (!token) {
    if (container) {
      container.innerHTML = `
          <div style="text-align: center; width: 100%; padding: 40px;">
            <h3 style="color: #065a52; margin-bottom: 15px;">Catálogo Exclusivo</h3>
            <p style="font-size: 18px; margin-bottom: 20px;">Você precisa estar logado para ver nossas roupas e tendências.</p>
            <button onclick="window.location.href='login.html'" style="background-color: #088178; padding: 12px 25px; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">
              Fazer Login ou Cadastrar
            </button>
          </div>
        `;
    }
    return; // O "return" encerra a função aqui. O código abaixo não vai rodar!
  }

  // 4. Se passou pela trava (está logado), busca os produtos no banco
  try {
    const response = await fetch(
      "https://api-lojaleila.onrender.com/api/produtos",
    );

    if (!response.ok) throw new Error("Erro ao buscar produtos do servidor");

    const products = await response.json();
    container.innerHTML = "";

    if (products.length === 0) {
      container.innerHTML =
        "<p style='text-align: center; width: 100%;'>Nenhuma roupa cadastrada no momento.</p>";
      return;
    }

    products.forEach((produto) => {
      const imageUrl =
        produto.image && produto.image.startsWith("/public")
          ? `https://api-lojaleila.onrender.com${produto.image}`
          : produto.image;

      const precoNum = parseFloat(produto.price);

      const productCard = document.createElement("div");
      productCard.className = "pro";

      productCard.innerHTML = `
        <img src="${imageUrl}" alt="${produto.name}" style="width: 100%; border-radius: 20px;">
        <div class="des">
          <span>Tamanho: ${produto.size}</span>
          <h5>${produto.name}</h5>
          <h4>R$ ${precoNum.toFixed(2).replace(".", ",")}</h4>
        </div>
        <div class="cart-actions" style="margin-top: 10px;">
          <button class="qty-decrease" data-id="${produto.id}">-</button>
          <input type="number" min="1" class="qty-input" data-id="${produto.id}" value="1" readonly style="width: 40px; text-align: center;" />
          <button class="qty-increase" data-id="${produto.id}">+</button>
          <br><br>
          <button class="add-to-cart" data-id="${produto.id}" data-name="${produto.name}">Adicionar ao Carrinho</button>
        </div>
      `;

      container.appendChild(productCard);
    });

    attachCartEvents();
  } catch (error) {
    console.error("Erro ao carregar a vitrine:", error);
    container.innerHTML =
      "<p>Erro ao carregar os produtos. Tente novamente mais tarde.</p>";
  }
}

function attachCartEvents() {
  const addToCartButtons = document.querySelectorAll(".add-to-cart");
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-id");
      const name = button.getAttribute("data-name");

      // Verifica login
      const token =
        localStorage.getItem("Token") || localStorage.getItem("token");
      if (!token) {
        alert("Você precisa fazer login para adicionar itens ao carrinho!");
        window.location.href = "login.html";
        return;
      }

      // Lê a quantidade selecionada na tela
      const qtyInput = document.querySelector(`.qty-input[data-id="${id}"]`);
      let quantity = 1;
      if (qtyInput) {
        quantity = parseInt(qtyInput.value, 10) || 1;
      }

      // NOVO: Faz o POST para o banco de dados
      try {
        const response = await fetch(
          "https://api-lojaleila.onrender.com/api/cart/add",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              clothingId: id, // O back-end espera 'clothingId'
              quantity: quantity,
            }),
          },
        );

        if (response.ok) {
          alert(`${name} (x${quantity}) adicionado ao carrinho!`);
        } else {
          const errorData = await response.json();
          alert(
            "Erro: " +
              (errorData.error || "Não foi possível adicionar ao carrinho."),
          );
        }
      } catch (error) {
        console.error("Erro ao adicionar ao carrinho:", error);
        alert("Erro de comunicação com o servidor.");
      }
    });
  });

  // Mantém a lógica visual dos botões de + e - da vitrine
  document.querySelectorAll(".qty-increase").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const input = document.querySelector(`.qty-input[data-id="${id}"]`);
      if (input) input.value = parseInt(input.value || "1", 10) + 1;
    });
  });

  document.querySelectorAll(".qty-decrease").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const input = document.querySelector(`.qty-input[data-id="${id}"]`);
      if (input)
        input.value = Math.max(1, parseInt(input.value || "1", 10) - 1);
    });
  });
}
