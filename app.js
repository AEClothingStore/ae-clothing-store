
// AZAZY CLOTHES — Shared Products + Cart + Checkout

const WHATSAPP = "201142336180";

const SUPABASE_URL = "https://xrwimmluzcnqwesrnneq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_85R3ZtthylCEA_MYU5oYcw_bjUh-LGy";

let products = [];
let cart = JSON.parse(localStorage.getItem("azazy_cart") || "[]");

const $ = id => document.getElementById(id);
const money = n => `${Number(n).toLocaleString("en-US")} ج.م`;

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
  localStorage.setItem("azazy_cart", JSON.stringify(cart));
}

function getCartTotal() {
  return cart.reduce(
    (total, item) => total + Number(item.price) * Number(item.qty),
    0
  );
}

// تحميل المنتجات من Supabase
async function loadProducts() {
  $("products").innerHTML = `
    <div class="empty-state">
      <span>AZAZY</span>
      <h3>جاري تحميل المجموعة...</h3>
    </div>`;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,category,description,price,image,sizes,colors&active=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    products = await response.json();
    renderProducts();

  } catch (error) {
    console.error("Products loading error:", error);

    $("products").innerHTML = `
      <div class="empty-state">
        <span>AZAZY</span>
        <h3>تعذر تحميل المنتجات</h3>
        <p>راجع إعدادات جدول المنتجات في Supabase.</p>
      </div>`;
  }
}

// عرض المنتجات
function renderProducts() {
  const term = ($("search")?.value || "").trim().toLowerCase();
  const cat = $("category")?.value || "all";

  const shown = products.filter(p =>
    (cat === "all" || p.category === cat) &&
    String(p.name || "").toLowerCase().includes(term)
  );

  $("products").innerHTML = shown.length
    ? shown.map(p => {
        const sizes = Array.isArray(p.sizes) ? p.sizes : [];
        const colors = Array.isArray(p.colors) ? p.colors : [];

        return `
          <article class="product-card"
            data-product-card="${escapeHTML(p.id)}">

            ${p.image ? `
              <img
                src="${escapeHTML(p.image)}"
                alt="${escapeHTML(p.name)}"
                onerror="this.style.display='none'"
              >
            ` : ""}

            <h3>${escapeHTML(p.name)}</h3>
            <p>${escapeHTML(p.description || "")}</p>
            <p class="price">${money(p.price)}</p>

            ${colors.length ? `
              <label class="product-option">
                <span>اختار اللون</span>
                <select data-color-select>
                  ${colors.map(color => `
                    <option value="${escapeHTML(color)}">
                      ${escapeHTML(color)}
                    </option>
                  `).join("")}
                </select>
              </label>
            ` : ""}

            ${sizes.length ? `
              <label class="product-option">
                <span>اختار المقاس</span>
                <select data-size-select>
                  ${sizes.map(size => `
                    <option value="${escapeHTML(size)}">
                      ${escapeHTML(size)}
                    </option>
                  `).join("")}
                </select>
              </label>
            ` : ""}

            <button type="button"
              data-add="${escapeHTML(p.id)}"
              class="add-product-button">
              أضف للسلة
            </button>

          </article>
        `;
      }).join("")
    : `
      <div class="empty-state">
        <span>AZAZY</span>
        <h3>${products.length ? "لا توجد نتائج" : "لا توجد منتجات حاليًا"}</h3>
        <p>سيتم عرض المنتجات هنا عند إضافتها للمتجر.</p>
      </div>`;
}

// إضافة للسلة
function addToCart(id, card) {
  if (isSubmitting) return;

  const product = products.find(p => String(p.id) === String(id));
  if (!product) return;

  const selectedColor =
    card.querySelector("[data-color-select]")?.value || "";

  const selectedSize =
    card.querySelector("[data-size-select]")?.value || "";

  const found = cart.find(item =>
    String(item.id) === String(id) &&
    String(item.selectedColor || "") === selectedColor &&
    String(item.selectedSize || "") === selectedSize
  );

  if (found) {
    found.qty = Number(found.qty) + 1;
  } else {
    cart.push({
      ...product,
      selectedColor,
      selectedSize,
      qty: 1
    });
  }

  save();
  renderCart();

  const button = card.querySelector("[data-add]");
  if (button) {
    button.textContent = "تمت الإضافة للسلة";
    setTimeout(() => {
      button.textContent = "أضف للسلة";
    }, 1200);
  }
}

// عرض السلة
function renderCart() {
  $("cart-count").textContent = cart.reduce(
    (n, item) => n + Number(item.qty),
    0
  );

  $("cart-items").innerHTML = cart.length
    ? cart.map((item, index) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${escapeHTML(item.name)}</strong>

          <p>اللون: ${escapeHTML(item.selectedColor || "غير محدد")}</p>
          <p>المقاس: ${escapeHTML(item.selectedSize || "غير محدد")}</p>

          <p>${money(item.price)} × ${Number(item.qty)}</p>

          <strong>
            ${money(Number(item.price) * Number(item.qty))}
          </strong>
        </div>

        <div class="cart-item-controls">
          <button type="button"
            data-cart-action="increase"
            data-cart-index="${index}"
            ${isSubmitting ? "disabled" : ""}>+</button>

          <span>${Number(item.qty)}</span>

          <button type="button"
            data-cart-action="decrease"
            data-cart-index="${index}"
            ${isSubmitting ? "disabled" : ""}>−</button>

          <button type="button"
            class="remove-cart-item"
            data-cart-action="remove"
            data-cart-index="${index}"
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

// التحكم في الكميات والحذف
function updateCartItem(index, action) {
  if (isSubmitting) return;

  index = Number(index);
  if (!Number.isInteger(index) || !cart[index]) return;

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

// أحداث المنتجات
$("products").addEventListener("click", e => {
  const button = e.target.closest("[data-add]");
  if (!button) return;

  const card = button.closest("[data-product-card]");
  if (card) addToCart(button.dataset.add, card);
});

// أحداث السلة
$("cart-items").addEventListener("click", e => {
  const button = e.target.closest("[data-cart-action]");
  if (!button) return;

  updateCartItem(
    button.dataset.cartIndex,
    button.dataset.cartAction
  );
});

$("search").addEventListener("input", renderProducts);
$("category").addEventListener("change", renderProducts);

// فتح وإغلاق السلة
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

// إتمام الطلب
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
    SUPABASE_ANON_KEY.length > 20;
}

// تسجيل الطلب في Supabase
$("checkout-form").addEventListener("submit", async e => {
  e.preventDefault();

  const checkoutForm = e.currentTarget;

  if (isSubmitting) return;

  if (!cart.length) {
    $("checkout-error").textContent = "السلة فارغة.";
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

  const items = cart.map(item => ({
    product_id: String(item.id),
    name: String(item.name),
    price: Number(item.price),
    quantity: Number(item.qty),
    size: item.selectedSize || null,
    color: item.selectedColor || null
  }));

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order = {
    customer_name: customer.name,
    phone: customer.phone,
    governorate: customer.governorate,
    address: customer.address,
    notes: customer.notes,
    items,
    total,
    status: "pending"
  };

  const orderLines = items.map(item =>
    `- ${item.name} | اللون: ${item.color || "غير محدد"} | المقاس: ${item.size || "غير محدد"} | العدد: ${item.quantity} | السعر: ${money(item.price * item.quantity)}`
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

  const button = $("submit-order");

  isSubmitting = true;
  button.disabled = true;
  button.textContent = "جاري تسجيل الطلب...";
  $("checkout-error").textContent = "";
  renderCart();

  let orderRegistered = false;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify(order)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    orderRegistered = true;

    cart = [];
    save();
    renderCart();

    checkoutForm.reset();
    closeCheckout();
    closeCart();

    window.location.href =
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

  } catch (error) {
    console.error("AZAZY order submission:", error);

    $("checkout-error").textContent = orderRegistered
      ? "تم تسجيل طلبك بنجاح. لا تعيد إرسال الطلب."
      : "تعذر تأكيد تسجيل الطلب: " +
        (error.message || "خطأ غير معروف") +
        ". احتفظ بالسلة وتأكد من الطلب في Supabase قبل إعادة المحاولة.";

  } finally {
    isSubmitting = false;
    button.disabled = false;
    button.textContent = "تأكيد الطلب وإرساله";
    renderCart();
  }
});

// القائمة الرئيسية
$("menu-toggle").addEventListener("click", () =>
  $("main-nav").classList.toggle("open")
);

$("main-nav").querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () =>
    $("main-nav").classList.remove("open")
  )
);

$("year").textContent = new Date().getFullYear();

// تشغيل المتجر
renderCart();
loadProducts();

window.AZAZYStore = {
  list() {
    return products;
  },

  refreshProducts() {
    return loadProducts();
  }
};
