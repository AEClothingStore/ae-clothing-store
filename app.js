// AE CLOTHING - واجهة متجر أولية. أضف المنتجات من خلال window.AEStore.addProduct(...)
const WHATSAPP = "201142336180";
const products = JSON.parse(localStorage.getItem("ae_products") || "[]");
let cart = JSON.parse(localStorage.getItem("ae_cart") || "[]");
const $ = (id) => document.getElementById(id);

function save(){localStorage.setItem("ae_products",JSON.stringify(products));localStorage.setItem("ae_cart",JSON.stringify(cart));}
function renderProducts(){
  const term=($("search")?.value||"").trim().toLowerCase(), cat=$("category")?.value||"all";
  const shown=products.filter(p=>(cat==="all"||p.category===cat)&&p.name.toLowerCase().includes(term));
  $("products").innerHTML=shown.length?shown.map(p=>`<article class="product"><h3>${p.name}</h3><p>${p.description||""}</p><strong>${p.price} ج.م</strong><p>المقاسات: ${(p.sizes||[]).join("، ")}</p><button class="button" onclick="addToCart('${p.id}')">أضف للسلة</button></article>`).join(""):`<div class="empty"><span>AE</span><h3>${products.length?"لا توجد نتائج":"المجموعة الأولى قريباً"}</h3><p>${products.length?"جرّب البحث بكلمات أخرى.":"ترقبوا إطلاق أول مجموعة من AE CLOTHING."}</p></div>`;
}
function renderCart(){
  $("cart-count").textContent=cart.reduce((n,x)=>n+x.qty,0);
  $("cart-items").innerHTML=cart.length?cart.map(x=>`<p>${x.name} × ${x.qty} — ${x.price*x.qty} ج.م</p>`).join(""):"السلة فارغة حالياً.";
  $("cart-total").textContent=cart.length?"الإجمالي: "+cart.reduce((n,x)=>n+x.price*x.qty,0)+" ج.م":"";
}
function addToCart(id){const p=products.find(x=>x.id===id);if(!p)return;const found=cart.find(x=>x.id===id);found?found.qty++:cart.push({...p,qty:1});save();renderCart();}
$("search").addEventListener("input",renderProducts);$("category").addEventListener("change",renderProducts);
$("cart-toggle").onclick=()=>$("cart").classList.add("open");$("cart-close").onclick=()=>$("cart").classList.remove("open");
$("checkout").onclick=()=>{if(!cart.length){alert("السلة فارغة");return;}const total=cart.reduce((n,x)=>n+x.price*x.qty,0);const lines=cart.map(x=>`${x.name} × ${x.qty} = ${x.price*x.qty} جنيه`).join("\n");const msg=`طلب جديد من AE CLOTHING\n${lines}\nالإجمالي: ${total} جنيه\nمن فضلكم أكدوا تفاصيل الشحن.`;window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,"_blank");};
$("year").textContent=new Date().getFullYear();renderProducts();renderCart();
window.AEStore={
 addProduct(p){if(!p||!p.name||!Number.isFinite(Number(p.price)))throw new Error("أدخل اسم المنتج وسعره الصحيح");products.push({id:String(Date.now()),category:"tshirt",sizes:[],...p,price:Number(p.price)});save();renderProducts();},
 removeProduct(id){const i=products.findIndex(p=>p.id===id);if(i>=0)products.splice(i,1);save();renderProducts();},
 list(){return products}
};
// ملاحظة: هذه نسخة واجهة أولية تحفظ البيانات على نفس المتصفح فقط، وليست لوحة إدارة أو قاعدة بيانات مركزية.
