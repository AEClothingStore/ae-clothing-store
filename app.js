
// AZAZY CLOTHES — checkout + order registration
const WHATSAPP = "201142336180";

// ضع بيانات مشروع Supabase هنا بعد إنشائه (التعليمات في AZAZY-SETUP.txt).
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const products = JSON.parse(localStorage.getItem("azazy_products") || "[]");
let cart = JSON.parse(localStorage.getItem("azazy_cart") || "[]");
const $ = (id) => document.getElementById(id);
const money = (n) => `${Number(n).toLocaleString("en-US")} ج.م`;

function save(){
  localStorage.setItem("azazy_products",JSON.stringify(products));
  localStorage.setItem("azazy_cart",JSON.stringify(cart));
}

function renderProducts(){
  const term=( $("search")?.value || "").trim().toLowerCase();
  const cat=$("category")?.value||"all";
  const shown=products.filter(p=>(cat==="all"||p.category===cat)&&String(p.name||"").toLowerCase().includes(term));

  $("products").innerHTML=shown.length?shown.map(p=>`
    <article class="product-card">
      ${p.image?`<img src="${p.image}" alt="${p.name}">`:""}
      <h3>${p.name}</h3><p>${p.description||""}</p>
      <p class="price">${money(p.price)}</p><p>المقاسات: ${(p.sizes||[]).join("، ")}</p>
      <button type="button" data-add="${p.id}">أضف للسلة</button>
    </article>`).join(""):`<div class="empty-state"><span>AZAZY</span><h3>${products.length?"لا توجد نتائج":"قريباً — المجموعة الأولى"}</h3><p>${products.length?"جرّب البحث بكلمات أخرى.":"سيتم عرض المنتجات هنا بعد إضافة صورها وأسمائها وأسعارها المعتمدة."}</p></div>`;
}

function renderCart(){
  $("cart-count").textContent=cart.reduce((n,x)=>n+x.qty,0);
  $("cart-items").innerHTML=cart.length?cart.map(x=>`<p>${x.name} × ${x.qty} — ${money(x.price*x.qty)}</p>`).join(""):"السلة فارغة حالياً.";
  $("cart-total").textContent=cart.length?"الإجمالي: "+money(cart.reduce((n,x)=>n+x.price*x.qty,0)):"";
}

function addToCart(id){
  const p=products.find(x=>String(x.id)===String(id));
  if(!p)return;
  const found=cart.find(x=>String(x.id)===String(id));
  found?found.qty++:cart.push({...p,qty:1});
  save();
  renderCart();
}

$("products").addEventListener("click",e=>{
  const btn=e.target.closest("[data-add]");
  if(btn)addToCart(btn.dataset.add);
});

$("search").addEventListener("input",renderProducts);
$("category").addEventListener("change",renderProducts);

function openCart(){
  $("cart").classList.add("open");
  $("cart-overlay").classList.add("show");
}

function closeCart(){
  $("cart").classList.remove("open");
  $("cart-overlay").classList.remove("show");
}

$("cart-toggle").addEventListener("click",openCart);
$("cart-close").addEventListener("click",closeCart);
$("cart-overlay").addEventListener("click",closeCart);

function openCheckout(){
  if(!cart.length){
    alert("السلة فارغة");
    return;
  }

  $("checkout-total").textContent="إجمالي الطلب: "+money(cart.reduce((n,x)=>n+Number(x.price)*x.qty,0));
  $("checkout-error").textContent="";
  $("checkout-modal").classList.add("open");
  $("checkout-modal").setAttribute("aria-hidden","false");
}

function closeCheckout(){
  $("checkout-modal").classList.remove("open");
  $("checkout-modal").setAttribute("aria-hidden","true");
}

$("checkout").addEventListener("click",openCheckout);
$("checkout-close").addEventListener("click",closeCheckout);

$("checkout-modal").addEventListener("click",e=>{
  if(e.target===$("checkout-modal"))closeCheckout();
});

function supabaseReady(){
  return SUPABASE_URL.startsWith("https://")&&!SUPABASE_URL.includes("YOUR_")&&SUPABASE_ANON_KEY.length>20&&!SUPABASE_ANON_KEY.includes("YOUR_");
}

$("checkout-form").addEventListener("submit",async e=>{
  e.preventDefault();

  if(!cart.length){
    $("checkout-error").textContent="السلة فارغة. أضف منتجاً أولاً.";
    return;
  }

  if(!supabaseReady()){
    $("checkout-error").textContent="قاعدة تسجيل الطلبات لم يتم ربطها بعد. أكمل إعداد Supabase الموجود في ملف AZAZY-SETUP.txt أولاً.";
    return;
  }

  const form=new FormData(e.currentTarget);

  const customer={
    name:String(form.get("customer_name")||"").trim(),
    phone:String(form.get("phone")||"").trim(),
    governorate:String(form.get("governorate")||"").trim(),
    address:String(form.get("address")||"").trim(),
    notes:String(form.get("notes")||"").trim()
  };

  if(!customer.name||!customer.phone||!customer.governorate||!customer.address){
    $("checkout-error").textContent="من فضلك أكمل كل البيانات المطلوبة.";
    return;
  }

  const items=cart.map(x=>({
    product_id:String(x.id),
    name:String(x.name),
    price:Number(x.price),
    quantity:Number(x.qty),
    size:x.selectedSize||null,
    color:x.selectedColor||null
  }));

  const total=items.reduce((n,x)=>n+x.price*x.quantity,0);

  const order={
    customer_name:customer.name,
    phone:customer.phone,
    governorate:customer.governorate,
    address:customer.address,
    notes:customer.notes,
    items,
    total,
    status:"new"
  };

  const btn=$("submit-order");
  btn.disabled=true;
  btn.textContent="جاري تسجيل الطلب...";
  $("checkout-error").textContent="";

  try{
    const response=await fetch(`${SUPABASE_URL}/rest/v1/orders`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "apikey":SUPABASE_ANON_KEY,
        "Authorization":`Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer":"return=minimal"
      },
      body:JSON.stringify(order)
    });

    if(!response.ok){
      const detail=await response.text();
      throw new Error(detail||"تعذر تسجيل الطلب");
    }

    const orderLines=items.map(x=>`- ${x.name} | العدد: ${x.quantity} | السعر: ${money(x.price*x.quantity)}`).join("\n");

    const message=`طلب جديد من AZAZY CLOTHES
الاسم: ${customer.name}
الموبايل: ${customer.phone}
المحافظة: ${customer.governorate}
العنوان: ${customer.address}
ملاحظات: ${customer.notes||"لا يوجد"}

المنتجات:
${orderLines}

الإجمالي: ${money(total)}
رقم الطلب: يُراجع من لوحة Supabase`;

    cart=[];
    save();
    renderCart();
    e.currentTarget.reset();
    closeCheckout();
    closeCart();

    window.location.href=`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

  }catch(err){
    console.error(err);
    $("checkout-error").textContent="لم يتم تسجيل الطلب، لذلك لم نفتح واتساب. راجع إعدادات قاعدة البيانات وحاول مرة أخرى.";
  }finally{
    btn.disabled=false;
    btn.textContent="تأكيد الطلب وإرساله";
  }
});

$("menu-toggle").addEventListener("click",()=>$("main-nav").classList.toggle("open"));

$("main-nav").querySelectorAll("a").forEach(a=>
  a.addEventListener("click",()=>$("main-nav").classList.remove("open"))
);

$("year").textContent=new Date().getFullYear();

renderProducts();
renderCart();

window.AZAZYStore={
  addProduct(p){
    if(!p||!p.name||!Number.isFinite(Number(p.price)))throw new Error("أدخل اسم المنتج وسعره الصحيح");
    products.push({id:String(Date.now()),category:"tshirt",sizes:[],...p,price:Number(p.price)});
    save();
    renderProducts();
  },

  removeProduct(id){
    const i=products.findIndex(x=>String(x.id)===String(id));
    if(i>=0)products.splice(i,1);
    save();
    renderProducts();
  },

  list(){
    return products;
  }
};
