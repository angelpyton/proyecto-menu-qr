/**
 * Rannaghor Table Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const tableInput = document.getElementById('tableCount');

    // Load persisted table count
    let savedCount = null;
    try { savedCount = localStorage.getItem('rannaghor_table_count'); } catch (_) {}
    if (savedCount && tableInput) {
        tableInput.value = String(Math.min(100, Math.max(1, Number.parseInt(savedCount, 10) || 4)));
    }

    renderQRManagementGrid();

    const qrGridContainer = document.getElementById('qrGridContainer');
    qrGridContainer?.addEventListener('click', event => {
        const downloadButton = event.target.closest('[data-qr-download]');
        if (downloadButton) {
            downloadQR(downloadButton.dataset.table, downloadButton.dataset.qrDownload);
            return;
        }
        const openButton = event.target.closest('[data-table-url]');
        if (openButton) openTable(openButton.dataset.tableUrl);
    });

    // Listen for changes to table count
    if (tableInput) {
        tableInput.addEventListener('input', () => {
            clearTimeout(tableInput._timeout);
            tableInput._timeout = setTimeout(() => {
                const count = Math.min(100, Math.max(1, Number.parseInt(tableInput.value, 10) || 1));
                tableInput.value = String(count);
                try { localStorage.setItem('rannaghor_table_count', String(count)); } catch (_) {}
                renderQRManagementGrid();
            }, 300);
        });
    }

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
});

/**
 * Renders the grid of QR codes and table links
 */
function renderQRManagementGrid() {
    const qrGridContainer = document.getElementById('qrGridContainer');
    const tableInput = document.getElementById('tableCount');
    if (!qrGridContainer) return;

    // Use current value, fallback to HTML default value, fallback to 4 as absolute last resort
    const rawCount = Number.parseInt(tableInput?.value, 10) || Number.parseInt(tableInput?.getAttribute('value'), 10) || 4;
    const tableCount = Math.min(100, Math.max(1, rawCount));
    const baseUrl = new URL('../index.html', window.location.href).href;

    qrGridContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= tableCount; i++) {
        const tableNum = i;
        const orderUrl = `${baseUrl}?table=${tableNum}`;

        const card = document.createElement('div');
        card.className = 'qr-management-card';

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(orderUrl).replace(/'/g, '%27')}&color=0d0500`;
        const previewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(orderUrl).replace(/'/g, '%27')}&color=0d0500`;
        const safeAttr = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
        card.innerHTML = `
            <div class="qr-card-header">
                <span class="qr-table-number">Table ${tableNum}</span>
                <button class="btn-icon-qr" title="Download QR" data-qr-download="${safeAttr(qrUrl)}" data-table="${tableNum}">
                    <i data-lucide="download"></i>
                </button>
            </div>
            <div class="qr-card-body">
                <img 
                    src="${safeAttr(previewUrl)}"
                    alt="QR Table ${tableNum}"
                    loading="lazy"
                    class="qr-preview"
                />
            </div>
            <div class="qr-card-footer">
                <button class="btn btn-primary btn-sm btn-full" data-table-url="${safeAttr(orderUrl)}">
                    <i data-lucide="external-link"></i>
                    <span>Open Table Menu</span>
                </button>
            </div>
        `;

        fragment.appendChild(card);
    }

    qrGridContainer.appendChild(fragment);

    // Re-render icons for new elements
    if (window.lucide) {
        lucide.createIcons();
    }
}

/**
 * Opens a specific table menu in a new tab
 * @param {string} url - The full order URL
 */
window.openTable = (url) => {
    const destination = new URL(url, window.location.href);
    if (destination.origin !== window.location.origin || destination.pathname !== new URL('../index.html', window.location.href).pathname) return;
    window.open(destination.href, '_blank', 'noopener,noreferrer');
};

/**
 * Downloads the QR code as a PNG file.
 * @param {string} tableNum - The table number for the filename.
 * @param {string} url - The QR code image URL.
 */
window.downloadQR = async (tableNum, url) => {
    try {
        if (!/^\d{1,3}$/.test(String(tableNum))) throw new Error('Número de mesa inválido.');
        const qrEndpoint = new URL(url);
        if (qrEndpoint.origin !== 'https://api.qrserver.com' || qrEndpoint.pathname !== '/v1/create-qr-code/') {
            throw new Error('Proveedor de QR inválido.');
        }
        const response = await fetch(qrEndpoint.href);
        if (!response.ok) throw new Error('El proveedor de QR no respondió correctamente.');
        const blob = await response.blob();
        if (blob.type !== 'image/png' || blob.size > 5 * 1024 * 1024) throw new Error('La respuesta del QR no es una imagen PNG válida.');
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `table-${tableNum}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
        console.error('Download failed:', error);
        alert("Failed to download QR code.");
    }
};
