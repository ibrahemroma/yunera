let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(id) {
  const product = products.find(p => p.id === id);
  cart.push(product);
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart");
}

function loadProducts(category) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  products
    .filter(p => p.category === category)
    .forEach(p => {
      container.innerHTML += `
        <div class="card">
          <h3>${p.name}</h3>
          <p>${p.price} EGP</p>
          <button onclick="addToCart('${p.id}')">Add to Cart</button>
        </div>
      `;
    });
}

function loadCart() {
  const container = document.getElementById("cart");
  let total = 0;

  cart.forEach(p => {
    total += p.price;
    container.innerHTML += `<p>${p.name} - ${p.price} EGP</p>`;
  });

  container.innerHTML += `<h3>Total: ${total} EGP</h3>`;
}