// --- Datos Iniciales y Configuración ---
const defaultProducts = [
    { id: 1, name: "Laptop Gamer NESS", price: 3500.00, category: "tecnologia", img: "https://placehold.co/300x200/333/fff?text=Laptop", desc: "Potencia gráfica para diseño e ingeniería." },
    { id: 2, name: "Escritorio Ergonómico", price: 450.00, category: "hogar", img: "https://placehold.co/300x200/ddd/333?text=Escritorio", desc: "Comodidad para largas jornadas de trabajo." },
    { id: 3, name: "Kit Sensores Arduino", price: 120.00, category: "industrial", img: "https://placehold.co/300x200/orange/fff?text=Sensores", desc: "Ideal para proyectos de automatización." },
    { id: 4, name: "Monitor 27' 4K", price: 1100.00, category: "tecnologia", img: "https://placehold.co/300x200/blue/fff?text=Monitor", desc: "Resolución ultra HD para máxima claridad." },
    { id: 5, name: "Silla Industrial", price: 280.00, category: "industrial", img: "https://placehold.co/300x200/555/fff?text=Silla", desc: "Resistente y duradera para talleres." }
];

// --- Clase Principal de la Aplicación ---
class NessApp {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('products')) || defaultProducts;
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null; // null, 'user', 'admin'
        
        this.init();
    }

    init() {
        this.renderProducts();
        this.updateCartUI();
        this.checkAuthStatus();
        
        // Si no hay productos en localStorage, guardamos los default
        if (!localStorage.getItem('products')) {
            this.saveData();
        }
    }

    saveData() {
        localStorage.setItem('products', JSON.stringify(this.products));
        localStorage.setItem('cart', JSON.stringify(this.cart));
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    // --- Navegación ---
    navigate(viewId) {
        // Ocultar todas las vistas
        document.querySelectorAll('.view, .active-view').forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active-view');
        });
        
        // Mostrar vista deseada
        const target = document.getElementById(`view-${viewId}`);
        if(target) {
            target.style.display = 'block';
            target.classList.add('active-view');
        }

        // Lógica específica al entrar a una vista
        if (viewId === 'admin') this.renderAdminPanel();
        if (viewId === 'checkout') this.renderCheckout();
        if (viewId === 'home') this.renderProducts();
    }

    // --- Productos y Catálogo ---
    renderProducts() {
        const container = document.getElementById('product-grid');
        container.innerHTML = '';

        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const catFilter = document.getElementById('category-filter').value;
        const priceFilter = document.getElementById('price-filter').value;

        let filtered = this.products.filter(p => {
            return p.name.toLowerCase().includes(searchTerm) && 
                   (catFilter === 'all' || p.category === catFilter);
        });

        if (priceFilter === 'asc') filtered.sort((a,b) => a.price - b.price);
        if (priceFilter === 'desc') filtered.sort((a,b) => b.price - a.price);

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${p.img}" alt="${p.name}">
                <div class="card-body">
                    <h3 class="card-title">${p.name}</h3>
                    <div class="card-price">S/ ${p.price.toFixed(2)}</div>
                    <p class="card-desc">${p.desc}</p>
                    <button class="btn-add" onclick="app.addToCart(${p.id})">Agregar al Carrito</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    filterProducts() {
        this.renderProducts();
    }

    // --- Carrito de Compras ---
    addToCart(id) {
        const existing = this.cart.find(item => item.id === id);
        if (existing) {
            existing.qty++;
        } else {
            const product = this.products.find(p => p.id === id);
            this.cart.push({ ...product, qty: 1 });
        }
        this.saveData();
        this.updateCartUI();
        alert("Producto agregado");
    }

    updateCartUI() {
        const countSpan = document.getElementById('cart-count');
        const totalItems = this.cart.reduce((sum, item) => sum + item.qty, 0);
        countSpan.textContent = totalItems;

        const container = document.getElementById('cart-items-container');
        if (container) {
            container.innerHTML = '';
            let total = 0;
            
            if (this.cart.length === 0) {
                container.innerHTML = '<p style="text-align:center; padding:20px;">El carrito está vacío.</p>';
            }

            this.cart.forEach((item, index) => {
                const subtotal = item.price * item.qty;
                total += subtotal;
                const row = document.createElement('div');
                row.className = 'cart-item';
                row.innerHTML = `
                    <div>
                        <strong>${item.name}</strong><br>
                        <small>S/ ${item.price} x ${item.qty}</small>
                    </div>
                    <div class="qty-controls">
                        <button onclick="app.changeQty(${index}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="app.changeQty(${index}, 1)">+</button>
                        <button class="btn-danger" style="margin-left:10px; width:auto;" onclick="app.removeFromCart(${index})">🗑</button>
                    </div>
                    <div><strong>S/ ${subtotal.toFixed(2)}</strong></div>
                `;
                container.appendChild(row);
            });

            document.getElementById('cart-total').textContent = total.toFixed(2);
        }
    }

    changeQty(index, delta) {
        this.cart[index].qty += delta;
        if (this.cart[index].qty <= 0) this.cart.splice(index, 1);
        this.saveData();
        this.updateCartUI();
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.saveData();
        this.updateCartUI();
    }

    clearCart() {
        this.cart = [];
        this.saveData();
        this.updateCartUI();
    }

    // --- Checkout y Pagos ---
    renderCheckout() {
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        document.getElementById('pay-amount').textContent = total.toFixed(2);
        document.getElementById('checkout-summary').innerHTML = `<p>Estás a punto de pagar por ${this.cart.reduce((s,i)=>s+i.qty,0)} productos.</p>`;
    }

    processPayment(e) {
        e.preventDefault();
        if (this.cart.length === 0) return alert("El carrito está vacío.");
        
        // Simulación de proceso
        setTimeout(() => {
            alert("¡Pago Exitoso! Gracias por su compra en NESS IND.");
            this.clearCart();
            this.navigate('home');
        }, 1500);
    }

    // --- Autenticación (Simulada) ---
    toggleAuth(type) {
        const loginForm = document.getElementById('login-form');
        const regForm = document.getElementById('register-form');
        const btns = document.querySelectorAll('.tabs button');
        
        if (type === 'login') {
            loginForm.style.display = 'block';
            regForm.style.display = 'none';
            btns[0].classList.add('active');
            btns[1].classList.remove('active');
        } else {
            loginForm.style.display = 'none';
            regForm.style.display = 'block';
            btns[0].classList.remove('active');
            btns[1].classList.add('active');
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        const errorMsg = document.getElementById('login-error');

        if (email === 'admin@ness.pe' && pass === '123456') {
            this.currentUser = { name: 'Administrador', email: email, role: 'admin' };
            this.finishAuth();
        } else if (email.includes('@') && pass.length > 5) {
            // Login genérico exitoso para cualquier otro correo válido
            this.currentUser = { name: 'Cliente', email: email, role: 'user' };
            this.finishAuth();
        } else {
            errorMsg.textContent = "Credenciales inválidas (Prueba admin@ness.pe / 123456)";
        }
    }

    handleRegister(e) {
        e.preventDefault();
        // Registro simulado simple
        alert("Cuenta creada con éxito. Por favor inicia sesión.");
        this.toggleAuth('login');
    }

    finishAuth() {
        this.saveData();
        this.checkAuthStatus();
        this.navigate('home');
        document.getElementById('login-form').reset();
    }

    logout() {
        this.currentUser = null;
        this.saveData();
        this.checkAuthStatus();
        this.navigate('home');
    }

    checkAuthStatus() {
        const navLogin = document.getElementById('nav-login');
        const navAdmin = document.getElementById('nav-admin');
        const navLogout = document.getElementById('nav-logout');

        if (this.currentUser) {
            navLogin.style.display = 'none';
            navLogout.style.display = 'block';
            if (this.currentUser.role === 'admin') {
                navAdmin.style.display = 'block';
            } else {
                navAdmin.style.display = 'none';
            }
        } else {
            navLogin.style.display = 'block';
            navLogout.style.display = 'none';
            navAdmin.style.display = 'none';
        }
    }

    // --- Panel de Admin ---
    renderAdminPanel() {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            alert("Acceso denegado");
            this.navigate('home');
            return;
        }

        document.getElementById('adm-count').textContent = this.products.length;
        const tbody = document.querySelector('#admin-table tbody');
        tbody.innerHTML = '';

        this.products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.name}</td>
                <td>S/ ${p.price.toFixed(2)}</td>
                <td>
                    <button class="btn-danger" style="padding: 5px 10px;" onclick="app.deleteProduct(${p.id})">Borrar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    saveProduct(e) {
        e.preventDefault();
        const name = document.getElementById('prod-name').value;
        const price = parseFloat(document.getElementById('prod-price').value);
        const cat = document.getElementById('prod-cat').value;
        const desc = document.getElementById('prod-desc').value;
        const img = document.getElementById('prod-img').value || "https://placehold.co/300x200?text=Nuevo";

        const newProduct = {
            id: Date.now(), // ID único basado en tiempo
            name, price, category: cat, desc, img
        };

        this.products.push(newProduct);
        this.saveData();
        this.renderAdminPanel();
        this.resetForm();
        alert("Producto guardado");
    }

    deleteProduct(id) {
        if(confirm("¿Seguro que deseas eliminar este producto?")) {
            this.products = this.products.filter(p => p.id !== id);
            this.saveData();
            this.renderAdminPanel();
        }
    }

    resetForm() {
        document.querySelector('.admin-form form').reset();
    }

    // --- Chatbot ---
    toggleChat() {
        const win = document.getElementById('chat-window');
        win.classList.toggle('hidden');
    }

    handleChatInput(e) {
        if (e.key === 'Enter') this.sendChat();
    }

    sendChat() {
        const input = document.getElementById('chat-input-text');
        const text = input.value.trim().toLowerCase();
        if (!text) return;

        // Añadir mensaje usuario
        this.addMsg(input.value, 'user');
        input.value = '';

        // Lógica simple de respuesta
        setTimeout(() => {
            let reply = "No estoy seguro de entender. Intenta preguntar por 'barato', 'mejor' o 'presupuesto'.";

            if (text.includes('hola') || text.includes('buenos')) {
                reply = "¡Hola! Bienvenido a NESS IND. ¿Buscas algo en especial?";
            } else if (text.includes('barato') || text.includes('economico')) {
                const cheapest = [...this.products].sort((a,b) => a.price - b.price)[0];
                reply = `El producto más económico es: ${cheapest.name} a S/ ${cheapest.price}.`;
            } else if (text.includes('caro') || text.includes('mejor')) {
                const expensive = [...this.products].sort((a,b) => b.price - a.price)[0];
                reply = `Nuestro producto premium actual es: ${expensive.name} a S/ ${expensive.price}.`;
            } else if (text.includes('presupuesto')) {
                reply = "Tenemos productos desde S/ 120 hasta S/ 3500. Puedes usar los filtros en la página principal.";
            }

            this.addMsg(reply, 'bot');
        }, 500);
    }

    addMsg(text, sender) {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = `msg ${sender}`;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
}

// Inicializar Aplicación
const app = new NessApp();