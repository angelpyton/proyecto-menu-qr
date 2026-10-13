/**
 * Kitchen Dashboard Logic - Rannaghor
 * Handles Realtime Order Monitoring, Status Updates, Search, and Mobile UI
 */

// State
let orders = [];
let waiterCalls = [];
let searchQuery = '';
let activeMobileColumn = 'received';
// Keep optimistic kitchen actions visible if a poll that started earlier
// returns stale order data after the status was changed.
const orderStatusOverrides = new Map();

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
    await Promise.all([
        fetchActiveOrders(),
        fetchWaiterCalls()
    ]);
    // Setup Realtime connection (Instant updates)
    setupRealtime();

    // Background Sync Loop: Ensures data stays current even if Realtime is throttled/dropped
    // Runs every 5 seconds as a robust fallback for cross-device updates
    setInterval(async () => {
        await Promise.all([
            fetchActiveOrders(),
            fetchWaiterCalls()
        ]);
        renderDashboard();
    }, 5000);

    // Initial render
    renderDashboard();

    // Initial Lucide icons render
    if (window.lucide) lucide.createIcons();
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
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
    try {
        
        // 1. Fetch all active orders (received, preparing, ready)
        // This ensures the kitchen never "loses" an order that needs action
        const { data: activeData, error: activeError } = await supabaseClient
            .from('orders')
            .select('*')
            .in('status', ['received', 'preparing', 'ready'])
            .order('created_at', { ascending: true }); // Oldest first for active

        if (activeError) throw activeError;

        // 2. Fetch recent history (served)
        const { data: servedData, error: servedError } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('status', 'served')
            .order('created_at', { ascending: false })
            .limit(15);

        if (servedError) throw servedError;

        // Combine and update state
        const allOrders = [...(activeData || []), ...(servedData || [])];
        
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
    try {
        const { data, error } = await supabaseClient
            .from('waiter_calls')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) throw error;
        waiterCalls = data || [];
        renderServiceAlerts();
    } catch (err) {
        console.error('Error fetching waiter calls:', err.message);
    }
}

/**
 * Setup Realtime Listeners
 */
let pollingInterval = null;

function setupRealtime() {
    supabaseClient.removeAllChannels();

    // Orders Channel
    const ordersChannel = supabaseClient
        .channel('kitchen-orders')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'orders'
        }, (payload) => {
            handleOrderUpdate(payload);
        })
        .subscribe((status) => {
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
            // No action needed for waiter status anymore
        });
}

function startPollingFallback() {
    // Polling removed as per user request
}

/**
 * Handle Realtime Payloads for Waiter
 */
function handleWaiterUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
        if (newRecord.status === 'pending') {
            waiterCalls.push(newRecord);
            playNotification(); // Maybe a different sound eventually
        }
    } else if (eventType === 'UPDATE') {
        if (newRecord.status === 'resolved') {
            waiterCalls = waiterCalls.filter(c => c.id !== newRecord.id);
        } else {
            const index = waiterCalls.findIndex(c => c.id === newRecord.id);
            if (index !== -1) waiterCalls[index] = newRecord;
        }
    } else if (eventType === 'DELETE') {
        waiterCalls = waiterCalls.filter(c => c.id !== oldRecord.id);
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
        <div class="service-alert" data-call-id="${call.id}">
            <span class="alert-icon"><i data-lucide="bell"></i></span>
            <span class="alert-text">Table ${call.table_number} is calling!</span>
            <button class="btn-resolve-alert" onclick="resolveServiceAlert('${call.id}')">Handled</button>
        </div>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Resolve Service Alert
 */
async function resolveServiceAlert(id) {
    try {
        // Optimistic UI
        waiterCalls = waiterCalls.filter(c => c.id !== id);
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

    if (eventType === 'INSERT') {
        if (!orders.find(o => o.id === newRecord.id)) {
            orders.unshift(newRecord);
            playNotification();
        }
    } else if (eventType === 'UPDATE') {
        orderStatusOverrides.set(String(newRecord.id), newRecord.status);
        const index = orders.findIndex(o => o.id === newRecord.id);
        if (index !== -1) orders[index] = newRecord;
        else orders.unshift(newRecord);
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
    return path;
}

/**
 * Create HTML for an order card
 */
function createOrderCard(order) {
    const timeInfo = getTimeInfo(order.created_at);
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    let actionBtn = '';
    if (order.status === 'received') {
        actionBtn = `<button class="btn-kitchen btn-next" onclick="updateStatus('${order.id}', 'preparing')">Start Cooking</button>`;
    } else if (order.status === 'preparing') {
        actionBtn = `<button class="btn-kitchen btn-finish" onclick="updateStatus('${order.id}', 'ready')">Ready</button>`;
    } else if (order.status === 'ready') {
        actionBtn = `<button class="btn-kitchen btn-serve" onclick="updateStatus('${order.id}', 'served')">Serve</button>`;
    } else {
        actionBtn = `<span class="served-badge">Served <i data-lucide="check-circle"></i></span>`;
    }

    return `
        <article class="kitchen-card ${timeInfo.class}" data-order-id="${order.id}">
            <div class="card-header">
                <span class="order-id">#${order.order_number}</span>
                <span class="table-badge">Table ${order.table_number}</span>
            </div>
            <div class="card-items">
                ${items.map(item => `
                    <div class="card-item-row">
                        <div class="item-name-wrapper">
                            ${item.image ? `<img src="${fixImagePath(item.image)}" alt="${item.name}" class="kitchen-item-thumb">` : `<span class="item-emoji">${item.emoji || '🍽️'}</span>`}
                            <span>${item.name}</span>
                        </div>
                        <span class="item-qty">x${item.qty}</span>
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
    orderStatusOverrides.set(String(id), newStatus);
    try {
        // Optimistic UI
        const o = orders.find(o => String(o.id) === String(id));
        if (o) o.status = newStatus;
        renderDashboard();

        const { error } = await supabaseClient
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) throw error;
    } catch (err) {
        console.error('Update failed:', err);
        orderStatusOverrides.delete(String(id));
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
