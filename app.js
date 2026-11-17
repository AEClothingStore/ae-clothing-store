
const imageFiles = [
  "WhatsApp Image 2026-11-17 at 3.10.02 PM (1).jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.02 PM (2).jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.02 PM (3).jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.02 PM.jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.03 PM (1).jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.03 PM (2).jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.03 PM (3).jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.03 PM (4).jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.03 PM (5).jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.03 PM.jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.04 PM (1).jpeg",
  "WhatsApp Image 2026-11-17 at 3.10.04 PM.jpeg"
];

const products = document.getElementById("products");

products.innerHTML = imageFiles.map((file, index) => {
  const src = "images/" + encodeURIComponent(file);
  const number = String(index + 1).padStart(2, "0");

  return `
    <article class="product">
      <div class="product-image">
        <img
          src="${src}"
          alt="AE Clothing — Piece ${number}"
          loading="${index < 3 ? "eager" : "lazy"}"
        >
      </div>

      <div class="product-meta">
        <span class="product-name">AE / PIECE ${number}</span>
        <span class="product-status">COMING SOON</span>
      </div>
    </article>
  `;
}).join("");

document.getElementById("year").textContent =
  new Date().getFullYear();
