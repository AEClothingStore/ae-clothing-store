
// AZAZY CLOTHES — بيانات المنتجات تُضاف لاحقاً بعد اعتماد الاسم والسعر والمقاسات.
const WHATSAPP = "201142336180";
const products = JSON.parse(localStorage.getItem("azazy_products") || "[]");
let cart = JSON.parse(localStorage.getItem("azazy_cart") || "[]");
const $ = (id) => document.getElementById(id);
const money = (n) => `${Number(n).toLocaleString("en-US")} ج.م`;

function save(){
  localStorage.setItem("azazy_products",JSON.stringify(products));
  localStorage.setItem("azazy_cart",JSON.stringify(cart));
}

function renderProducts(){
  const term=($("search")?.value||"").trim().toLowerCase();
  const cat=$("category")?.value||"all";
  const shown=products.filter(p=>(cat==="all"||p.category===cat)&&String(p.name||"").toLowerCase().includes(term));

  $("products").innerHTML=shown.length?shown.map(p=>`
    <article class="product-card">
      ${p.image?`<img src="${p.image}" alt="${p.name}">`:""}
      <h3>${p.name}</h3>
      <p>${p.description||""}</p>
      <p class="price">${money(p.price)}</p>
      <p>المقاسات: ${(p.sizes||[]).join("، ")}</p>
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

$("checkout").addEventListener("click",()=>{
  if(!cart.length){
    alert("السلة فارغة");
    return;
  }

  const total=cart.reduce((n,x)=>n+x.price*x.qty,0);
  const lines=cart.map(x=>`${x.name} × ${x.qty} = ${money(x.price*x.qty)}`).join("\n");
  const msg=`طلب جديد من AZAZY CLOTHES\n${lines}\nالإجمالي: ${money(total)}\nمن فضلكم أكدوا تفاصيل الطلب والشحن.`;

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
});

$("menu-toggle").addEventListener("click",()=>$("main-nav").classList.toggle("open"));
$("main-nav").querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>$("main-nav").classList.remove("open")));

$("year").textContent=new Date().getFullYear();

renderProducts();
renderCart();

// لإضافة منتج لاحقاً من أدوات المطور.
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
