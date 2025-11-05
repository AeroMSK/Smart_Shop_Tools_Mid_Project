// Global state
var products = []
var cart = []
var currentBalance = localStorage.getItem("userBalance") ? Number.parseInt(localStorage.getItem("userBalance")) : 1000
var currentBannerIndex = 0
var currentReviewIndex = 0
var couponApplied = false

var bannerProducts = []

function submitContact(event) {
  event.preventDefault()
  // Handle contact form submission
  var formData = new FormData(document.getElementById("contact-form"))
  var formObject = {}
  formData.forEach((value, key) => {
    formObject[key] = value
  })
  console.log(formObject)
  showAlert("Thank you for contacting us!", "success")
  closeContactModal()
  // Reset the form
  document.getElementById("contact-form").reset()
}

function showAlert(message, type = "success") {
  var alertContainer = document.getElementById("alert-container")
  var bgColor = type === "success" ? "bg-emerald-500" : type === "error" ? "bg-rose-600" : "bg-blue-500"

  var alertDiv = document.createElement("div")
  alertDiv.className =
    bgColor +
    " text-white px-6 py-4 rounded-xl shadow-xl transform transition-all duration-500 ease-in-out opacity-0 translate-y-2"
  alertDiv.textContent = message

  alertContainer.appendChild(alertDiv)

  // Trigger animation
  setTimeout(() => {
    alertDiv.classList.remove("opacity-0", "translate-y-2")
    alertDiv.classList.add("opacity-100", "translate-y-0")
  }, 10)

  setTimeout(() => {
    alertDiv.classList.add("opacity-0", "translate-y-2")
    setTimeout(() => alertDiv.remove(), 500)
  }, 3500)
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  checkLogin()
  initBanner()
  loadProducts()
  updateReviewDisplay(0)
  setupEventListeners()
  loadCartFromStorage()
})

// Check login status
function checkLogin() {
  var isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
  var loginBtn = document.getElementById("login-btn")
  if (isLoggedIn) {
    var userName = localStorage.getItem("userName")
    loginBtn.textContent = "Logout (" + userName + ")"
    loginBtn.onclick = (e) => {
      e.preventDefault()
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userName")
      window.location.href = "login.html"
    }
  }
}

// Banner functions
function initBanner() {
  fetch("https://fakestoreapi.com/products")
    .then((res) => res.json())
    .then((data) => {
      // Get 4 random products
      var shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 4)
      bannerProducts = shuffled
      updateBanner()

      // Auto-slide every 5 seconds
      setInterval(() => {
        currentBannerIndex = (currentBannerIndex + 1) % bannerProducts.length
        updateBanner()
      }, 5000)
    })
}

function updateBanner() {
  if (bannerProducts.length === 0) return

  var product = bannerProducts[currentBannerIndex]
  document.getElementById("banner-product-img").src = product.image
  document.getElementById("banner-product-title").textContent = product.title
  document.getElementById("banner-product-price").textContent = product.price + " BDT"
  document.getElementById("banner-product-rating").textContent = "⭐ " + product.rating.rate
  document.getElementById("banner-indicator").textContent = currentBannerIndex + 1 + " / 4"
}

function loadProducts() {
  fetch("https://fakestoreapi.com/products")
    .then((res) => res.json())
    .then((data) => {
      products = data
      displayProducts(products)
    })
}

function displayProducts(productsToShow) {
  var container = document.getElementById("products-container")
  container.innerHTML = ""

  productsToShow.forEach((product) => {
    var card = document.createElement("div")
    card.className =
      "bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-md hover:shadow-2xl p-6 transition-all duration-300 hover:scale-105 hover:border-violet-500 border border-slate-700/50 group"
    card.innerHTML =
      "<div class='overflow-hidden rounded-xl mb-4'><img src='" +
      product.image +
      "' alt='" +
      product.title +
      "' class='w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300'></div>" +
      "<h3 class='font-bold text-sm line-clamp-2 mb-3 text-slate-100'>" +
      product.title +
      "</h3>" +
      "<p class='bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent font-black text-lg mb-2'>" +
      product.price +
      " BDT</p>" +
      "<p class='text-amber-400 text-sm mb-4 font-semibold'>⭐ " +
      product.rating.rate +
      "</p>" +
      "<button class='w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-2 rounded-lg hover:shadow-lg font-bold add-to-cart-btn transition-all duration-200 active:scale-95 hover:scale-105' data-id='" +
      product.id +
      "'>Add to Cart</button>"
    container.appendChild(card)
  })

  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      addToCart(e)
    })
  })
}

// Add to cart
function addToCart(e) {
  if (localStorage.getItem("isLoggedIn") !== "true") {
    showAlert("Please login first", "error")
    setTimeout(() => {
      window.location.href = "login.html"
    }, 1000)
    return
  }

  var productId = Number.parseInt(e.target.dataset.id)
  var product = products.find((p) => p.id === productId)
  var existing = cart.find((item) => item.id === productId)

  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({ id: product.id, title: product.title, price: product.price, image: product.image, quantity: 1 })
  }

  showAlert("Product Added to Cart", "success")
  saveCart()
  updateCart()
}

// Remove from cart
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId)
  showAlert("Product Removed", "success")
  saveCart()
  updateCart()
}

// Update quantity
function updateQuantity(productId, change) {
  var item = cart.find((i) => i.id === productId)
  if (item) {
    item.quantity += change
    if (item.quantity <= 0) {
      removeFromCart(productId)
    } else {
      saveCart()
      updateCart()
    }
  }
}

function updateCart() {
  var cartItems = document.getElementById("cart-items")
  cartItems.innerHTML = ""
  document.getElementById("cart-count").textContent = cart.length

  if (cart.length === 0) {
    cartItems.innerHTML = "<p class='text-slate-400 text-center font-medium'>Cart is empty</p>"
    updateSummary()
    return
  }

  cart.forEach((item) => {
    var div = document.createElement("div")
    div.className =
      "bg-gradient-to-r from-slate-700/50 to-violet-700/30 p-4 rounded-xl border border-slate-700 hover:shadow-md transition-all duration-300"
    div.innerHTML =
      "<div class='flex justify-between mb-3'><div><p class='font-bold line-clamp-1 text-slate-100'>" +
      item.title +
      "</p><p class='text-slate-400 font-semibold'>" +
      item.price +
      " BDT</p></div>" +
      "<button class='bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg remove-btn transition-all duration-200 hover:scale-110 active:scale-95' data-id='" +
      item.id +
      "'>✕</button></div>" +
      "<div class='flex justify-between items-center border border-slate-600 rounded-lg bg-slate-700/50'><button class='bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 decrease-btn transition-colors' data-id='" +
      item.id +
      "'>−</button>" +
      "<span class='px-4 font-bold text-slate-100'>Qty: " +
      item.quantity +
      "</span>" +
      "<button class='bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 increase-btn transition-colors' data-id='" +
      item.id +
      "'>+</button></div>"
    cartItems.appendChild(div)
  })

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      removeFromCart(Number.parseInt(this.dataset.id))
    })
  })
  document.querySelectorAll(".increase-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      updateQuantity(Number.parseInt(this.dataset.id), 1)
    })
  })
  document.querySelectorAll(".decrease-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      updateQuantity(Number.parseInt(this.dataset.id), -1)
    })
  })

  updateSummary()
}

// Update cart summary
function updateSummary() {
  var subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  var delivery = cart.length > 0 ? 50 : 0
  var discount = couponApplied ? Math.round(subtotal * 0.1) : 0
  var total = subtotal + delivery - discount

  document.getElementById("subtotal").textContent = subtotal.toFixed(2) + " BDT"
  document.getElementById("delivery").textContent = delivery + " BDT"
  document.getElementById("discount").textContent = discount.toFixed(2) + " BDT"
  document.getElementById("total").textContent = total.toFixed(2) + " BDT"
}

// Search products
function searchProducts() {
  var term = document.getElementById("search-input").value.toLowerCase()
  var filtered = products.filter((p) => p.title.toLowerCase().includes(term))
  displayProducts(filtered)
}

// Update review display
function updateReviewDisplay(index) {
  // Hide all reviews
  document.querySelectorAll(".review-item").forEach((item) => {
    item.classList.add("hidden")
  })
  // Show current review
  document.querySelector("[data-index='" + index + "']").classList.remove("hidden")
  // Update indicator
  document.getElementById("review-indicator").textContent = index + 1 + " / 7"
}

function generateOrderId() {
  var randomNum = Math.floor(Math.random() * 90000) + 10000
  return "SM" + randomNum
}

function showSuccessMessage() {
  var orderId = generateOrderId()
  document.getElementById("order-id-text").textContent = "Order ID: #" + orderId
  document.getElementById("success-message-container").classList.remove("hidden")

  // Auto-close after 5 seconds
  setTimeout(() => {
    document.getElementById("success-message-container").classList.add("hidden")
  }, 5000)
}

// Cart sidebar
function toggleCart() {
  if (localStorage.getItem("isLoggedIn") !== "true") {
    showAlert("Please login first", "error")
    setTimeout(() => {
      window.location.href = "login.html"
    }, 1000)
    return
  }
  document.getElementById("cart-sidebar").classList.toggle("translate-x-full")
  document.getElementById("cart-overlay").classList.toggle("hidden")
}

// Apply coupon
function applyCoupon() {
  var code = document.getElementById("coupon-input").value.toUpperCase().trim()
  if (code === "SHALMANMUSA10") {
    couponApplied = true
    showAlert("Coupon Applied Successfully", "success")
    document.getElementById("coupon-input").value = ""
    updateSummary()
  } else {
    showAlert("Invalid Coupon Code!", "error")
  }
}

function checkout() {
  if (cart.length === 0) return

  var location = document.getElementById("delivery-location").value.trim()
  var locationError = document.getElementById("location-error")

  if (!location) {
    locationError.textContent = "Please enter your delivery location!"
    locationError.classList.remove("hidden")
    return
  }
  locationError.classList.add("hidden")

  var total = Number.parseFloat(document.getElementById("total").textContent)
  if (total > currentBalance) {
    showAlert("Insufficient balance", "error")
    return
  }
  currentBalance -= total
  localStorage.setItem("userBalance", currentBalance)
  cart = []
  couponApplied = false
  saveCart()
  updateCart()
  toggleCart()
  showAlert("Purchase Successful! Thank You for Shopping.", "success")

  showSuccessMessage()
}

// Save/load cart
function saveCart() {
  localStorage.setItem("smartshopCart", JSON.stringify(cart))
}

function loadCartFromStorage() {
  var saved = localStorage.getItem("smartshopCart")
  if (saved) {
    cart = JSON.parse(saved)
    updateCart()
  }
}

function openContactModal() {
  var overlay = document.getElementById("contact-overlay")
  var modal = document.getElementById("contact-modal")
  overlay.classList.remove("hidden")
  // Trigger animation
  setTimeout(() => {
    overlay.classList.add("opacity-100")
    modal.classList.remove("scale-95", "opacity-0", "-translate-y-4")
    modal.classList.add("scale-100", "opacity-100", "translate-y-0")
  }, 10)
}

function closeContactModal() {
  var overlay = document.getElementById("contact-overlay")
  var modal = document.getElementById("contact-modal")
  modal.classList.remove("scale-100", "opacity-100", "translate-y-0")
  modal.classList.add("scale-95", "opacity-0", "-translate-y-4")
  overlay.classList.remove("opacity-100")
  setTimeout(() => {
    overlay.classList.add("hidden")
  }, 300)
}

// Event listeners
function setupEventListeners() {
  document.getElementById("prev-banner").addEventListener("click", () => {
    currentBannerIndex = (currentBannerIndex - 1 + bannerProducts.length) % bannerProducts.length
    updateBanner()
  })
  document.getElementById("next-banner").addEventListener("click", () => {
    currentBannerIndex = (currentBannerIndex + 1) % bannerProducts.length
    updateBanner()
  })

  document.getElementById("prev-review").addEventListener("click", () => {
    currentReviewIndex = (currentReviewIndex - 1 + 7) % 7
    updateReviewDisplay(currentReviewIndex)
  })
  document.getElementById("next-review").addEventListener("click", () => {
    currentReviewIndex = (currentReviewIndex + 1) % 7
    updateReviewDisplay(currentReviewIndex)
  })

  document.getElementById("search-input").addEventListener("input", searchProducts)
  document.getElementById("cart-btn").addEventListener("click", toggleCart)
  document.getElementById("close-cart").addEventListener("click", toggleCart)
  document.getElementById("cart-overlay").addEventListener("click", toggleCart)
  document.getElementById("apply-coupon").addEventListener("click", applyCoupon)
  document.getElementById("checkout-btn").addEventListener("click", checkout)
  document.getElementById("contact-form").addEventListener("submit", submitContact)

  document.getElementById("close-success-btn").addEventListener("click", () => {
    document.getElementById("success-message-container").classList.add("hidden")
  })

  document.getElementById("banner-shop-btn").addEventListener("click", () => {
    if (bannerProducts.length === 0) return
    var product = bannerProducts[currentBannerIndex]
    var existing = cart.find((item) => item.id === product.id)

    if (localStorage.getItem("isLoggedIn") !== "true") {
      showAlert("Please login first", "error")
      setTimeout(() => {
        window.location.href = "login.html"
      }, 1000)
      return
    }

    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({ id: product.id, title: product.title, price: product.price, image: product.image, quantity: 1 })
    }

    showAlert("Product Added to Cart", "success")
    saveCart()
    updateCart()
  })

  document.getElementById("contact-btn").addEventListener("click", openContactModal)
  document.getElementById("close-contact").addEventListener("click", closeContactModal)
  document.getElementById("contact-overlay").addEventListener("click", (e) => {
    if (e.target.id === "contact-overlay") {
      closeContactModal()
    }
  })
}
