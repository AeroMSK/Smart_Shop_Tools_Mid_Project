// ========== GLOBAL STATE ==========
let products = []
let cart = []
let currentBalance = localStorage.getItem("userBalance") ? Number.parseInt(localStorage.getItem("userBalance")) : 1000
let currentBannerIndex = 0
let currentReviewIndex = 0
let couponApplied = false

// Banner images (promotional images)
const bannerImages = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=400&fit=crop",
]

// Dummy reviews data
const reviews = [
  { name: "Ahmed Khan", comment: "Great products and fast delivery!", rating: 5, date: "2024-10-20" },
  { name: "Fatima Ali", comment: "Excellent quality and customer service.", rating: 5, date: "2024-10-18" },
  { name: "Hassan Reza", comment: "Good prices and variety of products.", rating: 4, date: "2024-10-15" },
  { name: "Nadia Akter", comment: "Very satisfied with my purchase!", rating: 5, date: "2024-10-12" },
  { name: "Karim Hossain", comment: "Decent experience overall.", rating: 4, date: "2024-10-10" },
]

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", () => {
  initializeBanner()
  loadProducts()
  loadReviews()
  setupEventListeners()
  updateBalanceDisplay()
  loadCartFromStorage()
})

// ========== BANNER FUNCTIONALITY ==========
const initializeBanner = () => {
  const bannerImg = document.getElementById("banner-img")
  bannerImg.src = bannerImages[0]

  // Auto-slide banner every 5 seconds
  setInterval(() => {
    currentBannerIndex = (currentBannerIndex + 1) % bannerImages.length
    updateBanner()
  }, 5000)
}

const updateBanner = () => {
  const bannerImg = document.getElementById("banner-img")
  bannerImg.src = bannerImages[currentBannerIndex]
  document.getElementById("banner-indicator").textContent = `${currentBannerIndex + 1} / ${bannerImages.length}`
}

// ========== PRODUCTS FUNCTIONALITY ==========
const loadProducts = () => {
  // Fetch products from FakeStore API
  fetch("https://fakestoreapi.com/products")
    .then((res) => res.json())
    .then((data) => {
      products = data
      displayProducts(products)
    })
    .catch((error) => console.error("Error loading products:", error))
}

const displayProducts = (productsToDisplay) => {
  const container = document.getElementById("products-container")
  container.innerHTML = "" // Clear existing products

  productsToDisplay.forEach((product) => {
    const productCard = document.createElement("div")
    productCard.classList.add("bg-white", "rounded-xl", "shadow-md", "overflow-hidden", "hover:shadow-lg", "transition")

    productCard.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="font-semibold text-sm line-clamp-2 mb-2">${product.title}</h3>
                <div class="flex justify-between items-center mb-3">
                    <span class="text-lg font-bold text-blue-600">${product.price} BDT</span>
                    <span class="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⭐ ${product.rating.rate}</span>
                </div>
                <button class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold add-to-cart-btn" data-product-id="${product.id}">
                    Add to Cart
                </button>
            </div>
        `

    container.appendChild(productCard)
  })

  // Attach event listeners to all "Add to Cart" buttons
  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => addToCart(e))
  })
}

// ========== CART FUNCTIONALITY ==========
const addToCart = (e) => {
  const productId = Number.parseInt(e.target.dataset.productId)
  const product = products.find((p) => p.id === productId)

  if (!product) return

  // Check if product already in cart
  const existingItem = cart.find((item) => item.id === productId)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    })
  }

  saveCartToStorage()
  updateCartDisplay()
  alert(`${product.title} added to cart!`)
}

const removeFromCart = (productId) => {
  cart = cart.filter((item) => item.id !== productId)
  saveCartToStorage()
  updateCartDisplay()
}

const updateCartDisplay = () => {
  const cartItemsContainer = document.getElementById("cart-items")
  const cartCountDisplay = document.getElementById("cart-count")

  cartCountDisplay.textContent = cart.length
  cartItemsContainer.innerHTML = ""

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center">Your cart is empty</p>'
    updateCartSummary()
    return
  }

  cart.forEach((item) => {
    const cartItem = document.createElement("div")
    cartItem.classList.add("flex", "justify-between", "items-center", "bg-gray-100", "p-3", "rounded")

    cartItem.innerHTML = `
            <div class="flex-1">
                <p class="font-semibold text-sm">${item.title}</p>
                <p class="text-sm text-gray-600">${item.price} BDT × ${item.quantity}</p>
            </div>
            <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition remove-btn" data-product-id="${item.id}">
                Remove
            </button>
        `

    cartItemsContainer.appendChild(cartItem)
  })

  // Attach remove button listeners
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      removeFromCart(Number.parseInt(e.target.dataset.productId))
    })
  })

  updateCartSummary()
}

const updateCartSummary = () => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const delivery = cart.length > 0 ? 50 : 0
  let discount = 0

  if (couponApplied) {
    discount = Math.round(subtotal * 0.1) // 10% discount
  }

  const total = subtotal + delivery - discount

  document.getElementById("subtotal").textContent = `${subtotal.toFixed(2)} BDT`
  document.getElementById("delivery").textContent = `${delivery} BDT`
  document.getElementById("discount").textContent = `${discount.toFixed(2)} BDT`
  document.getElementById("total").textContent = `${total.toFixed(2)} BDT`
}

// ========== COUPON FUNCTIONALITY ==========
const applyCoupon = () => {
  const couponInput = document.getElementById("coupon-input")
  const code = couponInput.value.trim().toUpperCase()

  if (code === "SHALMANMUSA10") {
    couponApplied = true
    alert("Coupon applied! 10% discount activated.")
    couponInput.value = ""
    updateCartSummary()
  } else {
    alert("Invalid coupon code. Try SHALMANMUSA10!")
  }
}

// ========== BALANCE FUNCTIONALITY ==========
const updateBalanceDisplay = () => {
  document.getElementById("balance-display").textContent = currentBalance
}

const addMoney = () => {
  currentBalance += 1000
  localStorage.setItem("userBalance", currentBalance)
  updateBalanceDisplay()
  alert("1000 BDT added to your balance!")
}

const checkout = () => {
  if (cart.length === 0) {
    alert("Your cart is empty!")
    return
  }

  const total = Number.parseFloat(document.getElementById("total").textContent)

  if (total > currentBalance) {
    alert(`Insufficient balance! You need ${total} BDT but have ${currentBalance} BDT.`)
    return
  }

  currentBalance -= total
  localStorage.setItem("userBalance", currentBalance)
  updateBalanceDisplay()

  cart = []
  couponApplied = false
  saveCartToStorage()
  updateCartDisplay()

  alert("Purchase successful! Thank you for shopping with SmartShop.")
  toggleCart()
}

// ========== REVIEWS FUNCTIONALITY ==========
const loadReviews = () => {
  displayReview(0)
}

const displayReview = (index) => {
  const review = reviews[index]
  const reviewContent = document.getElementById("review-content")

  reviewContent.innerHTML = `
        <div>
            <p class="text-2xl font-bold mb-2">"${review.comment}"</p>
            <p class="text-yellow-500 text-lg mb-3">${"⭐".repeat(review.rating)}</p>
            <p class="font-semibold text-lg">${review.name}</p>
            <p class="text-gray-500 text-sm">${review.date}</p>
        </div>
    `

  document.getElementById("review-indicator").textContent = `${index + 1} / ${reviews.length}`
}

// ========== SEARCH & FILTER FUNCTIONALITY ==========
const searchProducts = () => {
  const searchTerm = document.getElementById("search-input").value.toLowerCase()

  const filteredProducts = products.filter((product) => product.title.toLowerCase().includes(searchTerm))

  displayProducts(filteredProducts)
}

// ========== CONTACT FORM FUNCTIONALITY ==========
const submitContactForm = (e) => {
  e.preventDefault()

  const name = document.getElementById("contact-name").value.trim()
  const email = document.getElementById("contact-email").value.trim()
  const message = document.getElementById("contact-message").value.trim()

  if (!name || !email || !message) {
    alert("Please fill in all fields!")
    return
  }

  // Show thank you message
  const messageDisplay = document.getElementById("contact-message-display")
  messageDisplay.textContent = `Thank you, ${name}! We received your message and will get back to you soon.`
  messageDisplay.classList.remove("hidden")

  // Reset form
  document.getElementById("contact-form").reset()

  // Hide message after 5 seconds
  setTimeout(() => {
    messageDisplay.classList.add("hidden")
  }, 5000)
}

// ========== CART SIDEBAR TOGGLE ==========
const toggleCart = () => {
  const sidebar = document.getElementById("cart-sidebar")
  const overlay = document.getElementById("cart-overlay")

  sidebar.classList.toggle("translate-x-full")
  overlay.classList.toggle("hidden")
}

// ========== LOCAL STORAGE FUNCTIONS ==========
const saveCartToStorage = () => {
  localStorage.setItem("smartshopCart", JSON.stringify(cart))
}

const loadCartFromStorage = () => {
  const savedCart = localStorage.getItem("smartshopCart")
  if (savedCart) {
    cart = JSON.parse(savedCart)
    updateCartDisplay()
  }
}

// ========== NAVBAR ACTIVE LINK TRACKING ==========
const updateActiveNavLink = () => {
  const sections = ["home", "products", "reviews", "contact"]
  const navLinks = document.querySelectorAll(".nav-link")

  sections.forEach((section, index) => {
    const element = document.getElementById(section)
    const link = navLinks[index]

    if (element) {
      const rect = element.getBoundingClientRect()
      if (rect.top <= 100 && rect.bottom >= 100) {
        navLinks.forEach((l) => l.classList.remove("active"))
        link.classList.add("active")
      }
    }
  })
}

// ========== EVENT LISTENERS ==========
const setupEventListeners = () => {
  // Banner controls
  document.getElementById("prev-banner").addEventListener("click", () => {
    currentBannerIndex = (currentBannerIndex - 1 + bannerImages.length) % bannerImages.length
    updateBanner()
  })

  document.getElementById("next-banner").addEventListener("click", () => {
    currentBannerIndex = (currentBannerIndex + 1) % bannerImages.length
    updateBanner()
  })

  // Review controls
  document.getElementById("prev-review").addEventListener("click", () => {
    currentReviewIndex = (currentReviewIndex - 1 + reviews.length) % reviews.length
    displayReview(currentReviewIndex)
  })

  document.getElementById("next-review").addEventListener("click", () => {
    currentReviewIndex = (currentReviewIndex + 1) % reviews.length
    displayReview(currentReviewIndex)
  })

  // Search functionality
  document.getElementById("search-input").addEventListener("input", searchProducts)

  // Cart functionality
  document.getElementById("cart-toggle").addEventListener("click", toggleCart)
  document.getElementById("close-cart").addEventListener("click", toggleCart)
  document.getElementById("cart-overlay").addEventListener("click", toggleCart)

  // Coupon and checkout
  document.getElementById("apply-coupon").addEventListener("click", applyCoupon)
  document.getElementById("checkout-btn").addEventListener("click", checkout)

  // Balance
  document.getElementById("add-money-btn").addEventListener("click", addMoney)

  // Contact form
  document.getElementById("contact-form").addEventListener("submit", submitContactForm)

  // Mobile menu toggle
  document.getElementById("mobile-menu-btn").addEventListener("click", () => {
    const mobileMenu = document.getElementById("mobile-menu")
    mobileMenu.classList.toggle("hidden")
  })

  // Back to top
  document.getElementById("back-to-top").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  })

  // Update active nav link on scroll
  window.addEventListener("scroll", updateActiveNavLink)
}
