// ========================================
// KELLNER APP - COMMERCIAL VERSION
// Complete Application Logic
// ========================================

// ========== PRODUCT DATA ==========
// Products and categories are stored in localStorage for customization
let PRODUCTS = [];
let CATEGORIES = ["Alle"];

// Default products for new users
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Beispiel Getränk", price: 3.50, size: "0,3l", category: "Getränke", fetchFromBelow: false },
    { id: 2, name: "Beispiel Speise", price: 8.00, category: "Speisen", fetchFromBelow: true }
];

const DEFAULT_CATEGORIES = ["Getränke", "Speisen"];

function loadProducts() {
    const savedProducts = localStorage.getItem('kellnerAppProducts');
    const savedCategories = localStorage.getItem('kellnerAppCategories');

    if (savedProducts) {
        PRODUCTS = JSON.parse(savedProducts);
    } else {
        PRODUCTS = [...DEFAULT_PRODUCTS];
        saveProducts();
    }

    if (savedCategories) {
        CATEGORIES = ["Alle", ...JSON.parse(savedCategories)];
    } else {
        CATEGORIES = ["Alle", ...DEFAULT_CATEGORIES];
        saveCategories();
    }
}

function saveProducts() {
    localStorage.setItem('kellnerAppProducts', JSON.stringify(PRODUCTS));
}

function saveCategories() {
    // Save without "Alle" since that's always added
    const cats = CATEGORIES.filter(c => c !== "Alle");
    localStorage.setItem('kellnerAppCategories', JSON.stringify(cats));
}

// ========== APP STATE ==========
let state = {
    tables: [],
    selectedTableId: null,
    activeCategory: "Alle",
    pendingComment: null, // { orderId, tableId }
    filterOpenOnly: false,
    viewingOrderTableId: null
};

// ========== INITIALIZATION ==========
function init() {
    loadProducts();  // Load products first
    loadState();
    renderTables();
    renderCategoryTabs();
    renderMenu();
    updateBadges();
    updateCurrentTableDisplay();
    startTimerUpdates();

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Error:', err));
    }
}

// ========== STATE MANAGEMENT ==========
function loadState() {
    const saved = localStorage.getItem('kellnerAppState');
    if (saved) {
        state = JSON.parse(saved);
    }
}

function saveState() {
    localStorage.setItem('kellnerAppState', JSON.stringify(state));
}

// ========== VIEW SWITCHING ==========
function switchView(viewName) {
    // Update views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    // Show/hide header table badge (only show on menu view)
    const headerInfo = document.querySelector('.header-info');
    if (headerInfo) {
        headerInfo.style.display = viewName === 'menu' ? 'block' : 'none';
    }

    // Render content based on view
    if (viewName === 'order') {
        renderOrder();
    } else if (viewName === 'fetch') {
        renderFetchList();
    } else if (viewName === 'fetchAbove') {
        renderFetchFromAbove();
    } else if (viewName === 'menu') {
        renderMenu();
    }
}

// ========== TABLES ==========
function renderTables() {
    const container = document.getElementById('tablesList');

    // Update filter button state
    const filterBtn = document.getElementById('filterOpenBtn');
    if (filterBtn) {
        filterBtn.classList.toggle('active', state.filterOpenOnly);
    }

    // Get tables to display (optionally filtered)
    let tablesToShow = state.tables;
    if (state.filterOpenOnly) {
        tablesToShow = state.tables.filter(t => calculateTableTotal(t.id) > 0);
    }

    if (tablesToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">${state.filterOpenOnly ? '✅' : '🪑'}</div>
                <p>${state.filterOpenOnly ? 'Keine offenen Beträge!' : 'Noch keine Tische.<br>Erstelle einen neuen Tisch!'}</p>
            </div>
        `;
        return;
    }

    // Group tables by area
    const areas = {};
    tablesToShow.forEach(table => {
        const area = table.area || 'Ohne Bereich';
        if (!areas[area]) areas[area] = [];
        areas[area].push(table);
    });

    // Sort areas (Links, Mitte, Rechts, Andere, Ohne Bereich)
    const areaOrder = ['Links', 'Mitte', 'Rechts', 'Andere', 'Ohne Bereich'];
    const sortedAreas = Object.keys(areas).sort((a, b) => {
        const aIdx = areaOrder.indexOf(a);
        const bIdx = areaOrder.indexOf(b);
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

    let html = '';
    sortedAreas.forEach(area => {
        if (sortedAreas.length > 1 || area !== 'Ohne Bereich') {
            html += `<div class="area-header">${escapeHtml(area)}</div>`;
        }
        areas[area].forEach(table => {
            const total = calculateTableTotal(table.id);
            const orderCount = getTableOrderCount(table.id);
            const isSelected = table.id === state.selectedTableId;

            html += `
                <div class="table-card ${isSelected ? 'selected' : ''}" onclick="selectTable(${table.id})">
                    <div class="table-name">${escapeHtml(table.name)}</div>
                    <div class="table-info">${orderCount} Bestellung${orderCount !== 1 ? 'en' : ''}</div>
                    <div class="table-total">${formatPrice(total)}</div>
                    <div class="table-actions">
                        <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); deleteTable(${table.id})">🗑️</button>
                    </div>
                </div>
            `;
        });
    });
    container.innerHTML = html;
}

function showAddTableModal() {
    document.getElementById('addTableModal').classList.add('active');
    document.getElementById('tableNameInput').value = '';
    document.getElementById('tableAreaSelect').value = '';
    document.getElementById('tableNameInput').focus();
}

function addTable() {
    const name = document.getElementById('tableNameInput').value.trim();
    const area = document.getElementById('tableAreaSelect').value;
    if (!name) return;

    const newTable = {
        id: Date.now(),
        name: name,
        area: area || null,
        orders: []
    };

    state.tables.push(newTable);
    state.selectedTableId = newTable.id;
    saveState();
    closeModal('addTableModal');
    renderTables();
    updateCurrentTableDisplay();
}

function toggleOpenFilter() {
    state.filterOpenOnly = !state.filterOpenOnly;
    renderTables();
}

function selectTable(tableId) {
    state.selectedTableId = tableId;
    saveState();
    renderTables();
    updateCurrentTableDisplay();

    // Switch to menu view
    switchView('menu');
}

function deleteTable(tableId) {
    if (!confirm('Tisch wirklich löschen?')) return;

    state.tables = state.tables.filter(t => t.id !== tableId);
    if (state.selectedTableId === tableId) {
        state.selectedTableId = state.tables.length > 0 ? state.tables[0].id : null;
    }
    saveState();
    renderTables();
    updateBadges();
    updateCurrentTableDisplay();
}

function updateCurrentTableDisplay() {
    const table = state.tables.find(t => t.id === state.selectedTableId);
    const currentTableEl = document.getElementById('currentTable');

    if (currentTableEl) currentTableEl.textContent = table ? table.name : 'Kein Tisch';
}

// ========== MENU ==========
function renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    container.innerHTML = CATEGORIES.map(cat => `
        <button class="category-tab ${cat === state.activeCategory ? 'active' : ''}" 
                onclick="selectCategory('${cat}')">${cat}</button>
    `).join('');
}

function selectCategory(category) {
    state.activeCategory = category;
    renderCategoryTabs();
    renderMenu();
}

function renderMenu() {
    const container = document.getElementById('menuList');

    let products = PRODUCTS;
    if (state.activeCategory !== "Alle") {
        products = PRODUCTS.filter(p => p.category === state.activeCategory);
    }

    container.innerHTML = products.map(product => `
        <div class="menu-item ${product.fetchFromBelow ? 'fetch-item' : ''}" 
             onclick="addToOrder(${product.id})">
            <div class="item-info">
                <div class="item-name">${escapeHtml(product.name)}</div>
                ${product.size ? `<div class="item-size">${product.size}</div>` : ''}
            </div>
            <div class="item-price">${formatPrice(product.price)}</div>
        </div>
    `).join('');
}

// ========== ORDERS ==========
function addToOrder(productId) {
    if (!state.selectedTableId) {
        alert('Bitte wähle zuerst einen Tisch!');
        switchView('tables');
        return;
    }

    const table = state.tables.find(t => t.id === state.selectedTableId);
    const product = PRODUCTS.find(p => p.id === productId);

    // Check if product already exists in order (without comment)
    const existingOrder = table.orders.find(o => o.productId === productId && !o.comment && !o.isPaid && !o.isDelivered);

    if (existingOrder) {
        existingOrder.quantity++;
    } else {
        table.orders.push({
            id: Date.now(),
            productId: productId,
            quantity: 1,
            comment: '',
            timestamp: Date.now(),
            isPaid: false,
            isDelivered: false
        });
    }

    saveState();
    updateBadges();

    // Brief visual feedback
    showToast(`${product.name} hinzugefügt`);
}

function renderOrder() {
    const container = document.getElementById('orderList');
    const footer = document.getElementById('orderFooter');
    const titleEl = document.getElementById('orderViewTitle');
    const backBtn = document.getElementById('orderBackBtn');
    const markPaidBtn = document.getElementById('markPaidBtn');

    // Check if we're viewing a specific table or the overview
    const viewingTable = state.viewingOrderTableId;

    if (viewingTable) {
        // DETAIL VIEW: Show single table's orders
        const table = state.tables.find(t => t.id === viewingTable);
        if (!table) {
            showOrderOverview();
            return;
        }

        titleEl.textContent = `🪑 ${table.name}`;
        backBtn.style.display = 'inline-flex';

        const unpaidOrders = table.orders.filter(o => !o.isPaid);

        if (unpaidOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <p>Keine offenen Bestellungen</p>
                </div>
            `;
            footer.classList.remove('visible');
            return;
        }

        container.innerHTML = unpaidOrders.map(order => {
            const product = PRODUCTS.find(p => p.id === order.productId);
            const timerText = getTimerText(order.timestamp);
            const isOld = Date.now() - order.timestamp > 10 * 60 * 1000;
            const isDelivered = order.isDelivered;

            return `
                <div class="order-item ${isDelivered ? 'delivered' : ''}">
                    <div class="order-header">
                        <div class="order-name">${escapeHtml(product.name)}${product.size ? ` (${product.size})` : ''}${isDelivered ? ' ✓' : ''}</div>
                        <div class="order-timer ${isOld ? 'timer-warning' : ''}">⏱️ ${timerText}</div>
                    </div>
                    ${order.comment ? `<div class="order-comment">💬 ${escapeHtml(order.comment)}</div>` : ''}
                    <div class="order-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${table.id}, ${order.id}, -1)">−</button>
                            <span class="quantity">${order.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${table.id}, ${order.id}, 1)">+</button>
                        </div>
                        <div class="order-price">${formatPrice(product.price * order.quantity)}</div>
                    </div>
                    <div class="order-actions">
                        <button class="btn btn-small btn-secondary" onclick="showCommentModal(${table.id}, ${order.id})">💬 Kommentar</button>
                        ${!isDelivered ? `<button class="btn btn-small btn-warning" onclick="markDelivered(${table.id}, ${order.id})">📤 Ausgeliefert</button>` : `<span class="delivered-badge">✓ Geliefert</span>`}
                    </div>
                </div>
            `;
        }).join('');

        const total = calculateTableTotal(table.id);
        document.getElementById('orderTotal').textContent = formatPrice(total);
        markPaidBtn.textContent = '✓ Alles bezahlt';
        footer.classList.add('visible');

    } else {
        // OVERVIEW: Show all tables with their totals
        titleEl.textContent = 'Alle Bestellungen';
        backBtn.style.display = 'none';

        // Get tables with open orders
        const tablesWithOrders = state.tables.filter(t => {
            const total = calculateTableTotal(t.id);
            return total > 0;
        });

        if (tablesWithOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <p>Keine offenen Bestellungen</p>
                </div>
            `;
            footer.classList.remove('visible');
            return;
        }

        container.innerHTML = tablesWithOrders.map(table => {
            const total = calculateTableTotal(table.id);
            const orderCount = getTableOrderCount(table.id);
            return `
                <div class="table-order-card" onclick="viewTableOrders(${table.id})">
                    <div class="table-order-name">🪑 ${escapeHtml(table.name)}</div>
                    <div class="table-order-info">${orderCount} Bestellung${orderCount !== 1 ? 'en' : ''}</div>
                    <div class="table-order-total">${formatPrice(total)}</div>
                    <div class="table-order-arrow">→</div>
                </div>
            `;
        }).join('');

        // Calculate total for all tables
        const totalAll = tablesWithOrders.reduce((sum, t) => sum + calculateTableTotal(t.id), 0);
        document.getElementById('orderTotal').textContent = formatPrice(totalAll);
        markPaidBtn.textContent = '✓ Alle bezahlen';
        footer.classList.add('visible');
    }
}

// Show table overview
function showOrderOverview() {
    state.viewingOrderTableId = null;
    renderOrder();
}

// View specific table's orders
function viewTableOrders(tableId) {
    state.viewingOrderTableId = tableId;
    state.selectedTableId = tableId; // Also select this table
    saveState();
    renderOrder();
}

function updateQuantity(tableId, orderId, delta) {
    const table = state.tables.find(t => t.id === tableId);
    const order = table.orders.find(o => o.id === orderId);

    order.quantity += delta;

    if (order.quantity <= 0) {
        table.orders = table.orders.filter(o => o.id !== orderId);
    }

    saveState();
    renderOrder();
    renderTables();
    updateBadges();
}

function markDelivered(tableId, orderId) {
    const table = state.tables.find(t => t.id === tableId);
    const order = table.orders.find(o => o.id === orderId);
    order.isDelivered = true;
    saveState();
    renderOrder();
    renderTables();
    renderFetchList();
    renderFetchFromAbove();
    updateBadges();
    showToast('Als ausgeliefert markiert ✓');
}

function markAllPaid() {
    if (!state.selectedTableId) return;

    const table = state.tables.find(t => t.id === state.selectedTableId);
    table.orders.forEach(o => o.isPaid = true);
    saveState();
    renderOrder();
    renderTables();
    updateBadges();
    showToast('Alle Bestellungen bezahlt! ✓');
}

// ========== COMMENTS ==========
function showCommentModal(tableId, orderId) {
    const table = state.tables.find(t => t.id === tableId);
    const order = table.orders.find(o => o.id === orderId);
    const product = PRODUCTS.find(p => p.id === order.productId);

    state.pendingComment = { tableId, orderId };

    document.getElementById('commentProductName').textContent = product.name;
    document.getElementById('commentInput').value = order.comment || '';
    document.getElementById('commentModal').classList.add('active');
    document.getElementById('commentInput').focus();
}

function saveComment() {
    if (!state.pendingComment) return;

    const { tableId, orderId } = state.pendingComment;
    const table = state.tables.find(t => t.id === tableId);
    const order = table.orders.find(o => o.id === orderId);

    order.comment = document.getElementById('commentInput').value.trim();

    saveState();
    closeModal('commentModal');
    renderOrder();
    state.pendingComment = null;
}

// ========== FETCH FROM BELOW ==========
function renderFetchList() {
    const container = document.getElementById('fetchList');

    // Collect all fetch-from-below items that are not delivered yet
    const fetchItems = [];

    state.tables.forEach(table => {
        table.orders.filter(o => !o.isPaid && !o.isDelivered).forEach(order => {
            const product = PRODUCTS.find(p => p.id === order.productId);
            if (product && product.fetchFromBelow) {
                fetchItems.push({
                    ...order,
                    tableName: table.name,
                    tableId: table.id,
                    product: product
                });
            }
        });
    });

    if (fetchItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <p>Nichts von unten zu holen!</p>
            </div>
        `;
        return;
    }

    // Group by table
    const groupedByTable = {};
    fetchItems.forEach(item => {
        if (!groupedByTable[item.tableId]) {
            groupedByTable[item.tableId] = {
                tableName: item.tableName,
                items: []
            };
        }
        groupedByTable[item.tableId].items.push(item);
    });

    container.innerHTML = Object.entries(groupedByTable).map(([tableId, group]) => `
        <div class="fetch-group">
            <div class="fetch-group-header" onclick="goToTableOrder(${parseInt(tableId)})" style="cursor: pointer;">
                <span>🪑 ${escapeHtml(group.tableName)}</span>
                <span class="goto-order-btn">📋 Zur Bestellung</span>
            </div>
            ${group.items.map(item => `
                <div class="fetch-item-row">
                    <div class="fetch-item-info">
                        <div class="fetch-item-name">${escapeHtml(item.product.name)}${item.product.size ? ` (${item.product.size})` : ''}</div>
                        ${item.comment ? `<div class="fetch-item-comment">💬 ${escapeHtml(item.comment)}</div>` : ''}
                    </div>
                    <span class="fetch-item-timer">⏱️ ${getTimerText(item.timestamp)}</span>
                    <span class="fetch-item-qty${item.quantity > 1 ? ' multi' : ''}">${item.quantity}x</span>
                    <button class="btn btn-small btn-warning" onclick="markDelivered(${item.tableId}, ${item.id})">📤</button>
                </div>
            `).join('')}
        </div>
    `).join('');
}

function refreshFetchList() {
    renderFetchList();
    showToast('Aktualisiert ↻');
}

// ========== FETCH FROM ABOVE ==========
function renderFetchFromAbove() {
    const container = document.getElementById('fetchAboveList');

    // Collect all fetch-from-above items (NOT fetchFromBelow) that are not delivered yet
    const fetchItems = [];

    state.tables.forEach(table => {
        table.orders.filter(o => !o.isPaid && !o.isDelivered).forEach(order => {
            const product = PRODUCTS.find(p => p.id === order.productId);
            if (product && !product.fetchFromBelow) {
                fetchItems.push({
                    ...order,
                    tableName: table.name,
                    tableId: table.id,
                    product: product
                });
            }
        });
    });

    if (fetchItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <p>Alles von oben geliefert!</p>
            </div>
        `;
        return;
    }

    // Group by table
    const groupedByTable = {};
    fetchItems.forEach(item => {
        if (!groupedByTable[item.tableId]) {
            groupedByTable[item.tableId] = {
                tableName: item.tableName,
                items: []
            };
        }
        groupedByTable[item.tableId].items.push(item);
    });

    container.innerHTML = Object.entries(groupedByTable).map(([tableId, group]) => `
        <div class="fetch-group">
            <div class="fetch-group-header" onclick="goToTableOrder(${parseInt(tableId)})" style="cursor: pointer;">
                <span>🪑 ${escapeHtml(group.tableName)}</span>
                <span class="goto-order-btn">📋 Zur Bestellung</span>
            </div>
            ${group.items.map(item => `
                <div class="fetch-item-row">
                    <div class="fetch-item-info">
                        <div class="fetch-item-name">${escapeHtml(item.product.name)}${item.product.size ? ` (${item.product.size})` : ''}</div>
                        ${item.comment ? `<div class="fetch-item-comment">💬 ${escapeHtml(item.comment)}</div>` : ''}
                    </div>
                    <span class="fetch-item-timer">⏱️ ${getTimerText(item.timestamp)}</span>
                    <span class="fetch-item-qty${item.quantity > 1 ? ' multi' : ''}">${item.quantity}x</span>
                    <button class="btn btn-small btn-warning" onclick="markDelivered(${item.tableId}, ${item.id})">📤</button>
                </div>
            `).join('')}
        </div>
    `).join('');
}

function refreshFetchAboveList() {
    renderFetchFromAbove();
    showToast('Aktualisiert ↻');
}

// Navigate to table's order view
function goToTableOrder(tableId) {
    state.selectedTableId = tableId;
    state.viewingOrderTableId = tableId;
    saveState();
    updateCurrentTableDisplay();
    switchView('order');
    renderOrder();
}

// Copy fetch list to clipboard for WhatsApp
function copyFetchListToClipboard() {
    const fetchItems = [];

    state.tables.forEach(table => {
        table.orders.filter(o => !o.isPaid && !o.isDelivered).forEach(order => {
            const product = PRODUCTS.find(p => p.id === order.productId);
            if (product && product.fetchFromBelow) {
                // Check if we already have this product
                const existing = fetchItems.find(f => f.productId === order.productId);
                if (existing) {
                    existing.quantity += order.quantity;
                } else {
                    fetchItems.push({
                        productId: order.productId,
                        name: product.name + (product.size ? ` (${product.size})` : ''),
                        quantity: order.quantity
                    });
                }
            }
        });
    });

    if (fetchItems.length === 0) {
        showToast('Keine Artikel zum Kopieren');
        return;
    }

    // Create simple text list (just the items, no header)
    const text = fetchItems.map(item =>
        `${item.quantity}x ${item.name}`
    ).join('\n');

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 In Zwischenablage kopiert!');
    }).catch(() => {
        showToast('Fehler beim Kopieren');
    });
}

// ========== UTILITIES ==========
function calculateTableTotal(tableId) {
    const table = state.tables.find(t => t.id === tableId);
    if (!table) return 0;

    return table.orders
        .filter(o => !o.isPaid)
        .reduce((sum, order) => {
            const product = PRODUCTS.find(p => p.id === order.productId);
            return sum + (product ? product.price * order.quantity : 0);
        }, 0);
}

function getTableOrderCount(tableId) {
    const table = state.tables.find(t => t.id === tableId);
    if (!table) return 0;
    return table.orders.filter(o => !o.isPaid).length;
}

function formatPrice(price) {
    return price.toFixed(2).replace('.', ',') + ' €';
}

function getTimerText(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes < 1) return `${seconds}s`;
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60} m`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function updateBadges() {
    // Order badge
    let totalOrders = 0;
    state.tables.forEach(t => {
        totalOrders += t.orders.filter(o => !o.isPaid).length;
    });

    const orderBadge = document.getElementById('orderBadge');
    orderBadge.textContent = totalOrders;
    orderBadge.classList.toggle('visible', totalOrders > 0);

    // Fetch from below badge
    let fetchBelowCount = 0;
    state.tables.forEach(table => {
        table.orders.filter(o => !o.isPaid && !o.isDelivered).forEach(order => {
            const product = PRODUCTS.find(p => p.id === order.productId);
            if (product && product.fetchFromBelow) {
                fetchBelowCount += order.quantity;
            }
        });
    });

    const fetchBadge = document.getElementById('fetchBadge');
    fetchBadge.textContent = fetchBelowCount;
    fetchBadge.classList.toggle('visible', fetchBelowCount > 0);

    // Fetch from above badge
    let fetchAboveCount = 0;
    state.tables.forEach(table => {
        table.orders.filter(o => !o.isPaid && !o.isDelivered).forEach(order => {
            const product = PRODUCTS.find(p => p.id === order.productId);
            if (product && !product.fetchFromBelow) {
                fetchAboveCount += order.quantity;
            }
        });
    });

    const fetchAboveBadge = document.getElementById('fetchAboveBadge');
    if (fetchAboveBadge) {
        fetchAboveBadge.textContent = fetchAboveCount;
        fetchAboveBadge.classList.toggle('visible', fetchAboveCount > 0);
    }
}

function showToast(message) {
    // Simple toast notification
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
position: fixed;
bottom: 100px;
left: 50 %;
transform: translateX(-50 %);
background: rgba(0, 0, 0, 0.8);
color: white;
padding: 12px 24px;
border - radius: 25px;
font - size: 0.9rem;
z - index: 2000;
animation: fadeInOut 2s ease;
`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
}

// Add toast animation
const style = document.createElement('style');
style.textContent = `
@keyframes fadeInOut {
    0 % { opacity: 0; transform: translateX(-50 %) translateY(20px); }
    15 % { opacity: 1; transform: translateX(-50 %) translateY(0); }
    85 % { opacity: 1; transform: translateX(-50 %) translateY(0); }
    100 % { opacity: 0; transform: translateX(-50 %) translateY(- 20px);
}
    }
`;
document.head.appendChild(style);

// Timer updates every second
function startTimerUpdates() {
    setInterval(() => {
        // Update timers in order view
        if (document.getElementById('view-order').classList.contains('active')) {
            renderOrder();
        }
        // Update timers in fetch view
        if (document.getElementById('view-fetch').classList.contains('active')) {
            renderFetchList();
        }
        // Update timers in fetch above view
        if (document.getElementById('view-fetchAbove') && document.getElementById('view-fetchAbove').classList.contains('active')) {
            renderFetchFromAbove();
        }
    }, 1000);
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', init);

// Handle Enter key in modals
document.getElementById('tableNameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTable();
});

document.getElementById('commentInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveComment();
    }
});

// ========== MENU EDITOR ==========
let editingProductId = null;

function showMenuEditor() {
    document.getElementById('menuEditorModal').classList.add('active');
    renderProductsList();
    renderCategoriesList();
}

function showEditorTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.editor-tab[onclick="showEditorTab('${tabName}')"]`).classList.add('active');

    // Show/hide content
    document.getElementById('editorProductsTab').style.display = tabName === 'products' ? 'block' : 'none';
    document.getElementById('editorCategoriesTab').style.display = tabName === 'categories' ? 'block' : 'none';
}

function renderProductsList() {
    const container = document.getElementById('productsList');

    if (PRODUCTS.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Keine Produkte. Erstelle dein erstes Produkt!</p></div>`;
        return;
    }

    container.innerHTML = PRODUCTS.map(product => `
        <div class="product-item ${product.fetchFromBelow ? 'needs-fetch' : ''}" onclick="showEditProductModal(${product.id})">
            <div class="product-item-info">
                <div class="product-item-name">${escapeHtml(product.name)}</div>
                <div class="product-item-details">${product.category}${product.size ? ' • ' + product.size : ''}${product.fetchFromBelow ? ' • 📦' : ''}</div>
            </div>
            <div class="product-item-price">${formatPrice(product.price)}</div>
        </div>
    `).join('');
}

function renderCategoriesList() {
    const container = document.getElementById('categoriesList');
    const cats = CATEGORIES.filter(c => c !== "Alle");

    if (cats.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Keine Kategorien.</p></div>`;
        return;
    }

    container.innerHTML = cats.map(cat => `
        <div class="category-item">
            <span class="category-item-name">${escapeHtml(cat)}</span>
            <button class="btn btn-small btn-danger" onclick="deleteCategory('${escapeHtml(cat)}')">🗑️</button>
        </div>
    `).join('');
}

function addCategory() {
    const input = document.getElementById('newCategoryInput');
    const name = input.value.trim();

    if (!name) return;
    if (CATEGORIES.includes(name)) {
        showToast('Kategorie existiert bereits');
        return;
    }

    CATEGORIES.push(name);
    saveCategories();
    input.value = '';
    renderCategoriesList();
    renderCategoryTabs();
    showToast('Kategorie hinzugefügt ✓');
}

function deleteCategory(name) {
    if (!confirm(`Kategorie "${name}" löschen? Produkte in dieser Kategorie werden zu "Ohne Kategorie".`)) return;

    CATEGORIES = CATEGORIES.filter(c => c !== name);
    saveCategories();

    // Update products in this category
    PRODUCTS.forEach(p => {
        if (p.category === name) p.category = "Ohne Kategorie";
    });
    saveProducts();

    renderCategoriesList();
    renderCategoryTabs();
    renderProductsList();
    showToast('Kategorie gelöscht');
}

function showAddProductModal() {
    editingProductId = null;
    document.getElementById('productModalTitle').textContent = 'Neues Produkt';
    document.getElementById('productNameInput').value = '';
    document.getElementById('productPriceInput').value = '';
    document.getElementById('productSizeInput').value = '';
    document.getElementById('productNeedsFetch').checked = false;
    document.getElementById('deleteProductBtn').style.display = 'none';

    updateCategorySelect();
    document.getElementById('productModal').classList.add('active');
    document.getElementById('productNameInput').focus();
}

function showEditProductModal(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    editingProductId = productId;
    document.getElementById('productModalTitle').textContent = 'Produkt bearbeiten';
    document.getElementById('productNameInput').value = product.name;
    document.getElementById('productPriceInput').value = product.price;
    document.getElementById('productSizeInput').value = product.size || '';
    document.getElementById('productNeedsFetch').checked = product.fetchFromBelow;
    document.getElementById('deleteProductBtn').style.display = 'inline-flex';

    updateCategorySelect(product.category);
    document.getElementById('productModal').classList.add('active');
}

function updateCategorySelect(selectedCategory = null) {
    const select = document.getElementById('productCategorySelect');
    const cats = CATEGORIES.filter(c => c !== "Alle");

    select.innerHTML = cats.map(cat =>
        `<option value="${escapeHtml(cat)}" ${cat === selectedCategory ? 'selected' : ''}>${escapeHtml(cat)}</option>`
    ).join('');

    // Add "Ohne Kategorie" option if no categories exist
    if (cats.length === 0) {
        select.innerHTML = `<option value="Ohne Kategorie">Ohne Kategorie</option>`;
    }
}

function saveProduct() {
    const name = document.getElementById('productNameInput').value.trim();
    const price = parseFloat(document.getElementById('productPriceInput').value) || 0;
    const size = document.getElementById('productSizeInput').value.trim();
    const category = document.getElementById('productCategorySelect').value;
    const needsFetch = document.getElementById('productNeedsFetch').checked;

    if (!name) {
        showToast('Bitte Name eingeben');
        return;
    }
    if (price <= 0) {
        showToast('Bitte gültigen Preis eingeben');
        return;
    }

    if (editingProductId) {
        // Edit existing
        const product = PRODUCTS.find(p => p.id === editingProductId);
        product.name = name;
        product.price = price;
        product.size = size || undefined;
        product.category = category;
        product.fetchFromBelow = needsFetch;
    } else {
        // Add new
        PRODUCTS.push({
            id: Date.now(),
            name,
            price,
            size: size || undefined,
            category,
            fetchFromBelow: needsFetch
        });
    }

    saveProducts();
    closeModal('productModal');
    renderProductsList();
    renderMenu();
    showToast(editingProductId ? 'Produkt aktualisiert ✓' : 'Produkt hinzugefügt ✓');
}

function deleteCurrentProduct() {
    if (!editingProductId) return;
    if (!confirm('Produkt wirklich löschen?')) return;

    PRODUCTS = PRODUCTS.filter(p => p.id !== editingProductId);
    saveProducts();
    closeModal('productModal');
    renderProductsList();
    renderMenu();
    showToast('Produkt gelöscht');
}

// Add keyboard handler for new category input
document.getElementById('newCategoryInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCategory();
});
