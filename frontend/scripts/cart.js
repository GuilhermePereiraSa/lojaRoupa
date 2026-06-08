document.addEventListener("DOMContentLoaded", () => {
  displayCart();

  // --- Lógica de Mostrar/Esconder o Endereço ---
  const radioRetirada = document.getElementById("retirada");
  const radioEntrega = document.getElementById("entrega");
  const addressContainer = document.getElementById("address-container");

  function toggleAddressVisibility() {
    if (radioEntrega.checked) {
      addressContainer.style.display = "block";
    } else {
      addressContainer.style.display = "none";
    }
  }

  // Ouve as mudanças nos radio buttons
  if (radioRetirada && radioEntrega) {
    radioRetirada.addEventListener("change", toggleAddressVisibility);
    radioEntrega.addEventListener("change", toggleAddressVisibility);
  }
  // ---------------------------------------------

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const token =
        localStorage.getItem("Token") || localStorage.getItem("token");
      if (!token) {
        alert("Você precisa fazer login para finalizar a compra!");
        window.location.href = "login.html";
        return;
      }

      // --- Captura as Opções de Entrega ---
      const selectedMethod = document.querySelector(
        'input[name="deliveryMethod"]:checked',
      ).value;
      const deliveryAddressInput =
        document.getElementById("deliveryAddress").value;

      // Validação do front-end para evitar requisições nulas
      if (selectedMethod === "entrega" && deliveryAddressInput.trim() === "") {
        alert("Por favor, preencha o seu endereço completo para a entrega.");
        document.getElementById("deliveryAddress").focus();
        return;
      }
      // ------------------------------------

      try {
        console.log("Solicitando checkout ao servidor...");

        const response = await fetch(
          "https://api-lojaleila.onrender.com/api/pedidos",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            // Substituímos o valor chumbado pelos dados reais do formulário
            body: JSON.stringify({
              deliveryMethod: selectedMethod,
              deliveryAddress:
                selectedMethod === "entrega" ? deliveryAddressInput : null,
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          const cartSection = document.querySelector("section");

          // Customização extra: Avisa na tela final se a pessoa vai retirar ou se vai ser entregue
          const entregaMensagem =
            selectedMethod === "entrega"
              ? `<p style="color: #0056b3; font-weight: bold;">Seu pedido será entregue em: ${deliveryAddressInput}</p>`
              : `<p style="color: #0056b3; font-weight: bold;">Seu pedido está sendo preparado para retirada na loja.</p>`;

          cartSection.innerHTML = `
              <div style="text-align: center; padding: 2rem;">
                  <h2>Pedido #${data.orderId} Fechado com Sucesso!</h2>
                  ${entregaMensagem}
                  <p>Escaneie o QR Code abaixo para pagar:</p>
                  <img src="${data.pix.qrCodeImage}" alt="QR Code Pix" style="width: 250px; height: 250px; border: 1px solid #ccc; border-radius: 8px; margin: 1rem 0;">
                  <p>Ou utilize o Pix Copia e Cola:</p>
                  <input type="text" value="${data.pix.copiaECola}" id="pix-input" readonly style="width: 100%; max-width: 400px; padding: 10px; margin-bottom: 10px; text-align: center; border: 1px solid #aaa; border-radius: 4px;">
                  <br>
                  <button id="copy-btn" style="padding: 10px 20px; cursor: pointer; background-color: #28a745; color: white; border: none; border-radius: 4px; font-weight: bold;">Copiar Código Pix</button>
              </div>
          `;

          document.getElementById("copy-btn").addEventListener("click", () => {
            const pixInput = document.getElementById("pix-input");
            navigator.clipboard
              .writeText(pixInput.value)
              .then(() => {
                alert("Código Pix copiado!");
              })
              .catch(() => {
                pixInput.select();
                document.execCommand("copy");
              });
          });
        } else {
          alert("Erro ao processar pedido: " + (data.error || data.message));
        }
      } catch (error) {
        console.error("Erro no checkout:", error);
        alert("Erro de comunicação com o servidor.");
      }
    });
  }
});

async function displayCart() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotal = document.querySelector("#cart-total p");
  const token = localStorage.getItem("Token") || localStorage.getItem("token");

  if (!token) {
    cartItemsContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p>Você precisa estar logado para ver o seu carrinho.</p>
        <a href="login.html" style="color: #28a745; font-weight: bold; text-decoration: underline;">Fazer Login</a>
      </div>
    `;
    cartTotal.textContent = `Total: R$ 0,00`;
    return;
  }

  try {
    const response = await fetch(
      "https://api-lojaleila.onrender.com/api/cart",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) throw new Error("Erro ao buscar carrinho do servidor");

    const cartItems = await response.json();
    cartItemsContainer.innerHTML = "";
    let total = 0;

    if (cartItems.length === 0) {
      cartItemsContainer.innerHTML = "<p>Seu carrinho está vazio.</p>";
    } else {
      cartItems.forEach((item) => {
        const produto = item.Clothing;
        const quantity = item.quantity;
        const precoNum = parseFloat(produto.price);
        total += precoNum * quantity;

        // Formata a URL da imagem igual você fez no shop.js
        const imageUrl = produto.image.startsWith("/public")
          ? `https://api-lojaleila.onrender.com${produto.image}`
          : produto.image;

        const itemDiv = document.createElement("div");
        itemDiv.className = "cart-item";
        itemDiv.innerHTML = `
          <img src="${imageUrl}" alt="${produto.name}" style="width: 70px; height: 70px; object-fit: cover;">
          <div class="cart-item-info">
            <span class="cart-item-name">${produto.name}</span>
            <span class="cart-item-price">R$ ${precoNum.toFixed(2).replace(".", ",")}</span>
          </div>
          <div class="cart-item-qty">
            <button class="qty-decrease" data-id="${item.id}">-</button>
            <input type="number" min="1" class="qty-input" data-id="${item.id}" value="${quantity}" readonly style="width: 40px; text-align: center;" />
            <button class="qty-increase" data-id="${item.id}">+</button>
          </div>
          <div class="cart-item-actions">
            <span class="cart-item-subtotal">R$ ${(precoNum * quantity).toFixed(2).replace(".", ",")}</span>
            <button class="remove-btn" data-id="${item.id}">Remover</button>
          </div>
        `;
        cartItemsContainer.appendChild(itemDiv);
      });

      attachCartActionEvents(token);
    }

    cartTotal.textContent = `Total: R$ ${total.toFixed(2).replace(".", ",")}`;
  } catch (error) {
    console.error("Erro ao carregar o carrinho:", error);
    cartItemsContainer.innerHTML =
      "<p>Erro ao carregar o carrinho. Tente novamente mais tarde.</p>";
  }
}

// Associa os botões dinâmicos gerados no HTML às rotas da API
function attachCartActionEvents(token) {
  // Remover item (DELETE)
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cartItemId = btn.getAttribute("data-id");
      await updateCartAPI(
        "DELETE",
        `https://api-lojaleila.onrender.com/api/cart/remove/${cartItemId}`,
        token,
      );
    });
  });

  // Aumentar quantidade (PUT)
  document.querySelectorAll(".qty-increase").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cartItemId = btn.getAttribute("data-id");
      const input = document.querySelector(
        `.qty-input[data-id="${cartItemId}"]`,
      );
      const newQty = parseInt(input.value) + 1;
      await updateCartAPI(
        "PUT",
        `https://api-lojaleila.onrender.com/api/cart/update/${cartItemId}`,
        token,
        { quantity: newQty },
      );
    });
  });

  // Diminuir quantidade (PUT)
  document.querySelectorAll(".qty-decrease").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cartItemId = btn.getAttribute("data-id");
      const input = document.querySelector(
        `.qty-input[data-id="${cartItemId}"]`,
      );
      const newQty = Math.max(1, parseInt(input.value) - 1);

      if (parseInt(input.value) !== newQty) {
        await updateCartAPI(
          "PUT",
          `https://api-lojaleila.onrender.com/api/cart/update/${cartItemId}`,
          token,
          { quantity: newQty },
        );
      }
    });
  });
}

// Função auxiliar para evitar repetição de código nas requisições
async function updateCartAPI(method, url, token, bodyData = null) {
  try {
    const options = {
      method: method,
      headers: { Authorization: `Bearer ${token}` },
    };

    if (bodyData) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(bodyData);
    }

    const response = await fetch(url, options);
    if (response.ok) {
      displayCart(); // Recarrega o carrinho para mostrar os novos valores e totais
    } else {
      alert("Erro ao atualizar o carrinho.");
    }
  } catch (error) {
    console.error("Erro na operação do carrinho:", error);
  }
}
