// ========================================
// KELLNER APP - FASCHING 2026
// Complete Application Logic
// ========================================

// ========== PRODUCT DATA ==========
const PRODUCTS = [
    // Brötchen (Von unten holen)
    { id: 1, name: "Käsebrötchen", price: 4.00, category: "Brötchen", fetchFromBelow: true },
    { id: 2, name: "Wurstbrötchen", price: 4.00, category: "Brötchen", fetchFromBelow: true },
    { id: 3, name: "Mettbrötchen", price: 4.00, category: "Brötchen", fetchFromBelow: true },
    { id: 4, name: "Fleischkäsebrötchen", price: 4.50, category: "Brötchen", fetchFromBelow: true },
    { id: 5, name: "Lachsbrötchen", price: 5.00, category: "Brötchen", fetchFromBelow: true },
    { id: 6, name: "Brezel", price: 1.50, category: "Brötchen", fetchFromBelow: true },

    // Bier
    { id: 7, name: "Pils", size: "0,33l", price: 3.50, category: "Bier", fetchFromBelow: false },
    { id: 8, name: "Kölsch", size: "0,2l", price: 2.30, category: "Bier", fetchFromBelow: true },
    { id: 35, name: "Kranz (11 Kölsch)", price: 23.00, category: "Bier", fetchFromBelow: true },
    { id: 9, name: "Hefeweizen", size: "0,5l", price: 5.00, category: "Bier", fetchFromBelow: false },
    { id: 10, name: "Hefeweizen alkoholfrei", size: "0,5l", price: 5.00, category: "Bier", fetchFromBelow: false },
    { id: 11, name: "Pils alkoholfrei", size: "0,33l", price: 3.50, category: "Bier", fetchFromBelow: false },
    { id: 12, name: "Schöfferhofer Grape", size: "0,33l", price: 3.50, category: "Bier", fetchFromBelow: false },
    { id: 13, name: "Äppler", size: "0,33l", price: 3.50, category: "Bier", fetchFromBelow: false },

    // Softdrinks
    { id: 14, name: "Wasser", size: "0,25l", price: 2.50, category: "Softdrinks", fetchFromBelow: false },
    { id: 15, name: "Wasser", size: "0,75l", price: 5.50, category: "Softdrinks", fetchFromBelow: false },
    { id: 16, name: "Cola", size: "0,33l", price: 3.50, category: "Softdrinks", fetchFromBelow: false },
    { id: 17, name: "Fanta", size: "0,33l", price: 3.50, category: "Softdrinks", fetchFromBelow: false },
    { id: 18, name: "Apfelschorle", size: "0,33l", price: 3.50, category: "Softdrinks", fetchFromBelow: false },
    { id: 19, name: "Cola Zero", size: "0,33l", price: 3.50, category: "Softdrinks", fetchFromBelow: false },
    { id: 20, name: "Sprite", size: "0,33l", price: 3.50, category: "Softdrinks", fetchFromBelow: false },

    // Wein
    { id: 21, name: "Weißwein (Rusbach)", size: "0,2l", price: 6.00, category: "Wein", fetchFromBelow: false },
    { id: 22, name: "Weißwein (Rusbach)", size: "0,75l", price: 21.50, category: "Wein", fetchFromBelow: false },
    { id: 23, name: "Rosé (Rusbach)", size: "0,2l", price: 6.00, category: "Wein", fetchFromBelow: false },
    { id: 24, name: "Rosé (Rusbach)", size: "0,75l", price: 21.50, category: "Wein", fetchFromBelow: false },
    { id: 25, name: "Sekt Cavalier Brut", size: "0,1l", price: 3.00, category: "Wein", fetchFromBelow: false },
    { id: 26, name: "Sekt Cavalier Brut", size: "0,75l", price: 18.00, category: "Wein", fetchFromBelow: false },

    // Cocktails (Von unten holen)
    { id: 27, name: "Aperol-Spritz", size: "0,2l", price: 6.00, category: "Cocktails", fetchFromBelow: true },
    { id: 28, name: "Wodka Energy", size: "0,3l", price: 6.50, category: "Cocktails", fetchFromBelow: true },
    { id: 29, name: "Gin Tonic", size: "0,3l", price: 6.50, category: "Cocktails", fetchFromBelow: true },
    { id: 30, name: "Cuba Libre", size: "0,3l", price: 6.50, category: "Cocktails", fetchFromBelow: true },
    { id: 31, name: "Jack Cola", size: "0,3l", price: 6.50, category: "Cocktails", fetchFromBelow: true },

    // Schnäpse (Von unten holen)
    { id: 32, name: "Obstler/Jägermeister", size: "2cl", price: 2.00, category: "Schnäpse", fetchFromBelow: true },
    { id: 33, name: "Schnäpse div", size: "2cl", price: 2.00, category: "Schnäpse", fetchFromBelow: true },
    { id: 34, name: "Klopfer/Pfläumchen", price: 2.00, category: "Schnäpse", fetchFromBelow: true }
];

const CATEGORIES = ["Alle", "Brötchen", "Bier", "Softdrinks", "Wein", "Cocktails", "Schnäpse"];

// ========== APP STATE ==========
let state = {
    tables: [],
    selectedTableId: null,
    activeCategory: "Alle",
    pendingComment: null, // { orderId, tableId }
    filterOpenOnly: false
};

// ========== INITIALIZATION ==========
function init() {
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

    // Sort areas (Links, Mitte, Rechts, Außen, Ohne Bereich)
    const areaOrder = ['Links', 'Mitte', 'Rechts', 'Außen', 'Ohne Bereich'];
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
    document.getElementById('currentTable').textContent = table ? table.name : 'Kein Tisch';
    document.getElementById('menuTableBadge').textContent = table ? table.name : 'Tisch wählen';
    document.getElementById('orderTableBadge').textContent = table ? table.name : 'Tisch wählen';
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

    if (!state.selectedTableId) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🪑</div>
                <p>Bitte wähle zuerst einen Tisch</p>
            </div>
        `;
        footer.classList.remove('visible');
        return;
    }

    const table = state.tables.find(t => t.id === state.selectedTableId);
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
        const isOld = Date.now() - order.timestamp > 10 * 60 * 1000; // 10 minutes
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

    // Update total
    const total = calculateTableTotal(state.selectedTableId);
    document.getElementById('orderTotal').textContent = formatPrice(total);
    footer.classList.add('visible');
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
            <div class="fetch-group-header" onclick="goToTableOrder(${tableId})" style="cursor: pointer;">
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
            <div class="fetch-group-header" onclick="goToTableOrder(${tableId})" style="cursor: pointer;">
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
    saveState();
    updateCurrentTableDisplay();
    switchView('order');
    renderOrderList();
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
