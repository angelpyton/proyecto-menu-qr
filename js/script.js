/* ============================================
   RANNAGHOR - RESTAURANT ORDERING SYSTEM
   Complete JavaScript Application (FIXED)
   ============================================ */

const SUPABASE_URL = 'https://gudjaroffkrwmsqvczip.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NbuvsGvR625a6e9dIXAPZw_inbC3j5A';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const kitchenSupabaseClient = window.supabase.createClient(
    'https://iljzsquigtcpxigsrqay.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsanpzcXVpZ3RjcHhpZ3NycWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTA5MTEsImV4cCI6MjA4NDU4NjkxMX0.dNRDvi5o-qTvRF0Pcl3frWP9EWPVEsDq_pQ0Ymp0Dyw'
);

// ==========================================
// 1. CONFIGURATION & DATA
// ==========================================

// Timing Constants (Issue #4: Magic Numbers)
const TIMINGS = {
    MODAL_TRANSITION: 300,      // Modal open/close animation duration
    TOAST_DURATION: 3000,        // How long toasts stay visible
    ANIMATION_DELAY: 100,        // General animation delay
    CART_TRANSITION: 300,        // Cart sidebar transition
    TABLE_SELECT_DELAY: 800,     // Delay before hiding welcome screen
    ORDER_STATUS_PREPARING: 5000,  // Time until order moves to "ready"
    ORDER_STATUS_READY: 15000,     // Time until order is "ready"
    ORDER_STATUS_SERVED: 25000     // Time until order is "served"
};

// Z-Index System (Issue #4: Magic Numbers)
const Z_INDEX = {
    MODAL: 3000,
    TOAST: 5000,
    NAVBAR: 1000,
    FLOATING: 1500,
    CART: 2000,
    OVERLAY: 1999,
    WELCOME: 100
};

const CONFIG = {
    vatRate: 0.05,
    currency: 'Gs. ',
    currencySymbol: 'Gs. ',
    estimatedTime: '15 a 20 min',
    orderStatusDelay: {
        preparing: TIMINGS.ORDER_STATUS_PREPARING,
        ready: TIMINGS.ORDER_STATUS_READY,
        served: TIMINGS.ORDER_STATUS_SERVED
    },
    toastDuration: TIMINGS.TOAST_DURATION,
    animationDelay: TIMINGS.ANIMATION_DELAY
};

// Menu Items Data (Fallback data)
let menuItems = [
    // Biriyani
    { id: 1, name: "Kacchi Biriyani", category: "biriyani", price: 350, image: "assets/images/food/kacchi-biriyani.jpg", desc: "Biryani aromático de cordero con papas", popular: true },
    { id: 2, name: "Chicken Biriyani", category: "biriyani", price: 280, image: "assets/images/food/chicken-biriyani.jpg", desc: "Arroz aromático con tiernos trozos de pollo" },
    { id: 3, name: "Beef Tehari", category: "biriyani", price: 300, image: "assets/images/food/beef-tehari.jpg", desc: "Carne de res especiada con arroz aromático" },
    { id: 4, name: "Morog Polao", category: "biriyani", price: 320, image: "assets/images/food/morog-polao.jpg", desc: "Pollo con arroz pulao aromático" },

    // Curry
    { id: 5, name: "Chicken Rezala", category: "curry", price: 320, image: "assets/images/food/chicken-rezala.jpg", desc: "Curry cremoso de salsa blanca con pollo tierno" },
    { id: 6, name: "Mutton Bhuna", category: "curry", price: 380, image: "assets/images/food/mutton-bhuna.jpg", desc: "Cordero cocinado a fuego lento con especias intensas", popular: true },
    { id: 7, name: "Chingri Malai", category: "curry", price: 450, image: "assets/images/food/chingri-malai.jpg", desc: "Camarones al curry con leche de coco" },
    { id: 8, name: "Ilish Bhapa", category: "curry", price: 500, image: "assets/images/food/ilish-bhapa.jpg", desc: "Pescado hilsa al vapor con pasta de mostaza" },
    { id: 9, name: "Beef Kala Bhuna", category: "curry", price: 360, image: "assets/images/food/beef-kala-bhuna.jpg", desc: "Curry oscuro de res al estilo de Chittagong" },
    { id: 10, name: "Chicken Kosha", category: "curry", price: 280, image: "assets/images/food/chicken-kosha.jpg", desc: "Pollo cocinado a fuego lento al estilo bengalí" },

    // Kebab
    { id: 11, name: "Chicken Tikka", category: "kebab", price: 280, image: "assets/images/food/chicken-tikka.jpg", desc: "Trozos de pollo marinado a la parrilla" },
    { id: 12, name: "Beef Seekh Kebab", category: "kebab", price: 320, image: "assets/images/food/beef-seekh-kebab.jpg", desc: "Carne de res molida y especiada en brocheta" },
    { id: 13, name: "Mutton Boti Kebab", category: "kebab", price: 350, image: "assets/images/food/mutton-boti-kebab.jpg", desc: "Tiernos cubos de cordero a la parrilla" },
    { id: 14, name: "Tangri Kebab", category: "kebab", price: 300, image: "assets/images/food/tangri-kebab.jpg", desc: "Muslos de pollo marinados", popular: true },
    { id: 15, name: "Reshmi Kebab", category: "kebab", price: 300, image: "assets/images/food/reshmi-kebab.jpg", desc: "Kebab de pollo suave y jugoso" },

    // Snacks
    { id: 16, name: "Samosa", category: "snacks", price: 35, image: "assets/images/food/samosa.jpg", desc: "Empanaditas crujientes con relleno especiado (2 piezas)" },
    { id: 17, name: "Singara", category: "snacks", price: 30, image: "assets/images/food/singara.jpg", desc: "Singara de papa al estilo bengalí (2 piezas)" },
    { id: 18, name: "Fuchka", category: "snacks", price: 60, image: "assets/images/food/fuchka.jpg", desc: "Bocaditos crujientes con agua especiada y ácida (6 piezas)", popular: true },
    { id: 19, name: "Chotpoti", category: "snacks", price: 80, image: "assets/images/food/chotpoti.jpg", desc: "Comida callejera picante de garbanzos" },
    { id: 20, name: "Jhalmuri", category: "snacks", price: 50, image: "assets/images/food/jhalmuri.jpg", desc: "Mezcla especiada de arroz inflado" },
    { id: 21, name: "Peyaju", category: "snacks", price: 30, image: "assets/images/food/peyaju.jpg", desc: "Buñuelos crujientes de cebolla (5 piezas)" },
    { id: 22, name: "Beguni", category: "snacks", price: 35, image: "assets/images/food/beguni.jpg", desc: "Buñuelos de berenjena (4 piezas)" },

    // Dessert
    { id: 23, name: "Roshogolla", category: "dessert", price: 40, image: "assets/images/food/roshogolla.jpg", desc: "Bolitas suaves de queso en almíbar (2 piezas)" },
    { id: 24, name: "Mishti Doi", category: "dessert", price: 60, image: "assets/images/food/mishti-doi.jpg", desc: "Yogur fermentado y dulce", popular: true },
    { id: 25, name: "Chomchom", category: "dessert", price: 50, image: "assets/images/food/chomchom.jpg", desc: "Dulce ovalado (2 piezas)" },
    { id: 26, name: "Firni", category: "dessert", price: 70, image: "assets/images/food/firni.jpg", desc: "Arroz con leche y frutos secos" },
    { id: 27, name: "Jilapi", category: "dessert", price: 80, image: "assets/images/food/jilapi.jpg", desc: "Espirales dulces y crujientes" },
    { id: 28, name: "Rasmalai", category: "dessert", price: 90, image: "assets/images/food/rasmalai.jpg", desc: "Tortitas de queso en leche dulce (2 piezas)" },

    // Drinks
    { id: 29, name: "Borhani", category: "drinks", price: 60, image: "assets/images/food/borhani.jpg", desc: "Bebida de yogur con especias", popular: true },
    { id: 30, name: "Lassi", category: "drinks", price: 80, image: "assets/images/food/lassi.jpg", desc: "Batido dulce de yogur" },
    { id: 31, name: "Mango Lassi", category: "drinks", price: 100, image: "assets/images/food/mango-lassi.jpg", desc: "Lassi con sabor a mango" },
    { id: 32, name: "Tea", category: "drinks", price: 30, image: "assets/images/food/tea.jpg", desc: "Té tradicional con leche" },
    { id: 33, name: "Coffee", category: "drinks", price: 70, image: "assets/images/food/coffee.jpg", desc: "Café molido, intenso y aromático" },
    { id: 34, name: "Lemonade", category: "drinks", price: 40, image: "assets/images/food/lemonade.jpg", desc: "Jugo de limón fresco con hojas de menta" },
];

// Special Items Data (Fallback data)
let specialItems = [
    {
        id: 'special1',
        name: "Pollo tandoori entero",
        price: 600,
        originalPrice: 650,
        image: "assets/images/food/whole-tandoori-chicken.jpg",
        desc: "Pollo entero marinado en yogur especiado y asado lentamente en un horno tradicional de barro",
        category: "kebab"
    },
    {
        id: 'special2',
        name: "Pierna de cordero asada",
        price: 1200,
        image: "assets/images/food/mutton-leg-roast.jpg",
        desc: "Una pierna entera de cordero asada lentamente con especias aromáticas y servida con pulao al azafrán",
        category: "meat"
    }
];

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================

const state = {
    currentTable: null,
    cart: [],
    orders: [],
    ratings: {},  // { orderId: { itemId: { stars, feedback } } }
    itemRatingsData: {},  // { itemId: { avg, count, reviews: [{stars, feedback, date}] } }
    selectedCategory: 'all',
    searchQuery: '',
    selectedItem: null,
    selectedItemQty: 1,
    isCartOpen: false,
    specialItemsInitialized: false, // Flag to prevent multiple listeners
    html5QrCode: null, // QR Scanner instance
    ratingOrderId: null // Currently rating order
};
let storageWarningShown = false;

// ==========================================
// 3. DOM ELEMENTS
// ==========================================

const DOM = {
    // Welcome Screen
    welcomeScreen: document.getElementById('welcomeScreen'),
    qrGridContainer: document.getElementById('qrGridContainer'),
    kitchenAdminBtn: document.getElementById('kitchenAdminBtn'),


    // Navigation
    navbar: document.getElementById('navbar'),
    tableBadge: document.getElementById('tableBadge'),
    tableNumberDisplay: document.getElementById('tableNumberDisplay'),


    // Main Content
    mainContent: document.getElementById('mainContent'),

    // Menu
    menuGrid: document.getElementById('menuGrid'),
    categoryTabs: document.querySelectorAll('.category-tab'),
    menuSearch: document.getElementById('menuSearch'),
    clearSearch: document.getElementById('clearSearch'),
    noResults: document.getElementById('noResults'),

    // Cart
    cartBtn: document.getElementById('cartBtn'),
    cartSidebar: document.getElementById('cartSidebar'),
    cartOverlay: document.getElementById('cartOverlay'),
    closeCart: document.getElementById('closeCart'),
    cartItems: document.getElementById('cartItems'),
    emptyCart: document.getElementById('emptyCart'),
    cartSummary: document.getElementById('cartSummary'),
    cartCount: document.getElementById('cartCount'),
    cartTableNumber: document.getElementById('cartTableNumber'),
    subtotal: document.getElementById('subtotal'),
    vat: document.getElementById('vat'),
    total: document.getElementById('total'),
    instructions: document.getElementById('instructions'),
    placeOrderBtn: document.getElementById('placeOrder'),

    // Floating Elements

    floatingTrackOrder: document.getElementById('floatingTrackOrder'),
    floatingTrackBtn: document.getElementById('floatingTrackBtn'),
    floatingOrderCount: document.getElementById('floatingOrderCount'),
    backToTop: document.getElementById('backToTop'),

    // Modals
    successModal: document.getElementById('successModal'),
    orderNumber: document.getElementById('orderNumber'),
    successTableNumber: document.getElementById('successTableNumber'),
    closeSuccessModal: document.getElementById('closeSuccessModal'),

    ordersModal: document.getElementById('ordersModal'),
    ordersList: document.getElementById('ordersList'),
    noOrders: document.getElementById('noOrders'),
    closeOrdersModal: document.getElementById('closeOrdersModal'),
    viewOrdersBtn: document.getElementById('viewOrdersBtn'),
    mobileOrdersBtn: document.getElementById('bottomNavOrdersBtn'), // Updated to new ID

    trackOrderModal: document.getElementById('trackOrderModal'),
    trackOrderList: document.getElementById('trackOrderList'),
    noActiveOrders: document.getElementById('noActiveOrders'),
    closeTrackOrderModal: document.getElementById('closeTrackOrderModal'),

    callWaiterBtn: document.getElementById('callWaiterBtn'),

    itemModal: document.getElementById('itemModal'),
    closeItemModal: document.getElementById('closeItemModal'),
    itemModalIcon: document.getElementById('itemModalIcon'),
    itemModalTitle: document.getElementById('itemModalTitle'),
    itemModalDesc: document.getElementById('itemModalDesc'),
    itemModalPrice: document.getElementById('itemModalPrice'),
    itemQtyMinus: document.getElementById('itemQtyMinus'),
    itemQtyValue: document.getElementById('itemQtyValue'),
    itemQtyPlus: document.getElementById('itemQtyPlus'),
    itemTotalPrice: document.getElementById('itemTotalPrice'),
    addItemToCart: document.getElementById('addItemToCart'),
    itemModalAvgRating: document.getElementById('itemModalAvgRating'),
    itemModalRatingCount: document.getElementById('itemModalRatingCount'),
    itemReviewsList: document.getElementById('itemReviewsList'),
    noReviews: document.getElementById('noReviews'),

    // Order Badges
    activeOrdersBadge: document.getElementById('activeOrdersBadge'),
    mobileOrdersBadge: document.getElementById('bottomNavOrdersBadge'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer'),

    // Rating Modal
    ratingModal: document.getElementById('ratingModal'),
    ratingView: document.getElementById('ratingView'),
    ratingOrderNumber: document.getElementById('ratingOrderNumber'),
    ratingItemsList: document.getElementById('ratingItemsList'),
    closeRatingModal: document.getElementById('closeRatingModal'),
    skipRating: document.getElementById('skipRating'),
    submitRating: document.getElementById('submitRating'),

    // Item Modal Rating & Reviews
    itemModalRating: document.getElementById('itemModalRating'),
    itemModalAvgRating: document.getElementById('itemModalAvgRating'),
    itemModalRatingCount: document.getElementById('itemModalRatingCount'),
    itemReviewsList: document.getElementById('itemReviewsList'),
    noReviews: document.getElementById('noReviews'),
};

// ==========================================
// 4. INITIALIZATION
// ==========================================

async function init() {
    const tableFromURL = getTableFromURL();

    if (tableFromURL) {
        setTable(tableFromURL);
    } else {
        // Redirect to Management Dashboard if no table is selected
        window.location.href = 'management/';
    }

    setupEventListeners();
    initScrollObserver();

    // Fetch dynamic menu items from Supabase
    await fetchMenuItems();

    // Fetch item ratings from Supabase
    await fetchItemRatings();

    // Initialize special items listeners ONCE
    initSpecialItems();

    // Sync active orders with Supabase Realtime
    syncActiveOrders();

    // Initial Lucide icons render
    if (window.lucide) lucide.createIcons();
}

/**
 * Sync active orders from LocalStorage with Supabase
 */
function syncActiveOrders() {
    if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') return;

    state.orders.forEach(order => {
        if (order.status !== 'served') {
            subscribeToOrderUpdates(order.id);
        }
    });
}

/**
 * Fetch menu items from Supabase
 */
async function fetchMenuItems() {
    try {
        const { data, error } = await supabaseClient
            .from('platos')
            .select('*');

        if (error) throw error;

        const categoryMap = {
            bebidas: 'drinks',
            postres: 'dessert',
            antojos: 'snacks',
            minutas: 'snacks',
            entradas: 'snacks',
            'platos-principales': 'curry',
            biryani: 'biriyani'
        };

        menuItems = (data || []).map(plato => ({
            id: plato.id,
            name: String(plato.nombre || ''),
            price: Number(plato.precio) || 0,
            category: categoryMap[plato.categoria] || plato.categoria || 'all',
            categoryLabel: plato.categoria || '',
            image: typeof plato.imagen_url === 'string' ? plato.imagen_url : '',
            desc: '',
            popular: false
        })).filter(item => item.name && Number.isFinite(item.price));
    } catch (error) {
        console.error('No se pudieron cargar los platos desde Supabase:', error);
        menuItems = [];
    }

    renderMenu(state.selectedCategory, state.searchQuery);
}

document.addEventListener('DOMContentLoaded', init);

// ==========================================
// 5. TABLE DETECTION & SELECTION
// ==========================================

function getTableFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('table');
}

function setTable(tableNumber) {
    if (!tableNumber) return;

    state.currentTable = tableNumber;

    const url = new URL(window.location);
    url.searchParams.set('table', tableNumber);
    window.history.pushState({}, '', url);

    updateTableDisplays(tableNumber);
    hideWelcomeScreen();
    showMainContent();
    loadFromStorage();
    renderSpecials();
    renderMenu();
    updateOrderBadges();


}

function updateTableDisplays(tableNumber) {
    const displays = [
        DOM.tableNumberDisplay,
        DOM.heroTableNumber,
        DOM.cartTableNumber,
        DOM.successTableNumber
    ];

    displays.forEach(el => {
        if (el) el.textContent = tableNumber;
    });

    if (DOM.tableBadge) {
        DOM.tableBadge.classList.remove('hidden');
    }
}

function showWelcomeScreen() {
    if (DOM.welcomeScreen) {
        DOM.welcomeScreen.style.display = 'flex';
        document.body.classList.add('welcome-active');
    }
}

function hideWelcomeScreen() {
    if (DOM.welcomeScreen) {
        DOM.welcomeScreen.style.display = 'none';
        document.body.classList.remove('welcome-active');
    }
}

function showMainContent() {
    if (DOM.mainContent) {
        DOM.mainContent.classList.add('visible');
    }
}

// ==========================================
// 6. MENU FUNCTIONS
// ==========================================

function renderMenu(category = 'all', searchQuery = '') {
    if (!DOM.menuGrid) return;

    let filtered = [...menuItems];

    if (category !== 'all') {
        filtered = filtered.filter(item => item.category === category);
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.desc || '').toLowerCase().includes(query) ||
            (item.categoryLabel || item.category || '').toLowerCase().includes(query)
        );
    }

    if (filtered.length === 0) {
        DOM.noResults.classList.remove('hidden');
        DOM.menuGrid.innerHTML = '';
        const title = DOM.noResults.querySelector('.no-results-title');
        const subtitle = DOM.noResults.querySelector('.no-results-subtitle');
        if (menuItems.length === 0) {
            if (title) title.textContent = 'No hay platos disponibles por el momento';
            if (subtitle) subtitle.textContent = '';
        } else {
            if (title) title.textContent = 'No encontramos platillos';
            if (subtitle) subtitle.textContent = 'Prueba con otra búsqueda';
        }
        return;
    } else {
        DOM.noResults.classList.add('hidden');
    }

    DOM.menuGrid.innerHTML = filtered.map((item, index) => createMenuItemHTML(item, index)).join('');

    // Re-initialize icons for new menu items
    if (window.lucide) lucide.createIcons();

    observeScrollElements();
    attachMenuItemListeners();
}

function createMenuItemHTML(item, index) {
    const delay = Math.min(index * 0.05, 0.5);
    const ratingData = state.itemRatingsData[item.id];
    const avgRating = ratingData ? ratingData.avg.toFixed(1) : '0.0';
    const ratingCount = ratingData ? ratingData.count : 0;
    const safeName = escapeHTML(item.name);
    const safeImage = escapeHTML(item.image || '');
    const safeDescription = escapeHTML(item.desc || '');
    const safeId = escapeHTML(item.id);

    const ratingHTML = `
        <div class="food-card-rating">
            <span class="card-rating-star"><i data-lucide="star" class="icon-star-filled"></i></span>
            <span class="card-rating-value">${avgRating}</span>
            <span class="card-rating-count">(${ratingCount})</span>
        </div>
    `;

    return `
        <article class="food-card scroll-reveal" data-id="${safeId}" role="listitem" style="transition-delay: ${delay}s">
            <div class="food-card-image">
                <img src="${safeImage}" alt="${safeName}" loading="lazy" onerror="this.src='https://placehold.co/400x400/1a1a1a/ffffff?text=${encodeURIComponent(item.name)}'">
                <div class="food-card-badges">
            ${item.popular ? '<span class="food-badge popular">Favorito</span>' : ''}
                </div>
                ${ratingHTML}
            </div>
            <div class="food-card-content">
                <div class="food-card-header">
                    <h3 class="food-card-title">${safeName}</h3>
                </div>
                <p class="food-card-description">${safeDescription}</p>
                <div class="food-card-footer">
                    <span class="food-card-price gradient-text">${CONFIG.currency}${item.price}</span>
                    <button class="btn btn-primary btn-add btn-menu-item" data-id="${safeId}" aria-label="Agregar ${safeName} al carrito">
                        Add +
                    </button>
                </div>
            </div>
        </article>
    `;
}

// Attach listeners ONLY to menu grid items (not special items)
function attachMenuItemListeners() {
    // No direct listeners needed - handled by universal event delegation in setupEventListeners()
}

// Render Special Items dynamically
function renderSpecials() {
    const specialsContainer = document.getElementById('specials');
    if (!specialsContainer || specialItems.length === 0) return;

    let slidesHTML = '';
    let dotsHTML = '<div class="slider-pagination">';

    specialItems.forEach((item, index) => {
        const isActive = index === 0 ? 'active' : '';
        const badgeHTML = item.price < (item.originalPrice || item.price)
            ? `<div class="special-badge discount">OFERTA</div>`
            : `<div class="special-badge chef">RECOMENDACIÓN DEL CHEF</div>`;
        const originalPriceHTML = item.originalPrice
            ? `<span class="price-original"><span class="currency">${CONFIG.currencySymbol}</span>${item.originalPrice}</span>`
            : '';

        slidesHTML += `
            <div class="slide ${isActive}">
                <div class="slide-bg" style="background-image: url('${item.image}');"></div>
                <div class="slide-overlay"></div>
                <div class="slide-content">
                    <span class="slide-eyebrow">Especial del día</span>
                    ${badgeHTML}
                    <h3 class="slide-title">${item.name}</h3>
                    <p class="slide-description">${item.desc || item.description || ''}</p>
                    <div class="special-rating" data-id="${item.id}">
                        <span class="card-rating-star"><i data-lucide="star" class="icon-star-filled"></i></span>
                        <span class="card-rating-value">0.0</span>
                        <span class="card-rating-count">(0)</span>
                    </div>
                    <div class="slide-footer">
                        <div class="slide-price">
                            <span class="price-current"><span class="currency">${CONFIG.currencySymbol}</span>${item.price}</span>
                            ${originalPriceHTML}
                        </div>
                        <button class="btn btn-primary btn-add btn-special" data-id="${item.id}">Agregar +</button>
                    </div>
                </div>
            </div>
        `;
        dotsHTML += `<button class="slider-dot ${isActive}" aria-label="Ir a la diapositiva ${index + 1}"></button>`;
    });

    dotsHTML += '</div>';
    specialsContainer.innerHTML = slidesHTML + dotsHTML;

    // Reset initialization state so listeners can be attached to new DOM elements
    state.specialItemsInitialized = false;

    // Clear old interval to prevent overlapping slider timers
    if (state.slideInterval) {
        clearInterval(state.slideInterval);
    }

    // Re-initialize Lucide icons for the new injected HTML
    if (window.lucide) {
        lucide.createIcons();
    }

    initSpecialItems();
}

// Initialize special items separately
function initSpecialItems() {
    if (state.specialItemsInitialized) return;

    // No direct listeners needed for add buttons or click details - handled by delegation


    // Initial sync of ratings if data already exists
    if (Object.keys(state.itemRatingsData).length > 0) {
        updateSpecialsRatings();
    }

    // Slider logic
    const slides = document.querySelectorAll('.specials-slider .slide');
    const dots = document.querySelectorAll('.slider-dot');
    let currentSlide = 0;

    if (slides.length > 0) {
        const showSlide = (index) => {
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));

            if (slides[index]) slides[index].classList.add('active');
            if (dots[index]) dots[index].classList.add('active');
            currentSlide = index;
        };

        const nextSlide = () => {
            let next = (currentSlide + 1) % slides.length;
            showSlide(next);
        };

        // Start auto-play
        const startSlider = () => {
            if (state.slideInterval) clearInterval(state.slideInterval);
            state.slideInterval = setInterval(nextSlide, 5000);
        };

        // Handle dot clicks and hovers
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                startSlider();
            });
            dot.addEventListener('mouseenter', () => {
                showSlide(index);
                clearInterval(state.slideInterval);
            });
            dot.addEventListener('mouseleave', () => {
                startSlider();
            });
        });

        // Initialize first slide and start playback
        showSlide(0);
        startSlider();
    }

    state.specialItemsInitialized = true;
}

function setCategory(category) {
    state.selectedCategory = category;

    DOM.categoryTabs.forEach(tab => {
        const isActive = tab.dataset.category === category;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive);
    });

    renderMenu(category, state.searchQuery);
}

// ==========================================
// 7. SEARCH FUNCTIONALITY
// ==========================================

function handleSearch(query) {
    state.searchQuery = query;

    if (DOM.clearSearch) {
        DOM.clearSearch.classList.toggle('hidden', !query);
    }

    renderMenu(state.selectedCategory, query);
}

function clearSearch() {
    state.searchQuery = '';
    if (DOM.menuSearch) {
        DOM.menuSearch.value = '';
    }
    if (DOM.clearSearch) {
        DOM.clearSearch.classList.add('hidden');
    }
    renderMenu(state.selectedCategory, '');
}

// ==========================================
// 8. CART FUNCTIONS
// ==========================================

function addToCart(id) {
    try {
        let item = menuItems.find(i => i.id == id) || specialItems.find(i => i.id == id);
        if (!item) {
            console.error('Item not found for ID:', id);
            return;
        }

        const existingItem = state.cart.find(i => i.id == id);

        if (existingItem) {
            existingItem.qty++;
        } else {
            state.cart.push({ ...item, qty: 1 });
        }

        updateCart();
        saveToStorage();
        showToast(`¡${item.name} se agregó al carrito! 🛒`);
        animateCartIcon();
    } catch (error) {
        console.error('Error in addToCart:', error);
        showToast('No se pudo agregar al carrito', 'error');
    }
}

function addToCartWithQty(id, qty) {
    let item = menuItems.find(i => i.id == id) || specialItems.find(i => i.id == id);
    if (!item || qty < 1) return;

    const existingItem = state.cart.find(i => i.id == id);

    if (existingItem) {
        existingItem.qty += qty;
    } else {
        state.cart.push({ ...item, qty: qty });
    }

    updateCart();
    saveToStorage();
    showToast(`¡Se agregaron ${qty} de ${item.name} al carrito! 🛒`);
    animateCartIcon();
}

function updateCartItemQty(id, change) {
    const item = state.cart.find(i => i.id == id);
    if (!item) return;

    item.qty += change;

    if (item.qty <= 0) {
        removeFromCart(id);
    } else {
        updateCart();
        saveToStorage();
    }
}

function removeFromCart(id) {
    state.cart = state.cart.filter(i => i.id != id);
    updateCart();
    saveToStorage();
}

function updateCart() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const vatAmount = Math.round(subtotal * CONFIG.vatRate);
    const totalAmount = subtotal + vatAmount;

    updateCartBadges(totalItems);

    if (DOM.subtotal) DOM.subtotal.innerHTML = `${CONFIG.currency}${subtotal}`;
    if (DOM.vat) DOM.vat.innerHTML = `${CONFIG.currency}${vatAmount}`;
    if (DOM.total) DOM.total.innerHTML = `${CONFIG.currency}${totalAmount}`;

    const isEmpty = state.cart.length === 0;
    if (DOM.emptyCart) DOM.emptyCart.classList.toggle('hidden', !isEmpty);
    if (DOM.cartSummary) DOM.cartSummary.classList.toggle('hidden', isEmpty);

    renderCartItems();
}

function updateCartBadges(count) {
    const badges = [DOM.cartCount];

    badges.forEach(badge => {
        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        }
    });
}

function renderCartItems() {
    if (!DOM.cartItems) return;

    DOM.cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${CONFIG.currency}${item.price} c/u</div>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)" aria-label="Reducir cantidad">−</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)" aria-label="Aumentar cantidad">+</button>
            </div>
        </div>
    `).join('');
}

function animateCartIcon() {
    if (DOM.cartCount) {
        DOM.cartCount.classList.add('cart-bounce');
        setTimeout(() => DOM.cartCount.classList.remove('cart-bounce'), 400);
    }
}

function openCart() {
    state.isCartOpen = true;
    if (DOM.cartSidebar) DOM.cartSidebar.classList.add('open');
    if (DOM.cartOverlay) DOM.cartOverlay.classList.remove('hidden');
    setTimeout(() => {
        if (DOM.cartOverlay) DOM.cartOverlay.classList.add('visible');
    }, 10);
    document.body.classList.add('cart-open');
}

function closeCart() {
    state.isCartOpen = false;
    if (DOM.cartSidebar) DOM.cartSidebar.classList.remove('open');
    if (DOM.cartOverlay) DOM.cartOverlay.classList.remove('visible');
    setTimeout(() => {
        if (DOM.cartOverlay) DOM.cartOverlay.classList.add('hidden');
    }, 300);
    document.body.classList.remove('cart-open');
}

// ==========================================
// 9. ORDER FUNCTIONS
// ==========================================

async function placeOrder() {
    if (state.cart.length === 0) {
        showToast('¡Tu carrito está vacío!', 'warning');
        return;
    }

    const carrito = [...state.cart];
    const kitchenItems = carrito.map(removeInlineImageData);
    const subtotal = carrito.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const vat = Math.round(subtotal * CONFIG.vatRate);
    const totalCarrito = subtotal + vat;
    if (DOM.placeOrderBtn) DOM.placeOrderBtn.disabled = true;

    try {
        const orderNumber = generateOrderNumber();
        const { error } = await kitchenSupabaseClient
            .from('orders')
            .insert([{
                order_number: String(orderNumber),
                table_number: Number(state.currentTable || 1),
                items: kitchenItems,
                subtotal,
                vat,
                total: totalCarrito,
                instructions: DOM.instructions?.value || '',
                status: 'received'
            }]);

        if (error) throw error;

        const order = {
            id: orderNumber,
            table: state.currentTable,
            items: carrito,
            subtotal,
            vat,
            total: totalCarrito,
            instructions: DOM.instructions?.value || '',
            status: 'received',
            timestamp: new Date().toISOString()
        };

        state.orders.unshift(order);
        // The page was initialized before this order existed, so it was not
        // included in syncActiveOrders(). Subscribe now to kitchen status changes.
        subscribeToOrderUpdates(orderNumber);
        saveToStorage();
        state.cart = [];
        updateCart();
        if (DOM.instructions) DOM.instructions.value = '';
        updateOrderBadges();
        closeCart();
        showSuccessModal(orderNumber);
        alert('¡Pedido enviado con éxito! Gracias por tu compra.');
    } catch (error) {
        console.error('Error al enviar el pedido a Supabase:', error);
        alert('No pudimos enviar tu pedido. Revisa tu conexión e inténtalo nuevamente.');
    } finally {
        if (DOM.placeOrderBtn) DOM.placeOrderBtn.disabled = false;
    }
}

function generateOrderNumber() {
    return Math.floor(10000 + Math.random() * 90000);
}

function simulateOrderProgress(orderNumber) {
    const { preparing, ready, served } = CONFIG.orderStatusDelay;

    setTimeout(() => {
        updateOrderStatus(orderNumber, 'preparing');
        showToast('👨‍🍳 ¡Estamos preparando tu pedido!');
    }, preparing);

    setTimeout(() => {
        updateOrderStatus(orderNumber, 'ready');
        showToast('🍽️ ¡Tu pedido está listo!');
    }, ready);

    setTimeout(() => {
        updateOrderStatus(orderNumber, 'served');
        showToast('✅ Pedido entregado. ¡Buen provecho!');
        updateOrderBadges();
        // Auto-trigger rating modal for served order
        setTimeout(() => showRatingModal(orderNumber), 5000);
    }, served);
}

function updateOrderStatus(orderNumber, newStatus) {

    // Use loose equality and string conversion to be safe with IDs
    const order = state.orders.find(o => String(o.id) === String(orderNumber));

    if (!order) {
        console.warn(`Order #${orderNumber} not found in local state.`);
        return;
    }

    const statusIndex = { 'received': 0, 'preparing': 1, 'ready': 2, 'served': 3 };
    const normalizedStatus = String(newStatus || '').toLowerCase();
    const newStatusIndex = statusIndex[normalizedStatus] ?? 0;

    // Trigger animation BEFORE changing status (if modal is open)
    if (DOM.trackOrderModal && !DOM.trackOrderModal.classList.contains('hidden')) {
        // We update the status first so renderTrackOrders sees the new state
        order.status = newStatus;
        renderTrackOrders();
    }

    order.status = newStatus;
    saveToStorage();
    updateOrderBadges();

    // If modal is open, we need to refresh the list
    if (DOM.trackOrderModal && !DOM.trackOrderModal.classList.contains('hidden')) {
        renderTrackOrders();
    }

    if (DOM.ordersModal && !DOM.ordersModal.classList.contains('hidden')) {
        renderOrders();
    }
}

function updateOrderBadges() {
    const activeOrdersCount = state.orders.filter(o => o.status !== 'served').length;

    const badges = [DOM.activeOrdersBadge, DOM.mobileOrdersBadge];
    badges.forEach(badge => {
        if (badge) {
            badge.textContent = activeOrdersCount;
            badge.classList.toggle('hidden', activeOrdersCount === 0);
        }
    });

    if (DOM.floatingTrackOrder) {
        // Hide tracking button if all orders are served
        DOM.floatingTrackOrder.classList.toggle('hidden', activeOrdersCount === 0);
    }
    if (DOM.floatingOrderCount) {
        DOM.floatingOrderCount.textContent = activeOrdersCount;
        DOM.floatingOrderCount.classList.toggle('hidden', activeOrdersCount === 0);
    }
}

function renderOrders() {
    if (!DOM.ordersList) return;

    if (state.orders.length === 0) {
        DOM.ordersList.innerHTML = '';
        if (DOM.noOrders) DOM.noOrders.classList.remove('hidden');
        return;
    }

    if (DOM.noOrders) DOM.noOrders.classList.add('hidden');

    DOM.ordersList.innerHTML = state.orders.map(order => {
        const statusConfig = {
            'received': { label: '<i data-lucide="file-text"></i> Recibido', class: 'active' },
            'preparing': { label: '<i data-lucide="chef-hat"></i> En preparación', class: 'active' },
            'ready': { label: '<i data-lucide="utensils"></i> Listo', class: 'active' },
            'served': { label: '<i data-lucide="check-circle"></i> Entregado', class: 'completed' }
        };

        const status = statusConfig[order.status];
        const orderRatings = state.ratings[order.id];
        const isRated = orderRatings && Object.keys(orderRatings).length > 0;
        const isServed = order.status === 'served';

        return `
            <div class="order-item">
                <div class="order-header">
                    <div>
                <div class="order-id">Pedido n.º ${order.id}</div>
                        <div class="order-time">${formatDate(order.timestamp)}</div>
                    </div>
                    <span class="order-status ${status.class}">${status.label}</span>
                </div>
                <div class="order-items-list">
                    ${order.items.map(item => {
            const itemRating = orderRatings && orderRatings[item.id];
            const starsHTML = itemRating ? `<span class="order-item-rating">${'<i data-lucide="star"></i>'.repeat(itemRating.stars)}</span>` : '';
            return `
                        <div class="order-item-row">
                            <span class="order-item-name">
                                <img src="${item.image}" alt="${item.name}" class="order-item-thumb">
                                ${item.name} 
                                <span class="item-qty">×${item.qty}</span>
                                ${starsHTML}
                            </span>
                            <span>${CONFIG.currency}${item.price * item.qty}</span>
                        </div>
                    `}).join('')}
                </div>
                <div class="order-total">
                    <span>Total (IVA incluido)</span>
                    <span class="total-value gradient-text">${CONFIG.currency}${order.total}</span>
                </div>
                ${isServed && !isRated ? `<button class="rate-order-btn" onclick="showRatingModal('${order.id}')"><i data-lucide="star"></i> Calificar platillos</button>` : ''}
                ${isRated ? '<span class="rated-badge"><i data-lucide="check-circle"></i> Calificado</span>' : ''}
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function renderTrackOrders() {
    if (!DOM.trackOrderList) return;

    const activeOrders = state.orders;
    const statusMapping = { 'received': 0, 'preparing': 1, 'ready': 2, 'served': 3 };

    if (activeOrders.length === 0) {
        DOM.trackOrderList.innerHTML = '';
        return;
    }

    // 1. CAPTURE current visual states BEFORE any DOM changes
    const previousStates = {};
    document.querySelectorAll('.track-order-card').forEach(card => {
        const id = card.getAttribute('data-order-id');
        const progress = card.querySelector('.status-progress-fill');
        if (id && progress) {
            previousStates[id] = parseInt(progress.getAttribute('data-current-step'));
        }
    });

    // 2. BUILD the HTML blocks, incorporating previous states to prevent reset flicker
    const listEl = DOM.trackOrderList;
    const currentCards = Array.from(listEl.children);

    const orderHTMLBlocks = activeOrders.map((order) => {
        const normalized = String(order.status || '').toLowerCase();
        const targetStep = statusMapping[normalized] ?? 0;
        const isServed = normalized === 'served';

        // Use previous step as starting point if it exists
        const startStep = previousStates[order.id] !== undefined ? previousStates[order.id] : -1;
        const initialWidth = startStep >= 0 ? (startStep / 3) * 100 : 0;

        // Helper for initial step visuals
        const getStepStyle = (idx) => {
            if (startStep === -1) return '';
            if (idx < startStep || (idx === startStep && idx === 3))
                return 'background: #10b981;'; // Removed glow for Served
            if (idx === startStep)
                return 'background: var(--gradient-primary); box-shadow: 0 0 20px rgba(255, 140, 0, 0.6);';
            return '';
        };


        const getLabelClass = (idx) => {
            if (idx < startStep || (idx === startStep && idx === 3)) return 'completed';
            if (idx === startStep) return 'active';
            return '';
        };

        return {
            id: order.id,
            status: order.status,
            html: `
            <div class="track-order-card ${isServed ? 'order-served' : ''}" 
                 data-order-id="${order.id}" 
                 data-last-status="${order.status}">
                <div class="track-order-header">
                    <div>
                        <div class="track-order-id">Pedido n.º ${order.id}</div>
                        <div class="track-order-time">${formatTime(order.timestamp)}</div>
                    </div>
                    ${isServed ? `
                        <span class="track-status-badge completed"><i data-lucide="check-circle"></i> Entregado</span>
                    ` : `
                        <span class="track-status-badge">
                            <span class="live-dot"></span>
                            In Progress
                        </span>
                    `}
                </div>

                <!-- Status Tracker (Shows if active, or if just transitioning to Served) -->
                ${(() => {
                    const showTracker = !isServed || (isServed && startStep >= 0 && startStep < 3);
                    return `
                    <div class="status-tracker ${showTracker ? '' : 'hidden'}">
                        <div class="status-steps">
                            <div class="status-progress-line">
                                <div class="track-progress-${order.id} status-progress-fill" 
                                     style="width: ${initialWidth}%" 
                                     data-current-step="${startStep}"></div>
                            </div>
                            
                            ${['Recibido', 'En preparación', 'Listo', 'Entregado'].map((label, idx) => `
                                <div class="track-step-${order.id}-${idx} status-step">
                                    <div class="step-icon" style="${getStepStyle(idx)}">
                                        <i data-lucide="${['file-text', 'chef-hat', 'utensils', 'check-circle'][idx]}"></i>
                                    </div>
                                    <span class="step-label ${getLabelClass(idx)}">${label}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    `;
                })()}

                ${isServed ? `
                    <div class="served-confirmation">
                        <p>Tu pedido fue entregado. ¡Buen provecho! <i data-lucide="heart" class="icon-heart inline-icon"></i></p>
                    </div>
                ` : ''}

                <div class="track-order-items">
                    ${order.items.map(item => `
                        <div class="order-item-row">
                            <span class="order-item-name">
                                <img src="${item.image}" alt="${item.name}" class="order-item-thumb">
                                ${item.name} 
                                <span class="item-qty">×${item.qty}</span>
                            </span>
                            <span>${CONFIG.currency}${item.price * item.qty}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="track-order-footer">
                    <div class="track-total">
                        <span class="track-total-label">Total</span>
                        <span class="track-total-value gradient-text">${CONFIG.currency}${order.total}</span>
                    </div>
                    ${!isServed ? `
                        <div class="track-eta">
                        <span class="track-eta-label">Tiempo estimado</span>
                            <span class="track-eta-value">${CONFIG.estimatedTime}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            `
        };
    });

    // 3. GRANULAR DOM UPDATE
    if (currentCards.length === orderHTMLBlocks.length && currentCards.length > 0) {
        orderHTMLBlocks.forEach((data, idx) => {
            const card = currentCards[idx];
            if (card.getAttribute('data-order-id') !== String(data.id) ||
                card.getAttribute('data-last-status') !== data.status) {
                card.outerHTML = data.html;
            }
        });
    } else {
        listEl.innerHTML = orderHTMLBlocks.map(d => d.html).join('');
    }

    if (window.lucide) lucide.createIcons();

    // 4. TRIGGER targeted animations
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            activeOrders.forEach((order) => {
                const normalized = String(order.status || '').toLowerCase();
                const targetStep = statusMapping[normalized] ?? 0;
                const progressBar = document.querySelector(`.track-progress-${order.id}`);

                if (!progressBar) return;

                const currentStep = parseInt(progressBar.getAttribute('data-current-step'));
                let animationMode = false;

                if (!DOM.trackOrderModal.classList.contains('visible')) {
                    animationMode = 'full';
                } else if (currentStep < targetStep) {
                    animationMode = 'delta';
                }

                animateTrackOrderStatus(order.id, targetStep, animationMode);
            });
        });
    });
}

// Animate the track order status - animates UP TO the actual order status
function animateTrackOrderStatus(orderId, targetStep, mode = 'full') {
    const progressBar = document.querySelector(`.track-progress-${orderId}`);
    if (!progressBar) return;

    // Helper function to set step visual state immediately
    const setStepState = (step, state) => {
        const stepEl = document.querySelector(`.track-step-${orderId}-${step}`);
        if (!stepEl) return;
        const icon = stepEl.querySelector('.step-icon');
        const text = stepEl.querySelector('.step-label');

        if (state === 'completed') {
            if (icon) {
                icon.style.background = '#10b981';
                // Remove glow for Served step (step 3)
                icon.style.boxShadow = step === 3 ? 'none' : '0 0 15px rgba(16, 185, 129, 0.5)';
                icon.classList.remove('active');
                icon.classList.add('completed');
            }
            if (text) {
                text.style.color = '#10b981';
                text.classList.remove('active');
                text.classList.add('completed');
            }
        } else if (state === 'active') {
            if (icon) {
                icon.style.background = 'linear-gradient(135deg, #FF8C00 0%, #DC143C 100%)';
                icon.style.boxShadow = '0 0 20px rgba(255, 140, 0, 0.6)';
                icon.classList.add('active');
                icon.classList.remove('completed');
            }
            if (text) {
                text.style.color = '#FF8C00';
                text.classList.add('active');
                text.classList.remove('completed');
            }
        } else {
            if (icon) {
                icon.style.background = 'rgba(255, 255, 255, 0.1)';
                icon.style.boxShadow = 'none';
                icon.classList.remove('active', 'completed');
            }
            if (text) {
                text.style.color = '';
                text.classList.remove('active', 'completed');
            }
        }
    };

    const currentStep = parseInt(progressBar.getAttribute('data-current-step'));

    if (!mode) {
        // Immediate sync: No animation
        for (let i = 0; i <= 3; i++) {
            if (i < targetStep) {
                setStepState(i, 'completed');
            } else if (i === targetStep) {
                // If it's the final step (Served), show as completed
                setStepState(i, i === 3 ? 'completed' : 'active');
            } else {
                setStepState(i, 'disabled');
            }
        }
        progressBar.style.width = `${(targetStep / 3) * 100}%`;
        progressBar.setAttribute('data-current-step', targetStep);
        return;
    }

    if (mode === 'full') {
        // Full Intro: Reset and animate from 0
        for (let i = 0; i <= 3; i++) setStepState(i, 'disabled');
        progressBar.style.width = '0%';
        progressBar.setAttribute('data-current-step', -1);

        animateSteps(0, targetStep);
    } else if (mode === 'delta') {
        // Delta Update: Animate from current to target
        // We DO NOT reset the progress bar here. We start from where we left off.
        const startFrom = Math.max(0, currentStep + 1);
        if (startFrom <= targetStep) {
            animateSteps(startFrom, targetStep);
        }
    }

    function animateSteps(start, end) {
        const stepDelay = 600;
        let animatedCount = 0;

        for (let step = start; step <= end; step++) {
            (function (s, index) {
                const delay = index * stepDelay;
                setTimeout(() => {
                    // Turn PREVIOUS step green (completed)
                    if (s > 0) {
                        setStepState(s - 1, 'completed');
                    }

                    // For the VERY LAST STEP (3 - Served), we want it to look completed (green)
                    // instead of remaining orange (active) forever
                    if (s === 3) {
                        setStepState(s, 'completed');
                        // Use a longer delay to hide the tracker after the completion is seen
                        setTimeout(() => {
                            const tracker = progressBar.closest('.status-tracker');
                            if (tracker) {
                                tracker.style.opacity = '0';
                                tracker.style.transition = 'opacity 0.6s ease';
                                setTimeout(() => tracker.classList.add('hidden'), 600);
                            }
                        }, 2000);
                    } else {
                        // Make CURRENT step orange (active)
                        setStepState(s, 'active');
                    }

                    // Update progress bar
                    const progressWidth = (s / 3) * 100;
                    progressBar.style.width = `${progressWidth}%`;
                    progressBar.setAttribute('data-current-step', s);
                }, delay);
            })(step, animatedCount);
            animatedCount++;
        }
    }
}

// ==========================================
// 10. MODAL FUNCTIONS
// ==========================================

function showModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('visible'), 10);
}

function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('visible');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function showSuccessModal(orderNumber) {
    if (DOM.orderNumber) DOM.orderNumber.textContent = orderNumber;
    if (DOM.successTableNumber) DOM.successTableNumber.textContent = state.currentTable;
    showModal(DOM.successModal);
}

function showOrdersModal() {
    renderOrders();
    showModal(DOM.ordersModal);
}

function showTrackOrderModal() {
    renderTrackOrders();
    showModal(DOM.trackOrderModal);
}

function openItemModal(id) {
    const item = menuItems.find(i => i.id == id) || specialItems.find(i => i.id == id);
    if (!item) return;

    state.selectedItem = item;
    state.selectedItemQty = 1;

    if (DOM.itemModalIcon) {
        DOM.itemModalIcon.innerHTML = `<img src="${item.image}" alt="${item.name}">`;
    }
    if (DOM.itemModalTitle) DOM.itemModalTitle.textContent = item.name;
    if (DOM.itemModalDesc) DOM.itemModalDesc.textContent = item.desc;


    if (DOM.itemModalPrice) DOM.itemModalPrice.textContent = `${CONFIG.currency}${item.price}`;
    if (DOM.itemQtyValue) DOM.itemQtyValue.textContent = '1';
    if (DOM.itemTotalPrice) DOM.itemTotalPrice.textContent = `${CONFIG.currency}${item.price}`;

    // Display average rating and reviews
    const ratingData = state.itemRatingsData[item.id];
    if (DOM.itemModalAvgRating) DOM.itemModalAvgRating.textContent = ratingData ? ratingData.avg.toFixed(1) : '0.0';
    if (DOM.itemModalRatingCount) DOM.itemModalRatingCount.textContent = ratingData ? `(${ratingData.count} reseñas)` : '(0 reseñas)';

    // Render reviews
    if (DOM.itemReviewsList && DOM.noReviews) {
        if (ratingData && ratingData.reviews.length > 0) {
            DOM.noReviews.classList.add('hidden');
            DOM.itemReviewsList.innerHTML = ratingData.reviews.slice(0, 10).map(review => `
                <div class="review-card">
                    <div class="review-header">
                        <span class="review-stars">
                            ${'<i data-lucide="star" class="icon-star-filled"></i>'.repeat(review.stars)}
                            ${'<i data-lucide="star"></i>'.repeat(5 - review.stars)}
                        </span>
                        ${review.date ? `<span class="review-date">${formatReviewDate(review.date)}</span>` : ''}
                    </div>
                    ${review.feedback ? `<p class="review-text">${escapeHTML(review.feedback)}</p>` : ''}
                </div>
            `).join('');
        } else {
            DOM.noReviews.classList.remove('hidden');
            DOM.itemReviewsList.innerHTML = '';
        }
    }

    // Attach control listeners dynamically every time modal opens to ensure they aren't stale
    const minusBtn = document.getElementById('itemQtyMinus');
    const plusBtn = document.getElementById('itemQtyPlus');
    const addBtn = document.getElementById('addItemToCart');
    const closeBtn = document.getElementById('closeItemModal');

    if (minusBtn) minusBtn.onclick = () => updateItemModalQty(-1);
    if (plusBtn) plusBtn.onclick = () => updateItemModalQty(1);
    if (addBtn) addBtn.onclick = addSelectedItemToCart;
    if (closeBtn) closeBtn.onclick = () => hideModal(DOM.itemModal);

    showModal(DOM.itemModal);
    if (window.lucide) lucide.createIcons();
}

function updateSpecialsRatings() {
    document.querySelectorAll('.special-rating').forEach(el => {
        const id = el.dataset.id;
        const ratingData = state.itemRatingsData[id];
        if (ratingData) {
            const avgEl = el.querySelector('.card-rating-value');
            const countEl = el.querySelector('.card-rating-count');
            if (avgEl) avgEl.textContent = ratingData.avg.toFixed(1);
            if (countEl) countEl.textContent = `(${ratingData.count})`;
        }
    });
}

function updateItemModalQty(change) {
    state.selectedItemQty = Math.max(1, state.selectedItemQty + change);
    if (DOM.itemQtyValue) DOM.itemQtyValue.textContent = state.selectedItemQty;
    if (DOM.itemTotalPrice && state.selectedItem) {
        DOM.itemTotalPrice.textContent = `${CONFIG.currency}${state.selectedItem.price * state.selectedItemQty}`;
    }
}

function addSelectedItemToCart() {
    if (!state.selectedItem) return;
    addToCartWithQty(state.selectedItem.id, state.selectedItemQty);
    hideModal(DOM.itemModal);
    state.selectedItem = null;
    state.selectedItemQty = 1;
}

// ==========================================
// 11. WAITER FUNCTIONS
// ==========================================



async function callWaiter() {
    if (!state.currentTable) {
        showToast('Primero selecciona una mesa', 'error');
        return;
    }

    try {
        const { error } = await kitchenSupabaseClient
            .from('waiter_calls')
            .insert([{
                table_number: state.currentTable,
                status: 'pending'
            }]);

        if (error) throw error;

        showToast('Avisamos al mesero.', 'success');
    } catch (err) {
        console.error('Error calling waiter:', err.message);
        showToast('No se pudo avisar al mesero. Inténtalo de nuevo.', 'error');
    }
}
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleScroll() {
    const scrollY = window.scrollY;

    if (DOM.navbar) {
        DOM.navbar.classList.toggle('scrolled', scrollY > 50);
    }

    if (DOM.backToTop) {
        DOM.backToTop.classList.toggle('visible', scrollY > 500);
    }
}

// ==========================================
// 13. TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'success') {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, CONFIG.toastDuration);
}

// ==========================================
// 14. SCROLL & ANIMATION
// ==========================================

const scrollObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
);

function initScrollObserver() {
    observeScrollElements();
}

function observeScrollElements() {
    document.querySelectorAll('.scroll-reveal:not(.revealed)').forEach(el => {
        scrollObserver.observe(el);
    });
}

function handleMouseMove(e) {
    const orbs = document.querySelectorAll('.orb');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 15;
        orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
}

// ==========================================
// 15. EVENT LISTENERS
// ==========================================

function setupEventListeners() {

    // 1. UNIVERSAL CLICK DELEGATION
    document.addEventListener('click', (e) => {
        const target = e.target;

        // Table selection on welcome screen (Manual Selection)
        const tableBtn = target.closest('.table-btn-compact, .table-card-premium');
        if (tableBtn) {
            const table = tableBtn.dataset.table;

            // Visual feedback
            document.querySelectorAll('.table-btn-compact, .table-card-premium').forEach(c => {
                c.setAttribute('aria-checked', 'false');
                c.classList.remove('selected');
            });
            tableBtn.setAttribute('aria-checked', 'true');
            tableBtn.classList.add('selected');

            setTimeout(() => setTable(table), 100);
            return;
        }

        // Toggle Manual Selection Button
        if (target.closest('#toggleManualBtn')) {
            toggleManualSelection();
            return;
        }

        // Add to Cart from Menu Card (Regular Items)
        const menuAddBtn = target.closest('.btn-menu-item');
        if (menuAddBtn) {
            e.stopPropagation();
            addToCart(menuAddBtn.dataset.id);
            return;
        }

        // Add to Cart from Special Slide
        const specialAddBtn = target.closest('.btn-special');
        if (specialAddBtn) {
            e.stopPropagation();
            e.preventDefault();
            addToCart(specialAddBtn.dataset.id);
            return;
        }

        // Open Modal from Menu Card
        const foodCard = target.closest('.food-card');
        if (foodCard && !target.closest('.btn-add')) {
            openItemModal(foodCard.dataset.id);
            return;
        }

        // Open Modal from Special Slide Detail (Title, Desc, Rating)
        if (target.closest('.slide-title, .slide-description, .special-rating')) {
            const slide = target.closest('.slide-content');
            if (slide) {
                const btn = slide.querySelector('.btn-special');
                if (btn) openItemModal(btn.dataset.id);
            }
            return;
        }

        // Item Modal: Quantity Controls
        if (target.closest('#itemQtyMinus')) {
            updateItemModalQty(-1);
            return;
        }
        if (target.closest('#itemQtyPlus')) {
            updateItemModalQty(1);
            return;
        }

        // Item Modal: Add to Cart
        if (target.closest('#addItemToCart')) {
            addSelectedItemToCart();
            return;
        }

        // Item Modal: Close
        if (target.closest('#closeItemModal')) {
            hideModal(DOM.itemModal);
            return;
        }

        // Cart Actions
        if (target.closest('#cartBtn')) {
            openCart();
            return;
        }
        if (target.closest('#closeCart') || target.closest('#cartOverlay')) {
            closeCart();
            return;
        }
        if (target.closest('#placeOrder')) {
            placeOrder();
            return;
        }

        // Navigation / Modals
        if (target.closest('#viewOrdersBtn') || target.closest('#bottomNavOrdersBtn')) {
            showOrdersModal();
            return;
        }
        if (target.closest('#closeOrdersModal')) {
            hideModal(DOM.ordersModal);
            return;
        }
        if (target.closest('#floatingTrackBtn')) {
            showTrackOrderModal();
            return;
        }
        if (target.closest('#closeTrackOrderModal')) {
            hideModal(DOM.trackOrderModal);
            return;
        }
        if (target.closest('#closeSuccessModal')) {
            hideModal(DOM.successModal);
            return;
        }

        // Waiter Calling
        if (target.closest('#callWaiterBtn')) {
            callWaiter();
            return;
        }

        // Rating Modal
        if (target.closest('#closeRatingModal') || target.closest('#skipRating')) {
            hideModal(DOM.ratingModal);
            return;
        }
        if (target.closest('#submitRating')) {
            handleSubmitRatings();
            return;
        }

        // Back to top
        if (target.closest('#backToTop')) {
            scrollToTop();
            return;
        }
    });

    // 2. INPUT LISTENERS (Non-click events)
    if (DOM.menuSearch) {
        DOM.menuSearch.addEventListener('input', (e) => handleSearch(e.target.value));
        DOM.menuSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') clearSearch();
        });
    }

    if (DOM.categoryTabs) {
        DOM.categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => setCategory(tab.dataset.category));
        });
    }

    if (DOM.clearSearch) {
        DOM.clearSearch.addEventListener('click', clearSearch);
    }

    // Scroll events
    window.addEventListener('scroll', debounce(handleScroll, 10));

    // Mouse move for parallax
    document.addEventListener('mousemove', throttle(handleMouseMove, 50));



    // Window resize
    window.addEventListener('resize', debounce(handleResize, 100));

    // Modal backdrop clicks
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) hideModal(modal);
        });
    });

    // Prevent body scroll when modal is open
    document.addEventListener('touchmove', (e) => {
        if (document.body.classList.contains('modal-open') || document.body.classList.contains('cart-open')) {
            const target = e.target;
            if (!target.closest('.modal-body') && !target.closest('.cart-content')) {
                e.preventDefault();
            }
        }
    }, { passive: false });
}

function handleResize() {
}

// ==========================================
// 16. UTILITY FUNCTIONS
// ==========================================

function saveToStorage() {
    if (!state.currentTable) return;

    const data = {
        cart: state.cart.map(removeInlineImageData),
        orders: state.orders.map(order => ({
            ...order,
            items: Array.isArray(order.items) ? order.items.map(removeInlineImageData) : order.items
        })),
        ratings: state.ratings
    };

    try {
        localStorage.setItem(`rannaghor_table_${state.currentTable}`, JSON.stringify(data));
    } catch (e) {
        console.warn('No se pudo guardar una copia local de los datos:', e);
        if (!storageWarningShown) {
            storageWarningShown = true;
            showToast('No se pudo guardar una copia local en este dispositivo.', 'warning');
        }
    }
}

function removeInlineImageData(item) {
    if (!item || typeof item.image !== 'string' || !item.image.startsWith('data:')) return item;
    return { ...item, image: 'assets/images/logo.png' };
}

function loadFromStorage() {
    if (!state.currentTable) return;

    try {
        const data = localStorage.getItem(`rannaghor_table_${state.currentTable}`);
        if (data) {
            const parsed = JSON.parse(data);
            state.cart = parsed.cart || [];
            state.orders = parsed.orders || [];
            state.ratings = parsed.ratings || {};
            updateCart();
        }
    } catch (e) {
        // Issue #2: Improved error handling - silently handle corrupted data
        state.cart = [];
        state.orders = [];
        state.ratings = {};
    }
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==========================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ==========================================

/**
 * Realtime subscription for customer's specific order
 */
function subscribeToOrderUpdates(orderNumber) {
    if (typeof supabaseClient === 'undefined') return;


    // Ensure we don't have multiple subscriptions for the same order
    const channelName = `cust-order-${orderNumber}`;

    const channel = kitchenSupabaseClient
        .channel(channelName)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `order_number=eq.${orderNumber}`
        }, (payload) => {
            updateOrderStatus(orderNumber, payload.new.status);

            // Show toast for transparency
            const statusEmojis = { 'preparing': '👨‍🍳', 'ready': '🍽️', 'served': '✅' };
            const emoji = statusEmojis[payload.new.status] || '🔔';
            const statuses = { received: 'recibido', preparing: 'en preparación', ready: 'listo', served: 'entregado' };
            const status = statuses[payload.new.status] || payload.new.status;
            showToast(`${emoji} Estado del pedido n.º ${orderNumber}: ${status}`);

            // Auto-trigger rating when order is served
            if (payload.new.status === 'served') {
                setTimeout(() => showRatingModal(orderNumber), 5000);
            }
        })
        .subscribe((status) => {
        });

    return channel;
}

window.updateCartItemQty = updateCartItemQty;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.openItemModal = openItemModal;
window.showRatingModal = showRatingModal;

// ==========================================
// RATING SYSTEM
// ==========================================

function showRatingModal(orderNumber) {
    const order = state.orders.find(o => String(o.id) === String(orderNumber));
    if (!order) return;

    // Don't show if already rated
    if (state.ratings[orderNumber] && Object.keys(state.ratings[orderNumber]).length > 0) {
        showToast('¡Ya calificaste este pedido!', 'info');
        return;
    }

    state.ratingOrderId = orderNumber;

    // Reset views
    if (DOM.ratingView) DOM.ratingView.classList.remove('hidden');
    if (DOM.ratingThankYou) DOM.ratingThankYou.classList.add('hidden');
    if (DOM.ratingOrderNumber) DOM.ratingOrderNumber.textContent = orderNumber;

    // Build per-item rating rows
    if (DOM.ratingItemsList) {
        DOM.ratingItemsList.innerHTML = order.items.map(item => `
            <div class="rating-item-row" data-item-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="rating-item-thumb"
                     onerror="this.src='https://placehold.co/112x112/1a1a1a/ffffff?text=${encodeURIComponent(item.name)}'">
                <div class="rating-item-info">
                    <div class="rating-item-name">${item.name}</div>
            <div class="rating-item-qty">Cantidad: ${item.qty}</div>
                    <div class="star-selector" data-item-id="${item.id}">
                        ${[1, 2, 3, 4, 5].map(s => `<button class="star-btn" data-star="${s}" aria-label="${s} estrellas"><i data-lucide="star"></i></button>`).join('')}
                    </div>
                    <input type="text" class="rating-feedback-input" data-item-id="${item.id}"
                           placeholder="¿Algún comentario? (opcional)" maxlength="120">
                </div>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();

        // Attach star interaction listeners
        DOM.ratingItemsList.querySelectorAll('.star-selector').forEach(selector => {
            const stars = selector.querySelectorAll('.star-btn');

            stars.forEach((star, idx) => {
                star.addEventListener('mouseenter', () => {
                    stars.forEach((s, i) => {
                        s.classList.toggle('hovered', i <= idx);
                    });
                });

                star.addEventListener('mouseleave', () => {
                    stars.forEach(s => s.classList.remove('hovered'));
                });

                star.addEventListener('click', () => {
                    const rating = parseInt(star.dataset.star);
                    stars.forEach((s, i) => {
                        s.classList.toggle('active', i < rating);
                    });
                    // Mark the row as rated visually
                    selector.closest('.rating-item-row').classList.add('rated');
                });
            });
        });
    }

    showModal(DOM.ratingModal);
}

function handleSubmitRatings() {
    const orderNumber = state.ratingOrderId;
    if (!orderNumber) return;

    const order = state.orders.find(o => String(o.id) === String(orderNumber));
    if (!order) return;

    const itemRatings = {};
    let hasAnyRating = false;

    order.items.forEach(item => {
        const selector = DOM.ratingItemsList.querySelector(`.star-selector[data-item-id="${item.id}"]`);
        const feedbackInput = DOM.ratingItemsList.querySelector(`.rating-feedback-input[data-item-id="${item.id}"]`);

        if (selector) {
            const activeStars = selector.querySelectorAll('.star-btn.active').length;
            if (activeStars > 0) {
                hasAnyRating = true;
                itemRatings[item.id] = {
                    stars: activeStars,
                    feedback: feedbackInput ? feedbackInput.value.trim() : '',
                    itemName: item.name
                };
            }
        }
    });

    if (!hasAnyRating) {
        showToast('¡Califica al menos un platillo!', 'warning');
        return;
    }

    // Save ratings
    state.ratings[orderNumber] = itemRatings;
    saveToStorage();

    // Update local itemRatingsData cache so menu shows new avg
    Object.entries(itemRatings).forEach(([itemId, rating]) => {
        if (!state.itemRatingsData[itemId]) {
            state.itemRatingsData[itemId] = { avg: 0, count: 0, reviews: [] };
        }
        const data = state.itemRatingsData[itemId];
        const newCount = data.count + 1;
        const newAvg = ((data.avg * data.count) + rating.stars) / newCount;
        data.avg = newAvg;
        data.count = newCount;
        data.reviews.unshift({
            stars: rating.stars,
            feedback: rating.feedback,
            date: new Date().toISOString()
        });
    });

    // Re-render menu to update avg ratings on cards
    renderMenu(state.selectedCategory, state.searchQuery);

    // Update special items ratings in DOM
    document.querySelectorAll('.special-rating').forEach(el => {
        const id = el.dataset.id;
        const ratingData = state.itemRatingsData[id];
        if (ratingData) {
            const avgEl = el.querySelector('.card-rating-value');
            const countEl = el.querySelector('.card-rating-count');
            if (avgEl) avgEl.textContent = ratingData.avg.toFixed(1);
            if (countEl) countEl.textContent = `(${ratingData.count})`;
        }
    });

    // Save to Supabase if configured
    if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        saveRatingsToSupabase(orderNumber, itemRatings);
    }

    // Hide the rating modal immediately
    hideModal(DOM.ratingModal);

    showToast('¡Gracias por tus comentarios! ⭐');

    // Refresh order history if open
    if (DOM.ordersModal && !DOM.ordersModal.classList.contains('hidden')) {
        renderOrders();
    }

    state.ratingOrderId = null;
}

async function saveRatingsToSupabase(orderNumber, itemRatings) {
    try {
        const ratingRows = Object.entries(itemRatings).map(([itemId, rating]) => ({
            order_number: String(orderNumber),
            table_number: parseInt(state.currentTable),
            item_id: String(itemId),
            item_name: rating.itemName,
            stars: rating.stars,
            feedback: rating.feedback || '',
            created_at: new Date().toISOString()
        }));

        const { error } = await supabaseClient
            .from('ratings')
            .insert(ratingRows);

        if (error) throw error;
    } catch (err) {
        console.error('Error saving ratings to Supabase:', err.message);
    }
}

/**
 * Fetch aggregated item ratings from Supabase
 */
async function fetchItemRatings() {
    if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.warn('Supabase not configured. No ratings to fetch.');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('ratings')
            .select('item_id, stars, feedback, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase Ratings Error:', error);
            return;
        }


        if (data && data.length > 0) {
            // Aggregate ratings per item
            const aggregated = {};
            data.forEach(row => {
                const id = String(row.item_id); // Force to string
                if (!aggregated[id]) {
                    aggregated[id] = { total: 0, count: 0, reviews: [] };
                }
                aggregated[id].total += row.stars;
                aggregated[id].count++;
                aggregated[id].reviews.push({
                    stars: row.stars,
                    feedback: row.feedback || '',
                    date: row.created_at
                });
            });

            // Calculate averages and update state
            Object.keys(aggregated).forEach(id => {
                const d = aggregated[id];
                state.itemRatingsData[id] = {
                    avg: d.total / d.count,
                    count: d.count,
                    reviews: d.reviews
                };
            });


            // Re-render menu with updated ratings
            renderMenu(state.selectedCategory, state.searchQuery);

            // Update special items ratings in DOM
            updateSpecialsRatings();
        }
    } catch (err) {
        console.error('Error fetching item ratings:', err.message);
    }
}

/**
 * Format a review date for display
 */
function formatReviewDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Escape HTML to prevent XSS in review text
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


