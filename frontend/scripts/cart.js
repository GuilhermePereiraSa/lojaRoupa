// Load cart items
document.addEventListener("DOMContentLoaded", () => {
  displayCart();

  const checkoutBtn = document.getElementById("checkout-btn");

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      // Verifique se no seu login.js você salvou como "Token" ou "token"
      const token =
        localStorage.getItem("Token") || localStorage.getItem("token");

      if (!token) {
        alert("Você precisa fazer login para finalizar a compra!");
        localStorage.setItem("redirectAfterLogin", "cart.html");
        window.location.href = "login.html";
        return; // Retorna para parar a execução
      }

      const cart = JSON.parse(localStorage.getItem("cart")) || [];

      if (cart.length === 0) {
        alert("Seu carrinho está vazio.");
        return;
      }

      // Calculando o total para enviar ao backend
      const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

      try {
        console.log("Enviando pedido para o servidor...");

        const response = await fetch("http://localhost:3001/api/pedidos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Passando o JWT para o middleware
          },
          body: JSON.stringify({
            totalPrice: totalPrice,
            items: cart,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // =========================================================
          // INÍCIO DA LÓGICA DO PIX (Substitui o alert e displayCart)
          // =========================================================

          // Selecionamos a tag <section> principal que engloba o carrinho no seu HTML
          const cartSection = document.querySelector("section");

          // Trocamos o conteúdo da tela pelo QR Code e a chave Copia e Cola
          cartSection.innerHTML = `
              <div style="text-align: center; padding: 2rem;">
                  <h2>Pedido #${data.orderId} Fechado com Sucesso!</h2>
                  <p>Escaneie o QR Code abaixo no aplicativo do seu banco para pagar:</p>

                  <img src="${data.pix.qrCodeImage}" alt="QR Code Pix" style="width: 250px; height: 250px; border: 1px solid #ccc; border-radius: 8px; margin: 1rem 0;">

                  <p>Ou utilize o Pix Copia e Cola:</p>
                  <input type="text" value="${data.pix.copiaECola}" id="pix-input" readonly style="width: 100%; max-width: 400px; padding: 10px; margin-bottom: 10px; text-align: center; border: 1px solid #aaa; border-radius: 4px;">
                  <br>
                  <button id="copy-btn" style="padding: 10px 20px; cursor: pointer; background-color: #28a745; color: white; border: none; border-radius: 4px; font-weight: bold;">Copiar Código Pix</button>
              </div>
          `;

          // Adicionamos a lógica para o botão "Copiar Código Pix" funcionar
          document.getElementById("copy-btn").addEventListener("click", () => {
            const pixInput = document.getElementById("pix-input");

            // Usamos a API moderna de Clipboard do navegador
            navigator.clipboard
              .writeText(pixInput.value)
              .then(() => {
                alert("Código Pix copiado para a área de transferência!");
              })
              .catch((err) => {
                console.error("Erro ao copiar", err);
                // Fallback para navegadores mais antigos
                pixInput.select();
                document.execCommand("copy");
                alert("Código Pix copiado para a área de transferência!");
              });
          });

          // Limpa o carrinho local, pois o pedido já foi gerado no banco de dados
          localStorage.removeItem("cart");

          // =========================================================
          // FIM DA LÓGICA DO PIX
          // =========================================================
        } else {
          // Exibe a mensagem de erro que vier do backend
          alert("Erro ao processar pedido: " + (data.error || data.message));
        }
      } catch (error) {
        console.error("Erro no checkout:", error);
        alert("Erro de comunicação com o servidor.");
      }
    });
  }
});

// Suas funções auxiliares continuam exatamente iguais:

function displayCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotal = document.querySelector("#cart-total p");
  cartItemsContainer.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Seu carrinho está vazio.</p>";
  } else {
    cart.forEach((item, index) => {
      total += item.price;
      const itemDiv = document.createElement("div");
      itemDiv.className = "cart-item";
      itemDiv.innerHTML = `
                <img src="${item.img}" alt="${item.name}" style="width: 50px; height: 50px;">
                <span>${item.name}</span>
                <span>R$ ${item.price.toFixed(2)}</span>
                <button onclick="removeFromCart(${index})">Remover</button>
            `;
      cartItemsContainer.appendChild(itemDiv);
    });
  }

  cartTotal.textContent = `Total: R$ ${total.toFixed(2)}`;
}

function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  displayCart();
}
