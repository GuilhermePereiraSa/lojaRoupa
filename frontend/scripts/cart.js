// Load cart items
document.addEventListener('DOMContentLoaded', () => {
    displayCart();
});

function displayCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.querySelector('#cart-total p');
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
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
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
}