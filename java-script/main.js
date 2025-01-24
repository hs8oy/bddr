ScrollReveal().reveal(".container", {
  duration: 2000, // مدة الحركة
  origin: "bottom", // اتجاه الحركة
  distance: "80px", // المسافة
  delay: 200, // التأخير
});

ScrollReveal().reveal(".products", {
  duration: 4000, // مدة الحركة
  origin: "bottom", // اتجاه الحركة
  distance: "80px", // المسافة
  delay: 400, // التأخير
});

const cart = [];
const deliveryFee = 5000;

const governorates = [
  "بغداد",
  "البصرة",
  "نينوى",
  "أربيل",
  "النجف",
  "كربلاء",
  "كركوك",
  "الأنبار",
  "ذي قار",
  "ديالى",
  "المثنى",
  "القادسية",
  "ميسان",
  "واسط",
  "صلاح الدين",
  "دهوك",
  "السليمانية",
  "بابل",
];

// Populate governorates
const governorateSelect = document.getElementById("governorate");
governorateSelect.innerHTML = `
            <option value="">اختر المحافظة</option>
            ${governorates
              .map((gov) => `<option value="${gov}">${gov}</option>`)
              .join("")}
        `;

function renderFilteredProducts(filteredProducts) {
  const productsContainer = document.getElementById("products");
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML =
      '<div class="loading">لا توجد نتائج للبحث</div>';
    return;
  }

  productsContainer.innerHTML = filteredProducts
    .map(
      (product) => `
                <div class="product-card">
                    <div class="product-image" onclick="showModal('${
                      product.img
                    }', '${product.name}', '${product.description}')">
                        <img src="${product.img}" alt="${product.name}" 
                             onerror="this.parentElement.innerHTML='<div class=error-image>الصورة غير متوفرة</div>'">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <div class="product-description">
                            <i class="fas fa-info-circle description-icon"></i>
                            ${product.description}
                        </div>
                        <div class="product-actions">
                            <select class="size-select" onchange="updatePrice(this, ${
                              product.id
                            })">
                                ${Object.entries(product.sizes)
                                  .map(
                                    ([size, price]) =>
                                      `<option value="${size}">${size} - ${formatNumber(
                                        price
                                      )}دينار </option>`
                                  )
                                  .join("")}
                            </select>
                            <button onclick="addToCart(${
                              product.id
                            })">إضافة إلى السلة</button>
                        </div>
                    </div>
                </div>
            `
    )
    .join("");

  document.getElementById("products-count").textContent =
    filteredProducts.length;
}

// Update the original renderProducts function to use the same card structure
function renderProducts() {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = showLoadingSkeleton();

  setTimeout(() => {
    renderFilteredProducts(products);
  }, 500);
}

// Add number formatting function
function formatNumber(number) {
  if (typeof number !== "number") return "0";
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  const sizeSelect = document.querySelector(
    `select[onchange="updatePrice(this, ${productId})"]`
  );
  const selectedSize = sizeSelect.value;
  const price = product.sizes[selectedSize];

  // البحث عن نفس العطر في السلة
  const existingProductIndex = cart.findIndex(
    (item) => item.productId === productId
  );

  if (existingProductIndex !== -1) {
    // إذا كان العطر موجود، نتحقق من الحجم
    const existingProduct = cart[existingProductIndex];
    const existingSizeIndex = existingProduct.variants
      ? existingProduct.variants.findIndex((v) => v.size === selectedSize)
      : -1;

    if (existingSizeIndex !== -1) {
      // إذا كان الحجم موجود، نزيد الكمية
      existingProduct.variants[existingSizeIndex].quantity += 1;
    } else {
      // إذا كان الحجم جديد، نضيفه للمنتج
      if (!existingProduct.variants) {
        existingProduct.variants = [
          {
            size: existingProduct.size,
            price: existingProduct.price,
            quantity: 1,
          },
        ];
        delete existingProduct.size;
        delete existingProduct.price;
      }
      existingProduct.variants.push({
        size: selectedSize,
        price: price,
        quantity: 1,
      });
    }
  } else {
    // إذا كان العطر جديد، نضيفه للسلة
    cart.push({
      productId,
      name: product.name,
      variants: [
        {
          size: selectedSize,
          price: price,
          quantity: 1,
        },
      ],
    });
  }

  saveCart();
  updateCart();
  // عرض زر السلة عند إضافة أول منتج
  const floatingBtn = document.getElementById("floating-cart-btn");
  floatingBtn.style.display = "flex";
  updateFloatingCartButton();
  showCartAddedAnimation();
  showNotification("تمت إضافة المنتج إلى السلة");
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// تعديل وظيفة loadCart
function loadCart() {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    const parsedCart = JSON.parse(savedCart);
    if (parsedCart && parsedCart.length > 0) {
      cart.push(...parsedCart);
      updateCart();
    } else {
      // إخفاء السلة وزر السلة إذا كانت فارغة
      hideCartElements();
    }
  } else {
    // إخفاء السلة وزر السلة إذا لم يكن هناك سلة محفوظة
    hideCartElements();
  }
}

// إضافة وظيفة جديدة لإخفاء عناصر السلة
function hideCartElements() {
  const cartElement = document.getElementById("cart");
  const floatingBtn = document.getElementById("floating-cart-btn");

  cartElement.style.display = "none";
  floatingBtn.style.display = "none";
}

// تحديث وظيفة updateCart
function updateCart() {
  const cartElement = document.getElementById("cart");
  const cartItems = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");
  const floatingBtn = document.getElementById("floating-cart-btn");

  if (cart.length === 0) {
    hideCartElements();
    return;
  }

  floatingBtn.style.display = "block";
  floatingBtn.innerHTML = `
                  المشتريات
                <span class="badge">${cart.reduce(
                  (total, item) =>
                    total +
                    (item.variants
                      ? item.variants.reduce(
                          (sum, variant) => sum + variant.quantity,
                          0
                        )
                      : 1),
                  0
                )}</span>
            `;

  // Calculate total (fixed NaN issue)
  const total = cart.reduce((sum, item) => {
    if (item.variants) {
      return (
        sum +
        item.variants.reduce(
          (variantSum, variant) =>
            variantSum + variant.price * variant.quantity,
          0
        )
      );
    }
    return sum + item.price * (item.quantity || 1);
  }, 0);
  const grandTotal = total + deliveryFee;

  cartItems.innerHTML = cart
    .map(
      (item) => `
                    <div class="cart-item">
                        <div class="cart-item-details">
                            <span class="cart-item-name">${item.name}</span>
                            ${
                              item.variants
                                ? item.variants
                                    .map(
                                      (variant) => `
                        <div class="cart-item-variant">
                            <span class="cart-item-size">${variant.size}</span>
                             <span class="cart-item-price">  ${formatNumber(
                               variant.price
                             )} × ${variant.quantity}</span>
                        </div>
                    `
                                    )
                                    .join("")
                                : `<span class="cart-item-size">${
                                    item.size
                                  }</span>
                     <span class="cart-item-price">${formatNumber(
                       item.price
                     )} دينار </span>`
                            }
                        </div>
                        <button onclick="removeFromCart(${cart.indexOf(
                          item
                        )})">حذف</button>
                    </div>
                `
    )
    .join("");

  cartSummary.innerHTML = `
                <div class="cart-summary">
                    <div>المجموع: ${formatNumber(total)} دينار </div>
                    <div>رسوم التوصيل: ${formatNumber(deliveryFee)} دينار </div>
                    <div class="cart-total">المجموع الكلي: ${formatNumber(
                      grandTotal
                    )} دينار </div>
                </div>
            `;
  updateFloatingCartButton();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCart();
  showNotification("تم حذف المنتج من السلة");
}

// تحديث وظيفة showCart
function showCart() {
  const cart = document.getElementById("cart");
  cart.style.display = "block";

  // تمرير بسلاسة إلى موقع السلة
  cart.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Update checkout form submission
document
  .getElementById("checkout-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("loading").style.display = "flex";
    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري المعالجة...";

    const formData = new FormData(e.target);
    const customerInfo = {
      name: formData.get("name"),
      governorate: formData.get("governorate"),
      area: formData.get("area"),
      landmark: formData.get("landmark"),
      phone: formData.get("phone"),
    };

    // حساب المجموع بشكل صحيح
    const total = cart.reduce((sum, item) => {
      if (item.variants) {
        return (
          sum +
          item.variants.reduce(
            (variantSum, variant) =>
              variantSum + variant.price * variant.quantity,
            0
          )
        );
      }
      return sum + item.price * (item.quantity || 1);
    }, 0);

    const grandTotal = total + deliveryFee;

    const message = formatWhatsAppMessage(
      cart,
      total,
      grandTotal,
      customerInfo
    );
    window.open(
      `https://wa.me/964${7707458798}?text=${encodeURIComponent(message)}`
    );

    setTimeout(() => {
      document.getElementById("loading").style.display = "none";
      showNotification("تم إرسال الطلب بنجاح!");
      cart.length = 0;
      saveCart();
      updateCart();
      submitBtn.disabled = false;
      submitBtn.textContent = "اتمام الشراء";
    }, 1500);
  });

// Update phone input field
const phoneInput = document.querySelector('input[name="phone"]');
phoneInput.placeholder = "07xxxxxxxxx";
phoneInput.pattern = "07[0-9]{9}";
phoneInput.maxLength = 11;

// Add phone prefix display
const phoneInputContainer = phoneInput.parentElement;
const phonePrefix = document.createElement("div");
phonePrefix.className = "phone-prefix";
phonePrefix.textContent = "رقم الهاتف يبدأ ب 07";
phoneInputContainer.insertBefore(phonePrefix, phoneInput);

function searchProducts(query) {
  const filteredProducts = products.filter(
    (product) =>
      product.name.includes(query) || product.description.includes(query)
  );
  renderFilteredProducts(filteredProducts);
}

function renderFilteredProducts(filteredProducts) {
  const productsContainer = document.getElementById("products");
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML =
      '<div class="loading">لا توجد نتائج للبحث</div>';
    return;
  }
  // Use existing renderProducts logic but with filtered products
  productsContainer.innerHTML = filteredProducts
    .map(
      (product) => `
                <div class="product-card">
                    <img src="${product.img}" alt="${product.name}" 
                         onerror="this.parentElement.innerHTML='<div class=error-image>الصورة غير متوفرة</div>'">
                    <h3>${product.name}</h3>
                    <div class="product-description">${
                      product.description
                    }</div>
                    <select class="size-select" onchange="updatePrice(this, ${
                      product.id
                    })">
                        ${Object.entries(product.sizes)
                          .map(
                            ([size, price]) =>
                              `<option value="${size}">${size} - ${formatNumber(
                                price
                              )}</option>`
                          )
                          .join("")}
                    </select>
                    <button onclick="addToCart(${
                      product.id
                    })">إضافة إلى السلة</button>
                </div>
            `
    )
    .join("");
  document.getElementById("products-count").textContent =
    filteredProducts.length;
}

function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.opacity = 1;
  setTimeout(() => (notification.style.opacity = 0), 3000);
}

function formatWhatsAppMessage(cart, total, grandTotal, customerInfo) {
  const cartTotal = cart.reduce((sum, item) => {
    if (item.variants) {
      return (
        sum +
        item.variants.reduce(
          (variantSum, variant) =>
            variantSum + variant.price * variant.quantity,
          0
        )
      );
    }
    return sum + item.price * (item.quantity || 1);
  }, 0);

  const finalTotal = cartTotal + deliveryFee;

  const itemDetails = cart
    .map((item) => {
      if (item.variants && item.variants.length > 0) {
        const variantsText = item.variants
          .map(
            (variant) =>
              `   • الحجم: ${variant.size}\n   • الكمية: ${
                variant.quantity
              }\n   • السعر: ${formatNumber(variant.price)}  دينار `
          )
          .join("\n\n");
        return `🛍️ ${item.name}\n${variantsText}`;
      } else {
        return `🛍️ ${item.name}\n   • الحجم: ${
          item.size
        }\n   • السعر: ${formatNumber(item.price)}دينار `;
      }
    })
    .join("\n\n");

  return `
  *👤 معلومات العميل:*
• الاسم: ${customerInfo.name}
• رقم الهاتف: ${customerInfo.phone}
• المحافظة: ${customerInfo.governorate}
• المنطقة: ${customerInfo.area}
• نقطة دالة: ${customerInfo.landmark}
══════════════════════
${itemDetails}
══════════════════════
• المجموع: ${formatNumber(cartTotal)}دينار 
• رسوم التوصيل: ${formatNumber(deliveryFee)}دينار 
• المجموع الكلي: *${formatNumber(finalTotal)}دينار* 

`;
}

function applyFilters() {
  const searchQuery = document
    .querySelector('input[type="search"]')
    .value.trim()
    .toLowerCase();
  const activeCategory = document
    .querySelector(".category-btn.active")
    .getAttribute("onclick")
    .match(/'([^']+)'/)[1];

  // إذا كان حقل البحث فارغاً، أعرض المنتجات حسب الفئة المحددة فقط
  if (!searchQuery) {
    const categoryProducts =
      activeCategory === "all"
        ? products
        : products.filter((product) => product.category === activeCategory);
    renderFilteredProducts(categoryProducts);
    return;
  }

  let filteredProducts = products;

  // تطبيق فلتر البحث
  if (searchQuery) {
    filteredProducts = filteredProducts.filter((product) => {
      const name = product.name.toLowerCase();
      const description = product.description.toLowerCase();

      // البحث عن النص الكامل أولاً
      if (name.includes(searchQuery) || description.includes(searchQuery)) {
        return true;
      }

      // تقسيم نص البحث إلى كلمات
      const searchWords = searchQuery
        .split(" ")
        .filter((word) => word.length > 0);

      // البحث عن كل كلمة على حدة
      return searchWords.every(
        (word) => name.includes(word) || description.includes(word)
      );
    });

    // ترتيب النتائج حسب الأهمية
    filteredProducts.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // الأولوية للتطابق التام مع الاسم
      if (aName === searchQuery) return -1;
      if (bName === searchQuery) return 1;

      // ثم التطابق الجزئي في بداية الاسم
      if (aName.startsWith(searchQuery)) return -1;
      if (bName.startsWith(searchQuery)) return 1;

      return 0;
    });
  }

  // تطبيق فلتر الفئة
  if (activeCategory !== "all") {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === activeCategory
    );
  }

  renderFilteredProducts(filteredProducts);
}

// تحديث حقل البحث ليشمل حدث الضغط على Enter
document
  .querySelector('.search-box input[type="search"]')
  .addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
    applyFilters();
  });

// تحديث حقل البحث ليشمل حدث المسح
document
  .querySelector('.search-box input[type="search"]')
  .addEventListener("search", function (event) {
    if (this.value === "") {
      // إعادة عرض جميع المنتجات
      filterByCategory("all");
      document
        .querySelector('.category-btn[onclick*="all"]')
        .classList.add("active");
    }
  });

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Show/hide scroll button
window.onscroll = function () {
  document.querySelector(".scroll-top").style.display =
    window.pageYOffset > 300 ? "flex" : "none";
};

function showLoadingSkeleton() {
  return `
                <div class="product-card">
                    <div class="skeleton" style="height: 150px;"></div>
                    <div class="skeleton" style="height: 24px; margin: 10px 0;"></div>
                    <div class="skeleton" style="height: 60px;"></div>
                    <div class="skeleton" style="height: 36px; margin: 10px 0;"></div>
                    <div class="skeleton" style="height: 40px;"></div>
                </div>
            `.repeat(6);
}

function showModal(imgSrc, title, description) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const modalDetails = document.getElementById("modalDetails");

  modalImg.src = imgSrc;
  modalDetails.innerHTML = `
                <h3>${title}</h3>
                <p>${description}</p>
            `;

  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("imageModal").style.display = "none";
}

function filterByCategory(category) {
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`.category-btn[onclick*="${category}"]`)
    .classList.add("active");

  const filteredProducts =
    category === "all"
      ? products
      : products.filter((product) => product.category === category);

  renderFilteredProducts(filteredProducts);
}

// تحديث شكل زر عرض السلة
function updateFloatingCartButton() {
  const floatingBtn = document.getElementById("floating-cart-btn");
  const itemCount = cart.reduce(
    (total, item) =>
      total +
      (item.variants
        ? item.variants.reduce((sum, variant) => sum + variant.quantity, 0)
        : 1),
    0
  );

  if (itemCount > 0) {
    floatingBtn.innerHTML = `
          <div class="cart-button-content">
              <i class="fas fa-shopping-cart"></i>
              <div class="cart-info">
                  <span class="badge">${itemCount}</span>
                  <span class="total-price">${formatNumber(
                    calculateTotal()
                  )} دينار </span>
              </div>
          </div>
      `;
    floatingBtn.style.display = "flex";
  } else {
    floatingBtn.style.display = "none";
  }
}

// إضافة وظيفة حساب المجموع
function calculateTotal() {
  return cart.reduce((sum, item) => {
    if (item.variants) {
      return (
        sum +
        item.variants.reduce(
          (variantSum, variant) =>
            variantSum + variant.price * variant.quantity,
          0
        )
      );
    }
    return sum + item.price * (item.quantity || 1);
  }, 0);
}

// إضافة تأثير حركي عند إضافة منتج للسلة
function showCartAddedAnimation() {
  const floatingBtn = document.getElementById("floating-cart-btn");
  floatingBtn.classList.add("shake");
  setTimeout(() => floatingBtn.classList.remove("shake"), 500);
}

// Load cart on page load
loadCart();
renderProducts();

/* filepath: /C:/Users/ASUS/Desktop/BDR-2/java-script/main.js */
// إضافة كود عداد الزيارات
document.addEventListener('DOMContentLoaded', function() {
  // جلب عدد الزيارات من localStorage
  let visits = localStorage.getItem('visitCount');
  
  // إذا لم يكن هناك عدد زيارات مسجل، ابدأ من 1
  if (!visits) {
      visits = 1;
  } else {
      // إذا كان هناك عدد زيارات مسجل، قم بزيادته
      visits = parseInt(visits) + 1;
  }
  
  // حفظ العدد الجديد في localStorage
  localStorage.setItem('visitCount', visits);
  
  // عرض العدد في الصفحة
  const visitCounter = document.getElementById('visitCounter');
  visitCounter.textContent = visits.toLocaleString('ar-EG'); // تنسيق الرقم بالعربية
});
