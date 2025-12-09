import { getProducts, filterProducts, getProductById, addProduct, updateProduct, deleteProduct } from './products.js';

const USERS_KEY = 'nessind_users';
const CART_KEY = 'nessind_cart';
const SESSION_KEY = 'nessind_session';
const CONTACTS_KEY = 'nessind_contacts';

const defaultUsers = [
  { email: 'admin@nessind.com', password: 'admin123', name: 'Administrador', role: 'admin' },
  { email: 'user@test.com', password: 'user123', name: 'Usuario Demo', role: 'user' }
];

function initializeUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function login(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    setCurrentUser(user);
    return { success: true, user };
  }
  return { success: false, message: 'Correo o contraseña incorrectos' };
}

function register(name, email, password) {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return { success: false, message: 'El correo ya está registrado' };
  }
  const newUser = { email, password, name, role: 'user' };
  users.push(newUser);
  saveUsers(users);
  return { success: true, user: newUser };
}

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId) {
  const cart = getCart();
  const product = getProductById(productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart(cart);
  showNotification('Producto agregado al carrito', 'success');
}

function updateCartItemQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveCart(cart);
  }
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  renderCart();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}

function calculateTotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function formatPrice(price) {
  return `S/ ${price.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 2rem;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#0ea5e9'};
    color: white;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function renderProducts() {
  const category = document.getElementById('categoryFilter').value;
  const price = document.getElementById('priceFilter').value;
  const sort = document.getElementById('sortFilter').value;

  const products = filterProducts(category, price, sort);
  const grid = document.getElementById('productsGrid');

  grid.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image" />
      <div class="product-content">
        <span class="product-category">${product.category}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-specs">${product.specs}</div>
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="btn-add-cart" data-id="${product.id}">
            Agregar
          </button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      addToCart(id);
    });
  });
}

function renderCart() {
  const cart = getCart();
  const content = document.getElementById('cartContent');

  if (cart.length === 0) {
    content.innerHTML = '<div class="cart-empty">Tu carrito está vacío</div>';
    document.getElementById('cartTotal').textContent = formatPrice(0);
    return;
  }

  content.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image" />
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="cart-item-quantity">
          <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
          <span class="quantity-value">${item.quantity}</span>
          <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}">Eliminar</button>
    </div>
  `).join('');

  content.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      const action = e.target.dataset.action;
      const item = cart.find(i => i.id === id);
      if (item) {
        const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
        updateCartItemQuantity(id, newQuantity);
        renderCart();
      }
    });
  });

  content.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      removeFromCart(id);
    });
  });

  document.getElementById('cartTotal').textContent = formatPrice(calculateTotal());
}

function renderCheckout() {
  const cart = getCart();
  const summary = document.getElementById('checkoutSummary');

  summary.innerHTML = cart.map(item => `
    <div class="checkout-summary-item">
      <span>${item.name} x${item.quantity}</span>
      <span>${formatPrice(item.price * item.quantity)}</span>
    </div>
  `).join('');

  document.getElementById('checkoutTotal').textContent = formatPrice(calculateTotal());
}

function renderAdminProducts() {
  const products = getProducts();
  const list = document.getElementById('adminProductsList');

  list.innerHTML = products.map(product => `
    <div class="admin-product-item">
      <img src="${product.image}" alt="${product.name}" class="admin-product-image" />
      <div class="admin-product-info">
        <h4>${product.name}</h4>
        <p>Categoría: ${product.category}</p>
        <p>Precio: ${formatPrice(product.price)}</p>
        <p>${product.description}</p>
      </div>
      <div class="admin-product-actions">
        <button class="btn-edit" data-id="${product.id}">Editar</button>
        <button class="btn-delete" data-id="${product.id}">Eliminar</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      editProduct(id);
    });
  });

  list.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      if (confirm('¿Estás seguro de eliminar este producto?')) {
        deleteProduct(id);
        renderAdminProducts();
        showNotification('Producto eliminado', 'success');
      }
    });
  });
}

function editProduct(id) {
  const product = getProductById(id);
  if (!product) return;

  const name = prompt('Nombre:', product.name);
  if (name === null) return;

  const category = prompt('Categoría (smartphones/laptops/accesorios/audio/gaming):', product.category);
  if (category === null) return;

  const price = prompt('Precio (solo número):', product.price);
  if (price === null) return;

  const description = prompt('Descripción:', product.description);
  if (description === null) return;

  const specs = prompt('Especificaciones:', product.specs);
  if (specs === null) return;

  updateProduct(id, {
    name: name || product.name,
    category: category || product.category,
    price: parseFloat(price) || product.price,
    description: description || product.description,
    specs: specs || product.specs
  });

  renderAdminProducts();
  showNotification('Producto actualizado', 'success');
}

function createProduct() {
  const name = prompt('Nombre del producto:');
  if (!name) return;

  const category = prompt('Categoría (smartphones/laptops/accesorios/audio/gaming):');
  if (!category) return;

  const price = prompt('Precio (solo número):');
  if (!price) return;

  const image = prompt('URL de la imagen:', 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=600');
  if (!image) return;

  const description = prompt('Descripción:');
  if (!description) return;

  const specs = prompt('Especificaciones:');
  if (!specs) return;

  addProduct({
    name,
    category,
    price: parseFloat(price),
    image,
    description,
    specs
  });

  renderAdminProducts();
  showNotification('Producto creado', 'success');
}

function handleChatbot(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('barato') || lowerMessage.includes('económico') || lowerMessage.includes('precio bajo')) {
    const products = getProducts();
    const cheapest = products.reduce((min, p) => p.price < min.price ? p : min);
    return `El producto más económico es el ${cheapest.name} a ${formatPrice(cheapest.price)}`;
  }

  if (lowerMessage.includes('laptop') && (lowerMessage.includes('trabajo') || lowerMessage.includes('juego'))) {
    return 'Para trabajo y juegos, te recomiendo la ASUS ROG Strix G15 con RTX 4070, ideal para ambas tareas. Si buscas algo más profesional, la MacBook Pro 14" con M2 Pro es excelente.';
  }

  if (lowerMessage.includes('descuento') || lowerMessage.includes('oferta') || lowerMessage.includes('rebaja')) {
    return 'Actualmente tenemos ofertas especiales en smartphones Xiaomi y laptops HP. ¡Visita nuestra sección de productos para ver todos los precios!';
  }

  if (lowerMessage.includes('envío') || lowerMessage.includes('delivery')) {
    return 'Sí, realizamos envíos a todo el Perú. El envío es gratis para compras mayores a S/ 500 en Lima y S/ 1000 en provincias. El tiempo de entrega es de 1-3 días en Lima y 3-7 días en provincias.';
  }

  if (lowerMessage.includes('pago') || lowerMessage.includes('pagar')) {
    return 'Aceptamos tarjetas de crédito/débito, Yape, Plin y también pago contra entrega. Todas las opciones son seguras y confiables.';
  }

  if (lowerMessage.includes('devol') || lowerMessage.includes('retorn') || lowerMessage.includes('cambio')) {
    return 'Sí, aceptamos devoluciones dentro de los 15 días de recibido el producto. El producto debe estar en su empaque original y sin uso. Los costos de envío de devolución corren por cuenta del cliente.';
  }

  if (lowerMessage.includes('pedido') || lowerMessage.includes('compra') || lowerMessage.includes('orden')) {
    return 'Para hacer un pedido: 1) Explora nuestros productos, 2) Agrega al carrito lo que te guste, 3) Ve al carrito y haz clic en "Finalizar Compra", 4) Completa tus datos y método de pago. ¡Es muy fácil!';
  }

  if (lowerMessage.includes('garantía') || lowerMessage.includes('garantia')) {
    return 'Todos nuestros productos cuentan con garantía del fabricante. Smartphones y laptops tienen 1 año de garantía, accesorios 6 meses. Además, ofrecemos soporte técnico gratuito.';
  }

  if (lowerMessage.includes('smartphone') || lowerMessage.includes('celular') || lowerMessage.includes('teléfono')) {
    return 'Tenemos una gran variedad de smartphones: iPhone 14 Pro, Samsung Galaxy S23 Ultra, Xiaomi 13 Pro, Google Pixel 8 Pro y más. ¿Buscas algo específico en cuanto a precio o características?';
  }

  if (lowerMessage.includes('laptop') || lowerMessage.includes('computadora')) {
    return 'Nuestro catálogo incluye laptops para todo uso: MacBook Pro para profesionales, Dell XPS para creadores, Lenovo Legion para gaming, y HP Pavilion para estudiantes. ¿Qué tipo de laptop necesitas?';
  }

  if (lowerMessage.includes('gaming') || lowerMessage.includes('juego')) {
    return 'Tenemos productos gaming: PlayStation 5, Xbox Series X, Nintendo Switch OLED, teclados Razer, monitores gaming y laptops especializadas. ¿Te interesa alguno en particular?';
  }

  if (lowerMessage.includes('audio') || lowerMessage.includes('audífono') || lowerMessage.includes('parlante')) {
    return 'Contamos con: AirPods Pro 2, Sony WH-1000XM5, Bose QuietComfort 45 y parlantes JBL. Todos con excelente calidad de sonido.';
  }

  if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
    return '¡Hola! Bienvenido a NESS IND. ¿En qué puedo ayudarte? Puedo informarte sobre productos, precios, envíos, pagos y más.';
  }

  if (lowerMessage.includes('gracias')) {
    return '¡De nada! ¿Hay algo más en lo que pueda ayudarte?';
  }

  return 'Interesante pregunta. Puedo ayudarte con información sobre nuestros productos, precios, envíos, métodos de pago, devoluciones y más. ¿Qué te gustaría saber específicamente?';
}

function addChatMessage(message, isBot = false) {
  const messagesContainer = document.getElementById('chatbotMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `chatbot-message ${isBot ? 'bot' : 'user'}`;
  messageDiv.textContent = message;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getContactMessages() {
  return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]');
}

function saveContactMessage(name, email, phone, subject, message) {
  const messages = getContactMessages();
  messages.push({
    id: Date.now(),
    name,
    email,
    phone,
    subject,
    message,
    date: new Date().toLocaleString('es-PE')
  });
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(messages));
}

function navigatePage(pageName) {
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.nav-link');

  pages.forEach(page => {
    page.classList.remove('active');
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
  });

  const targetPage = document.getElementById(`${pageName}-page`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  const activeLink = document.querySelector(`[data-page="${pageName}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  document.getElementById('mainNav').classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeUsers();
  updateCartCount();
  renderProducts();

  const user = getCurrentUser();
  if (user) {
    if (user.role === 'admin') {
      document.getElementById('adminPanel').classList.remove('hidden');
      renderAdminProducts();
    }
    document.getElementById('btnLogin').innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    `;
    document.getElementById('btnLogin').title = user.name;
  }

  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigatePage(page);
    });
  });

  document.getElementById('categoryFilter').addEventListener('change', renderProducts);
  document.getElementById('priceFilter').addEventListener('change', renderProducts);
  document.getElementById('sortFilter').addEventListener('change', renderProducts);

  document.getElementById('btnLogin').addEventListener('click', () => {
    const user = getCurrentUser();
    if (user && user.role === 'admin') {
      document.getElementById('adminPanel').classList.remove('hidden');
      renderAdminProducts();
    } else {
      document.getElementById('authModal').classList.add('active');
    }
  });

  document.getElementById('btnCart').addEventListener('click', () => {
    document.getElementById('cartModal').classList.add('active');
    renderCart();
  });

  document.getElementById('closeAuthModal').addEventListener('click', () => {
    document.getElementById('authModal').classList.remove('active');
  });

  document.getElementById('closeCartModal').addEventListener('click', () => {
    document.getElementById('cartModal').classList.remove('active');
  });

  document.getElementById('closeCheckoutModal').addEventListener('click', () => {
    document.getElementById('checkoutModal').classList.remove('active');
  });

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetTab = e.target.dataset.tab;
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');

      document.getElementById('loginForm').classList.toggle('hidden', targetTab !== 'login');
      document.getElementById('registerForm').classList.toggle('hidden', targetTab !== 'register');
    });
  });

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const result = login(email, password);

    const message = document.getElementById('loginMessage');
    if (result.success) {
      message.className = 'form-message success';
      message.textContent = '¡Inicio de sesión exitoso!';
      setTimeout(() => {
        document.getElementById('authModal').classList.remove('active');
        location.reload();
      }, 1000);
    } else {
      message.className = 'form-message error';
      message.textContent = result.message;
    }
  });

  document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    const message = document.getElementById('registerMessage');

    if (password !== confirmPassword) {
      message.className = 'form-message error';
      message.textContent = 'Las contraseñas no coinciden';
      return;
    }

    const result = register(name, email, password);

    if (result.success) {
      message.className = 'form-message success';
      message.textContent = '¡Registro exitoso! Iniciando sesión...';
      setCurrentUser(result.user);
      setTimeout(() => {
        document.getElementById('authModal').classList.remove('active');
        location.reload();
      }, 1000);
    } else {
      message.className = 'form-message error';
      message.textContent = result.message;
    }
  });

  document.getElementById('btnCheckout').addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) {
      showNotification('Tu carrito está vacío', 'error');
      return;
    }
    document.getElementById('cartModal').classList.remove('active');
    document.getElementById('checkoutModal').classList.add('active');
    renderCheckout();
  });

  document.getElementById('btnPay').addEventListener('click', () => {
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    document.getElementById('checkoutModal').classList.remove('active');
    clearCart();
    showNotification('¡Gracias por tu compra! Tu pedido ha sido procesado exitosamente.', 'success');
    renderCart();
  });

  document.getElementById('btnLogout').addEventListener('click', () => {
    clearSession();
    location.reload();
  });

  document.getElementById('btnAddProduct').addEventListener('click', createProduct);

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const panel = e.target.dataset.panel;
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');

      document.getElementById('adminProducts').classList.toggle('hidden', panel !== 'products');
      document.getElementById('adminStats').classList.toggle('hidden', panel !== 'stats');
    });
  });

  document.getElementById('chatbotToggle').addEventListener('click', () => {
    document.getElementById('chatbot').classList.toggle('hidden');
    document.getElementById('chatbotToggle').style.display =
      document.getElementById('chatbot').classList.contains('hidden') ? 'flex' : 'none';
  });

  document.getElementById('chatbotClose').addEventListener('click', () => {
    document.getElementById('chatbot').classList.add('hidden');
    document.getElementById('chatbotToggle').style.display = 'flex';
  });

  document.getElementById('chatbotSend').addEventListener('click', () => {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    if (message) {
      addChatMessage(message, false);
      input.value = '';

      setTimeout(() => {
        const response = handleChatbot(message);
        addChatMessage(response, true);
      }, 500);
    }
  });

  document.getElementById('chatbotInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('chatbotSend').click();
    }
  });

  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('mainNav').classList.toggle('active');
  });

  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const inputs = form.querySelectorAll('input, textarea, select');
    const name = inputs[0].value;
    const email = inputs[1].value;
    const phone = inputs[2].value;
    const subject = inputs[3].value;
    const message = inputs[4].value;

    saveContactMessage(name, email, phone, subject, message);

    const messageDiv = document.getElementById('contactMessage');
    messageDiv.className = 'form-message success';
    messageDiv.textContent = '¡Gracias por tu mensaje! Nos pondremos en contacto pronto.';
    messageDiv.style.display = 'block';

    form.reset();

    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);

    showNotification('Mensaje enviado correctamente', 'success');
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });
});

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
