/**
 * Kitchen Dashboard Logic - Rannaghor
 * Handles Realtime Order Monitoring, Status Updates, Search, and Mobile UI
 */

// State
let orders = [];
let waiterCalls = [];
let searchQuery = '';
let activeMobileColumn = 'received';
let latestOrdersFetchId = 0;
let latestWaiterFetchId = 0;
let backgroundSyncInProgress = false;
// Keep optimistic kitchen actions visible if a poll that started earlier
// returns stale order data after the status was changed.
const orderStatusOverrides = new Map();
const DB_ORDER_STATUS = {
    received: 'Pendiente',
    preparing: 'En preparación',
    ready: 'Listo',
    served: 'Entregado'
};

function toKitchenStatus(value) {
    const normalized = String(value || '').trim().toLocaleLowerCase('es');
    const statusMap = {
        'pendiente': 'received', 'received': 'received',
        'en preparación': 'preparing', 'preparando': 'preparing', 'preparing': 'preparing',
        'listo': 'ready', 'ready': 'ready',
        'entregado': 'served', 'servido': 'served', 'served': 'served'
    };
    return statusMap[normalized] || 'received';
}

function normalizePedido(row) {
    let details = row.detalles;
    if (typeof details === 'string') {
        try { details = JSON.parse(details); } catch (_) { details = []; }
    }
    const items = Array.isArray(details) ? details : (Array.isArray(details?.items) ? details.items : []);
    return {
        id: row.id,
        order_number: row.id,
        table_number: row.mesa,
        items,
        instructions: Array.isArray(details) ? '' : (details?.instructions || ''),
        total: row.total,
        status: toKitchenStatus(row.estado),
        created_at: row.creado_en
    };
}

// DOM Elements
const DOM = {
    lists: {
        'received': document.getElementById('list-received'),
        'preparing': document.getElementById('list-preparing'),
        'ready': document.getElementById('list-ready'),
        'served': document.getElementById('list-served')
    },
    counts: {
        'received': document.getElementById('count-received'),
        'preparing': document.getElementById('count-preparing'),
        'ready': document.getElementById('count-ready'),
        'served': document.getElementById('count-served')
    },
    mobileCounts: {
        'received': document.getElementById('mobile-count-received'),
        'preparing': document.getElementById('mobile-count-preparing'),
        'ready': document.getElementById('mobile-count-ready'),
        'served': document.getElementById('mobile-count-served')
    },
    notificationSound: document.getElementById('orderSound'),
    orderSearch: document.getElementById('orderSearch'),
    clearSearch: document.getElementById('clearSearch'),
    mobileTabs: document.querySelectorAll('.mobile-tab'),
    columns: document.querySelectorAll('.order-column'),
    serviceAlerts: document.getElementById('serviceAlerts'),
    manualRefresh: document.getElementById('manualRefresh')
};

/**
 * Initialize Dashboard
 */
async function init() {

    setupEventListeners();
    // Subscribe before the initial fetch so updates are not missed while data loads.
    setupRealtime();
    await Promise.all([
        fetchActiveOrders(),
        fetchWaiterCalls()
    ]);

    // Realtime is the primary path; this low-frequency poll recovers after
    // dropped connections without hammering Supabase every few seconds.
    setInterval(async () => {
        if (backgroundSyncInProgress) return;
        backgroundSyncInProgress = true;
        try {
            await Promise.all([
                fetchActiveOrders(),
                fetchWaiterCalls()
            ]);
        } finally {
            backgroundSyncInProgress = false;
        }
    }, 15000);

    // Initial render
    renderDashboard();

    // Initial Lucide icons render
    if (window.lucide) lucide.createIcons();
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    document.addEventListener('click', event => {
        const action = event.target.closest('[data-order-action][data-order-id]');
        if (action) updateStatus(action.dataset.orderId, action.dataset.orderAction);
        const resolve = event.target.closest('[data-resolve-call]');
        if (resolve) resolveServiceAlert(resolve.dataset.resolveCall);
    });
    // Search
    if (DOM.orderSearch) {
        DOM.orderSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            if (DOM.clearSearch) {
                DOM.clearSearch.classList.toggle('hidden', !searchQuery);
            }
            renderDashboard();
        });
    }

    if (DOM.clearSearch) {
        DOM.clearSearch.addEventListener('click', () => {
            DOM.orderSearch.value = '';
            searchQuery = '';
            DOM.clearSearch.classList.add('hidden');
            renderDashboard();
        });
    }

    // Mobile Column Switching
    DOM.mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const columnId = tab.dataset.column;
            switchMobileColumn(columnId);
        });
    });
    // Manual Refresh
    if (DOM.manualRefresh) {
        DOM.manualRefresh.addEventListener('click', () => {
            DOM.manualRefresh.classList.add('refreshing');
            Promise.all([
                fetchActiveOrders(),
                fetchWaiterCalls()
            ]).finally(() => {
                setTimeout(() => DOM.manualRefresh.classList.remove('refreshing'), 500);
            });
        });
    }

    // Refresh on visibility change (more robust than focus)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            Promise.all([
                fetchActiveOrders(),
                fetchWaiterCalls()
            ]);
            // Ensure real-time is still healthy
            setupRealtime();
        }
    });

    // Also keep focus as a backup for some browsers
    window.addEventListener('focus', () => {
        if (document.visibilityState === 'visible') {
            fetchActiveOrders();
            fetchWaiterCalls();
        }
    });
}

/**
 * Switch Mobile Column
 */
function switchMobileColumn(columnId) {
    activeMobileColumn = columnId;

    // Update tabs
    DOM.mobileTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.column === columnId);
    });

    // Update columns
    DOM.columns.forEach(col => {
        col.classList.toggle('active', col.id === `column-${columnId}`);
    });
}

/**
 * Fetch orders that are not served yet, plus a small history of served orders
 */
async function fetchActiveOrders() {
    const fetchId = ++latestOrdersFetchId;
    try {
        
        // 1. Fetch all active orders (received, preparing, ready)
        // This ensures the kitchen never "loses" an order that needs action
        // Fetch active orders and recent served history concurrently so the
        // second query does not add its latency to the first one.
        const [activeResult, servedResult] = await Promise.all([
            supabaseClient
                .from('pedidos')
                .select('*')
                .in('estado', ['Pendiente', 'En preparación', 'Listo'])
                .order('creado_en', { ascending: true }),
            supabaseClient
                .from('pedidos')
                .select('*')
                .eq('estado', 'Entregado')
                .order('creado_en', { ascending: false })
                .limit(15)
        ]);

        const { data: activeData, error: activeError } = activeResult;
        const { data: servedData, error: servedError } = servedResult;
        if (fetchId !== latestOrdersFetchId) return;

        if (activeError) console.error('Error fetching active orders:', activeError.message);
        if (servedError) console.error('Error fetching served orders:', servedError.message);
        if (activeError && servedError) throw activeError;

        // If one query fails, keep that status group's last known orders while
        // still displaying fresh results from the successful query.
        const activeOrders = activeError
            ? orders.filter(order => ['received', 'preparing', 'ready'].includes(order.status))
            : (activeData || []).map(normalizePedido);
        const servedOrders = servedError
            ? orders.filter(order => order.status === 'served')
            : (servedData || []).map(normalizePedido);
        const allOrders = [...activeOrders, ...servedOrders];
        
        // Use a Set to ensure uniqueness if any duplicates occur during merge
        const uniqueOrders = [];
        const seenIds = new Set();
        
        allOrders.forEach(order => {
            if (!seenIds.has(order.id)) {
                const id = String(order.id);
                const statusOverride = orderStatusOverrides.get(id);
                if (statusOverride && order.status === statusOverride) {
                    orderStatusOverrides.delete(id);
                }
                uniqueOrders.push(statusOverride && order.status !== statusOverride
                    ? { ...order, status: statusOverride }
                    : order);
                seenIds.add(order.id);
            }
        });

        orders = uniqueOrders;
        renderDashboard();
    } catch (err) {
        if (fetchId !== latestOrdersFetchId) return;
        console.error('CRITICAL: Error fetching orders:', err.message);
        // If we have no orders at all, maybe show a warning in the UI
        if (orders.length === 0) {
            const statusEl = document.getElementById('connectionStatus');
            if (statusEl) {
                statusEl.textContent = 'Offline - Error Loading Orders';
                statusEl.className = 'status-badge status-offline';
            }
        }
    }
}

async function fetchWaiterCalls() {
    const fetchId = ++latestWaiterFetchId;
    try {
        const { data, error } = await supabaseClient
            .from('waiter_calls')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) throw error;
        if (fetchId !== latestWaiterFetchId) return;
        waiterCalls = data || [];
        renderServiceAlerts();
    } catch (err) {
        if (fetchId !== latestWaiterFetchId) return;
        console.error('Error fetching waiter calls:', err.message);
    }
}

/**
 * Setup Realtime Listeners
 */
function setupRealtime() {
    supabaseClient.removeAllChannels();

    // Orders Channel
    const ordersChannel = supabaseClient
        .channel('kitchen-orders')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'pedidos'
        }, (payload) => {
            handleOrderUpdate(payload);
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') fetchActiveOrders();
        });

    // Waiter Calls Channel
    const waiterChannel = supabaseClient
        .channel('waiter-calls')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'waiter_calls'
        }, (payload) => {
            handleWaiterUpdate(payload);
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') fetchWaiterCalls();
        });
}

/**
 * Handle Realtime Payloads for Waiter
 */
function handleWaiterUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    // Ignore waiter-call polls that started before this Realtime event.
    latestWaiterFetchId++;

    if (eventType === 'INSERT') {
        if (newRecord.status === 'pending' &&
            !waiterCalls.some(call => String(call.id) === String(newRecord.id))) {
            waiterCalls.push(newRecord);
            playNotification(); // Maybe a different sound eventually
        }
    } else if (eventType === 'UPDATE') {
        if (newRecord.status === 'resolved') {
            waiterCalls = waiterCalls.filter(c => String(c.id) !== String(newRecord.id));
        } else {
            const index = waiterCalls.findIndex(c => String(c.id) === String(newRecord.id));
            if (index !== -1) waiterCalls[index] = newRecord;
        }
    } else if (eventType === 'DELETE') {
        waiterCalls = waiterCalls.filter(c => String(c.id) !== String(oldRecord.id));
    }

    renderServiceAlerts();
}

/**
 * Render Service Alerts (Waiter Calls)
 */
function renderServiceAlerts() {
    if (!DOM.serviceAlerts) return;

    if (waiterCalls.length === 0) {
        DOM.serviceAlerts.classList.add('hidden');
        DOM.serviceAlerts.innerHTML = '';
        return;
    }

    DOM.serviceAlerts.classList.remove('hidden');
    DOM.serviceAlerts.innerHTML = waiterCalls.map(call => `
        <div class="service-alert" data-call-id="${escapeHTML(call.id)}">
            <span class="alert-icon"><i data-lucide="bell"></i></span>
            <span class="alert-text">Table ${escapeHTML(call.table_number)} is calling!</span>
            <button class="btn-resolve-alert" data-resolve-call="${escapeHTML(call.id)}">Handled</button>
        </div>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Resolve Service Alert
 */
async function resolveServiceAlert(id) {
    latestWaiterFetchId++;
    try {
        // Optimistic UI
        waiterCalls = waiterCalls.filter(c => String(c.id) !== String(id));
        renderServiceAlerts();

        const { error } = await supabaseClient
            .from('waiter_calls')
            .update({ status: 'resolved' })
            .eq('id', id);

        if (error) throw error;
    } catch (err) {
        console.error('Resolve failed:', err);
        fetchWaiterCalls();
    }
}

/**
 * Handle Realtime Payloads for Orders
 */
function handleOrderUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    // An in-flight poll may contain an older snapshot than this Realtime event.
    latestOrdersFetchId++;

    if (eventType === 'INSERT') {
        const order = normalizePedido(newRecord);
        if (!orders.find(o => String(o.id) === String(order.id))) {
            orders.unshift(order);
            playNotification();
        }
    } else if (eventType === 'UPDATE') {
        const order = normalizePedido(newRecord);
        orderStatusOverrides.set(String(order.id), order.status);
        const index = orders.findIndex(o => String(o.id) === String(order.id));
        if (index !== -1) orders[index] = order;
        else orders.unshift(order);
    } else if (eventType === 'DELETE') {
        orders = orders.filter(o => o.id !== oldRecord.id);
    }

    renderDashboard();
}

/**
 * Render all columns
 */
function renderDashboard() {
    // Apply search filter if active
    let filteredOrders = orders;
    if (searchQuery) {
        filteredOrders = orders.filter(o => {
            const tableNum = (o.table_number || '').toString();
            const orderNum = (o.order_number || '').toString();

            // Flexible table match: matches "4", "Table 4", or "t4"
            const tableMatch = tableNum.includes(searchQuery) ||
                `table ${tableNum}`.toLowerCase().includes(searchQuery) ||
                `t${tableNum}`.toLowerCase().includes(searchQuery);

            const orderMatch = orderNum.includes(searchQuery);

            // Check items for food names safely
            let foodMatch = false;
            try {
                const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                if (Array.isArray(items)) {
                    foodMatch = items.some(item =>
                        (item.name && item.name.toLowerCase().includes(searchQuery))
                    );
                }
            } catch (e) {
                console.error("Error parsing items for search:", e);
            }

            return tableMatch || orderMatch || foodMatch;
        });
    }

    // Grouping
    const groups = {
        'received': filteredOrders.filter(o => o.status === 'received').sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        'preparing': filteredOrders.filter(o => o.status === 'preparing').sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        'ready': filteredOrders.filter(o => o.status === 'ready').sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        'served': filteredOrders.filter(o => o.status === 'served').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
    };

    // Update Counts
    let activeTotal = 0;
    Object.keys(groups).forEach(status => {
        const count = groups[status].length;
        if (DOM.counts[status]) DOM.counts[status].textContent = count;
        if (DOM.mobileCounts[status]) DOM.mobileCounts[status].textContent = count;
        if (status !== 'served') activeTotal += count;

        // Render List
        if (DOM.lists[status]) {
            const listEl = DOM.lists[status];
            const newOrders = groups[status];

            // Generate IDs string to check if the sequence changed
            const newIds = newOrders.map(o => o.id).join(',');
            const currentIds = Array.from(listEl.children).map(child => child.dataset.orderId).join(',');

            if (newIds !== currentIds) {
                // Sequence or items changed: Full refresh
                listEl.innerHTML = newOrders.map(o => createOrderCard(o)).join('');
            } else {
                // Sequence is same: Only update time labels for existing cards
                newOrders.forEach((order, idx) => {
                    const card = listEl.children[idx];
                    const timeInfo = getTimeInfo(order.created_at);
                    const timeEl = card.querySelector('.time-elapsed');
                    if (timeEl) {
                        const newTimeHtml = `<span class="time-icon"><i data-lucide="clock"></i></span> ${timeInfo.label}`;
                        if (timeEl.innerHTML !== newTimeHtml) {
                            timeEl.innerHTML = newTimeHtml;
                            // Also update classes for warnings
                            timeEl.className = `time-elapsed ${timeInfo.textClass}`;
                        }
                    }
                });
            }
        }
    });

    if (window.lucide) lucide.createIcons();
}

/**
 * Helper to fix image paths for subfolder pages
 */
function fixImagePath(path) {
    if (!path) return '';
    // If it's a relative path starting with assets/, prefix with ../
    if (path.startsWith('assets/')) {
        return '../' + path;
    }
    try {
        const url = new URL(path, window.location.href);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
        return '';
    }
}

/**
 * Create HTML for an order card
 */
function createOrderCard(order) {
    const timeInfo = getTimeInfo(order.created_at);
    let items = order.items;
    if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (_) { items = []; }
    }
    if (!Array.isArray(items)) items = [];

    let actionBtn = '';
    if (order.status === 'received') {
        actionBtn = `<button class="btn-kitchen btn-next" data-order-action="preparing" data-order-id="${escapeHTML(order.id)}">Start Cooking</button>`;
    } else if (order.status === 'preparing') {
        actionBtn = `<button class="btn-kitchen btn-finish" data-order-action="ready" data-order-id="${escapeHTML(order.id)}">Ready</button>`;
    } else if (order.status === 'ready') {
        actionBtn = `<button class="btn-kitchen btn-serve" data-order-action="served" data-order-id="${escapeHTML(order.id)}">Serve</button>`;
    } else {
        actionBtn = `<span class="served-badge">Served <i data-lucide="check-circle"></i></span>`;
    }

    return `
        <article class="kitchen-card ${timeInfo.class}" data-order-id="${escapeHTML(order.id)}">
            <div class="card-header">
                <span class="order-id">#${escapeHTML(order.order_number)}</span>
                <span class="table-badge">Table ${escapeHTML(order.table_number)}</span>
            </div>
            <div class="card-items">
                ${items.map(item => `
                    <div class="card-item-row">
                        <div class="item-name-wrapper">
                            ${item.image ? `<img src="${escapeHTML(fixImagePath(item.image))}" alt="${escapeHTML(item.name)}" class="kitchen-item-thumb">` : `<span class="item-emoji">${escapeHTML(item.emoji || '🍽️')}</span>`}
                            <span>${escapeHTML(item.name)}</span>
                        </div>
                        <span class="item-qty">x${Number(item.qty) || 0}</span>
                    </div>
                `).join('')}
            </div>
            ${order.instructions ? `<div class="card-instructions">"${escapeHTML(order.instructions)}"</div>` : ''}
            ${order.status === 'served' ? `
                <div class="card-total">
                    <span>Total</span>
                    <strong>Gs. ${Number(order.total || 0).toLocaleString('es-PY')}</strong>
                </div>
            ` : ''}
            <div class="card-footer">
                <span class="time-elapsed ${timeInfo.textClass}">
                    <span class="time-icon"><i data-lucide="clock"></i></span> ${timeInfo.label}
                </span>
                <div class="card-actions">
                    ${actionBtn}
                </div>
            </div>
        </article>
    `;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

/**
 * Get time-based classes and labels
 */
function getTimeInfo(timestamp) {
    const diffMs = new Date() - new Date(timestamp);
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    let label = '';
    if (days > 0) {
        label = `${days}d ago`;
    } else if (hours > 0) {
        label = `${hours}h ago`;
    } else if (mins < 1) {
        label = 'Just now';
    } else {
        label = `${mins}m ago`;
    }

    let textClass = '';
    if (mins >= 15) textClass = 'time-danger';
    else if (mins >= 10) textClass = 'time-warning';

    return { label, textClass, class: '' };
}

/**
 * Update order status
 */
async function updateStatus(id, newStatus) {
    if (!['preparing', 'ready', 'served'].includes(newStatus)) return;
    const orderKey = String(id);
    const order = orders.find(item => String(item.id) === orderKey);
    const nextAllowed = {
        received: 'preparing',
        preparing: 'ready',
        ready: 'served'
    };
    if (!order || nextAllowed[order.status] !== newStatus) return;
    const previousStatus = order?.status;

    // Keep an in-flight poll from replacing this immediate UI update.
    latestOrdersFetchId++;
    orderStatusOverrides.set(orderKey, newStatus);
    try {
        // Optimistic UI
        if (order) order.status = newStatus;
        renderDashboard();

        const { error } = await supabaseClient
            .from('pedidos')
            .update({ estado: DB_ORDER_STATUS[newStatus] })
            .eq('id', id);

        if (error) throw error;
    } catch (err) {
        console.error('Update failed:', err);
        if (orderStatusOverrides.get(orderKey) === newStatus) {
            orderStatusOverrides.delete(orderKey);
            if (order && order.status === newStatus) order.status = previousStatus;
        }
        renderDashboard();
        await fetchActiveOrders();
    }
}

function playNotification() {
    if (DOM.notificationSound) {
        DOM.notificationSound.play().catch(() => { });
    }
}

// Global scope for onclick
window.updateStatus = updateStatus;

// Start app
document.addEventListener('DOMContentLoaded', init);
