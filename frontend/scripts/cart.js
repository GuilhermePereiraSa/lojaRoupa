// Load cart items
document.addEventListener("DOMContentLoaded", () => {
  displayCart();

  const checkoutBtn = document.getElementById("checkout-btn");

  if (checkoutBtn) {
    // Adicionamos o "async" aqui para poder usar o "await" no fetch
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
          alert("Pedido finalizado com sucesso!");
          localStorage.removeItem("cart"); // Esvazia o carrinho no front
          displayCart(); // Atualiza a tela
          // window.location.href = "sucesso.html"; // Opcional: redirecionar para tela de sucesso
        } else {
          alert("Erro ao processar pedido: " + data.message);
        }
      } catch (error) {
        console.error("Erro no checkout:", error);
        alert("Erro de comunicação com o servidor.");
      }
    });
  }
});

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
