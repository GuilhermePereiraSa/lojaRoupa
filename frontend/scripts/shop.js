document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});

async function fetchProducts() {
  try {
    const response = await fetch(
      "https://api-lojaleila.onrender.com/api/produtos",
    );

    if (!response.ok) throw new Error("Erro ao buscar produtos");

    const products = await response.json();
    renderProducts(products);
  } catch (error) {
    console.error("Erro do Fetch:", error);
    document.querySelector(".pro-container").innerHTML =
      "<p>Não foi possível carregar os produtos no momento.</p>";
  }
}

function renderProducts(products) {
  const container = document.querySelector(".pro-container");
  container.innerHTML = "";

  products.forEach((product) => {
    const priceFormatted = parseFloat(product.price)
      .toFixed(2)
      .replace(".", ",");

    // Lógica para consertar o caminho da imagem:
    // Se a imagem for do upload do multer (começa com /public), usa o localhost:3001
    // Se for as inseridas manualmente no PostgreSQL (../img), mantém igual
    const imageUrl = product.image.startsWith("/public")
      ? `https://api-lojaleila.onrender.com${product.image}`
      : product.image;

    const productHTML = `
              <div class="pro">
                  <img src="${imageUrl}" alt="${product.name}" />
                  <div class="des">
                      <span>Loja Leila</span>
                      <h5>${product.name} (Tam: ${product.size})</h5>
                      <div class="star">
                          <i class="bi bi-star-fill"></i>
                          <i class="bi bi-star-fill"></i>
                          <i class="bi bi-star-fill"></i>
                          <i class="bi bi-star-fill"></i>
                          <i class="bi bi-star-fill"></i>
                      </div>
                      <h4>R$ ${priceFormatted}</h4>
                  </div>
            <div class="qty-controls">
              <button class="qty-decrease" data-id="${product.id}">-</button>
              <input type="number" class="qty-input" data-id="${product.id}" value="1" min="1" />
              <button class="qty-increase" data-id="${product.id}">+</button>
            </div>
            <button
              class="add-to-cart"
              data-id="${product.id}"
              data-name="${product.name}"
              data-price="${product.price}"
              data-img="${imageUrl}"
            >
              Adicionar ao Carrinho
            </button>
              </div>
          `;
    container.innerHTML += productHTML;
  });

  attachCartEvents();
}

function attachCartEvents() {
  const addToCartButtons = document.querySelectorAll(".add-to-cart");
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Puxando o ID agora!
      const id = button.getAttribute("data-id");
      const name = button.getAttribute("data-name");
      const price = parseFloat(button.getAttribute("data-price"));
      const img = button.getAttribute("data-img");

      // Ler quantidade associada a este produto (input com data-id igual)
      const qtyInput = document.querySelector(`.qty-input[data-id="${id}"]`);
      let quantity = 1;
      if (qtyInput) {
        quantity = parseInt(qtyInput.value, 10) || 1;
        if (quantity < 1) quantity = 1;
      }

      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existing = cart.find((item) => String(item.id) === String(id));
      if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity;
      } else {
        cart.push({ id, name, price, img, quantity });
      }
      localStorage.setItem("cart", JSON.stringify(cart));

      alert(`${name} (x${quantity}) adicionado ao carrinho!`);
    });
  });

  // Quantity buttons (+ / -)
  const increaseButtons = document.querySelectorAll(".qty-increase");
  increaseButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const input = document.querySelector(`.qty-input[data-id="${id}"]`);
      if (input) {
        input.value = Math.max(1, parseInt(input.value || "1", 10) + 1);
      }
    });
  });

  const decreaseButtons = document.querySelectorAll(".qty-decrease");
  decreaseButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const input = document.querySelector(`.qty-input[data-id="${id}"]`);
      if (input) {
        input.value = Math.max(1, parseInt(input.value || "1", 10) - 1);
      }
    });
  });
}
