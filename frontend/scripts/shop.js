document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});

async function fetchProducts() {
  try {
    const response = await fetch("http://localhost:3001/api/produtos");

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
  container.innerHTML = ""; // Limpa qualquer conteúdo anterior

  products.forEach((product) => {
    // Garantindo que o preço será formatado corretamente
    const priceFormatted = parseFloat(product.price)
      .toFixed(2)
      .replace(".", ",");

    const productHTML = `
              <div class="pro">
                  <img src="${product.image}" alt="${product.name}" />
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
                  <button
                      class="add-to-cart"
                      data-name="${product.name}"
                      data-price="${product.price}"
                      data-img="${product.image}"
                  >
                      Adicionar ao Carrinho
                  </button>
              </div>
          `;
    container.innerHTML += productHTML;
  });

  // atrelar o evento de clique neles novamente
  attachCartEvents();
}

function attachCartEvents() {
  const addToCartButtons = document.querySelectorAll(".add-to-cart");
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.getAttribute("data-name");
      const price = parseFloat(button.getAttribute("data-price"));
      const img = button.getAttribute("data-img");

      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      cart.push({ name, price, img });
      localStorage.setItem("cart", JSON.stringify(cart));

      alert(`${name} adicionado ao carrinho!`);
    });
  });
}
