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
