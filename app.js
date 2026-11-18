
// AZAZY CLOTHES — checkout + order registration + cart controls

const WHATSAPP = "201142336180";

const SUPABASE_URL = "https://xrwimmluzcnqwesrnneq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_85R3ZtthylCEA_MYU5oYcw_bjUh-LGy";

const products = JSON.parse(localStorage.getItem("azazy_products") || "[]");
let cart = JSON.parse(localStorage.getItem("azazy_cart") || "[]");

const $ = (id) => document.getElementById(id);
const money = (n) => `${Number(n).toLocaleString("en-US")} ج.م`;

let isSubmitting = false;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function save() {
  localStorage.setItem("azazy_products", JSON.stringify(products));
  localStorage.setItem("azazy_cart", JSON.stringify(cart));
}

function getCartTotal() {
  return cart.reduce((n, x) => n + Number(x.price) * Number(x.qty), 0);
}

function renderProducts() {
  const term = ($("search")?.value || "").trim().toLowerCase();
  const cat = $("category")?.value || "all";

  const shown = products.filter(p =>
    (cat === "all" || p.category === cat) &&
    String(p.name || "").toLowerCase().includes(term)
  );

  $("products").innerHTML = shown.length
    ? shown.map(p => `
      <article class="product-card">
        ${p.image ? `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}">` : ""}
        <h3>${escapeHTML(p.name)}</h3>
        <p>${escapeHTML(p.description || "")}</p>
        <p class="price">${money(p.price)}</p>
        <p>المقاسات: ${(p.sizes || []).map(escapeHTML).join("، ")}</p>
        <button type="button" data-add="${escapeHTML(p.id)}">أضف للسلة</button>
      </article>
    `).join("")
    : `<div class="empty-state">
        <span>AZAZY</span>
        <h3>${products.length ? "لا توجد نتائج" : "قريباً — المجموعة الأولى"}</h3>
        <p>${products.length ? "جرّب البحث بكلمات أخرى." : "سيتم عرض المنتجات هنا بعد إضافة صورها وأسمائها وأسعارها المعتمدة."}</p>
      </div>`;
}

function renderCart() {
  $("cart-count").textContent = cart.reduce(
    (n, x) => n + Number(x.qty), 0
  );

  $("cart-items").innerHTML = cart.length
    ? cart.map(x => `
      <div class="cart-item">
        <p>
          <strong>${escapeHTML(x.name)}</strong>
          <br>
          ${money(x.price)} × ${Number(x.qty)}
          <br>
          الإجمالي: ${money(Number(x.price) * Number(x.qty))}
        </p>

        <div class="cart-item-controls">
          <button type="button"
            data-cart-action="increase"
            data-cart-id="${escapeHTML(x.id)}"
            ${isSubmitting ? "disabled" : ""}>+</button>

          <span>${Number(x.qty)}</span>

          <button type="button"
            data-cart-action="decrease"
            data-cart-id="${escapeHTML(x.id)}"
            ${isSubmitting ? "disabled" : ""}>−</button>

          <button type="button"
            data-cart-action="remove"
            data-cart-id="${escapeHTML(x.id)}"
            ${isSubmitting ? "disabled" : ""}>حذف</button>
        </div>
      </div>
    `).join("")
    : "السلة فارغة حالياً.";

  $("cart-total").textContent = cart.length
    ? "الإجمالي: " + money(getCartTotal())
    : "";

  if ($("checkout-total")) {
    $("checkout-total").textContent = cart.length
      ? "إجمالي الطلب: " + money(getCartTotal())
      : "";
  }
}

function addToCart(id) {
  if (isSubmitting) return;

  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;

  const found = cart.find(x => String(x.id) === String(id));

  if (found) {
    found.qty = Number(found.qty) + 1;
  } else {
    cart.push({ ...p, qty: 1 });
  }

  save();
  renderCart();
}

function updateCartItem(id, action) {
  if (isSubmitting) return;

  const index = cart.findIndex(x => String(x.id) === String(id));
  if (index === -1) return;

  if (action === "increase") {
    cart[index].qty = Number(cart[index].qty) + 1;
  }

  if (action === "decrease") {
    cart[index].qty = Number(cart[index].qty) - 1;

    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
  }

  if (action === "remove") {
    cart.splice(index, 1);
  }

  save();
  renderCart();
}

$("products").addEventListener("click", e => {
  const btn = e.target.closest("[data-add]");
  if (btn) addToCart(btn.dataset.add);
});

$("cart-items").addEventListener("click", e => {
  const btn = e.target.closest("[data-cart-action]");
  if (!btn) return;

  updateCartItem(btn.dataset.cartId, btn.dataset.cartAction);
});

$("search").addEventListener("input", renderProducts);
$("category").addEventListener("change", renderProducts);

function openCart() {
  $("cart").classList.add("open");
  $("cart-overlay").classList.add("show");
}

function closeCart() {
  $("cart").classList.remove("open");
  $("cart-overlay").classList.remove("show");
}

$("cart-toggle").addEventListener("click", openCart);
$("cart-close").addEventListener("click", closeCart);
$("cart-overlay").addEventListener("click", closeCart);

function openCheckout() {
  if (!cart.length) {
    alert("السلة فارغة");
    return;
  }

  $("checkout-total").textContent =
    "إجمالي الطلب: " + money(getCartTotal());

  $("checkout-error").textContent = "";
  $("checkout-modal").classList.add("open");
  $("checkout-modal").setAttribute("aria-hidden", "false");
}

function closeCheckout() {
  $("checkout-modal").classList.remove("open");
  $("checkout-modal").setAttribute("aria-hidden", "true");
}

$("checkout").addEventListener("click", openCheckout);
$("checkout-close").addEventListener("click", closeCheckout);

$("checkout-modal").addEventListener("click", e => {
  if (e.target === $("checkout-modal")) closeCheckout();
});

function supabaseReady() {
  return SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("YOUR_") &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes("YOUR_");
}

$("checkout-form").addEventListener("submit", async e => {
  e.preventDefault();

  // الاحتفاظ بمرجع النموذج قبل await لحل مشكلة reset
  const checkoutForm = e.currentTarget;

  if (isSubmitting) return;

  if (!cart.length) {
    $("checkout-error").textContent = "السلة فارغة. أضف منتجاً أولاً.";
    return;
  }

  if (!supabaseReady()) {
    $("checkout-error").textContent = "راجع إعدادات Supabase.";
    return;
  }

  const form = new FormData(checkoutForm);

  const customer = {
    name: String(form.get("customer_name") || "").trim(),
    phone: String(form.get("phone") || "").trim(),
    governorate: String(form.get("governorate") || "").trim(),
    address: String(form.get("address") || "").trim(),
    notes: String(form.get("notes") || "").trim()
  };

  if (!customer.name || !customer.phone ||
      !customer.governorate || !customer.address) {
    $("checkout-error").textContent =
      "من فضلك أكمل كل البيانات المطلوبة.";
    return;
  }

  // أخذ نسخة ثابتة من المنتجات وقت تأكيد الطلب
  const items = cart.map(x => ({
    product_id: String(x.id),
    name: String(x.name),
    price: Number(x.price),
    quantity: Number(x.qty),
    size: x.selectedSize || null,
    color: x.selectedColor || null
  }));

  const total = items.reduce(
    (n, x) => n + x.price * x.quantity, 0
  );

  const order = {
    customer_name: customer.name,
    phone: customer.phone,
    governorate: customer.governorate,
    address: customer.address,
    notes: customer.notes,
    items,
    total,
    status: "new"
  };

  const orderLines = items.map(x =>
    `- ${x.name} | العدد: ${x.quantity} | السعر: ${money(x.price * x.quantity)}`
  ).join("\n");

  const message = `طلب جديد من AZAZY CLOTHES
الاسم: ${customer.name}
الموبايل: ${customer.phone}
المحافظة: ${customer.governorate}
العنوان: ${customer.address}
ملاحظات: ${customer.notes || "لا يوجد"}

المنتجات:
${orderLines}

الإجمالي: ${money(total)}`;

  const btn = $("submit-order");

  isSubmitting = true;
  btn.disabled = true;
  btn.textContent = "جاري تسجيل الطلب...";
  $("checkout-error").textContent = "";
  renderCart();

  let orderRegistered = false;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(order)
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `HTTP ${response.status}`);
    }

    // وصلنا هنا: Supabase أكد تسجيل الطلب
    orderRegistered = true;

    // تفريغ السلة بعد نجاح التسجيل فقط
    cart = [];

    try {
      save();
      renderCart();
      checkoutForm.reset();
      closeCheckout();
      closeCart();
    } catch (uiError) {
      console.error("Post-order display error:", uiError);
    }

    // فتح واتساب بعد تسجيل الطلب
    window.location.href =
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

  } catch (err) {
    console.error("AZAZY order submission failed:", err);

    if (orderRegistered) {
      $("checkout-error").textContent =
        "تم تسجيل طلبك بنجاح، لكن حدثت مشكلة أثناء تجهيز الصفحة. لا تعيد إرسال الطلب.";
    } else {
      $("checkout-error").textContent =
        "فشل تسجيل الطلب: " + (err.message || "خطأ غير معروف") +
        ". السلة محفوظة؛ حاول مرة أخرى بعد إصلاح السبب.";
    }

  } finally {
    isSubmitting = false;
    btn.disabled = false;
    btn.textContent = "تأكيد الطلب وإرساله";
    renderCart();
  }
});

$("menu-toggle").addEventListener("click", () =>
  $("main-nav").classList.toggle("open")
);

$("main-nav").querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () =>
    $("main-nav").classList.remove("open")
  )
);

$("year").textContent = new Date().getFullYear();

renderProducts();
renderCart();

window.AZAZYStore = {
  addProduct(p) {
    if (!p || !p.name || !Number.isFinite(Number(p.price))) {
      throw new Error("أدخل اسم المنتج وسعره الصحيح");
    }

    products.push({
      id: String(Date.now()),
      category: "tshirt",
      sizes: [],
      ...p,
      price: Number(p.price)
    });

    save();
    renderProducts();
  },

  removeProduct(id) {
    const i = products.findIndex(x => String(x.id) === String(id));
    if (i >= 0) products.splice(i, 1);

    save();
    renderProducts();
  },

  list() {
    return products;
  }
};
