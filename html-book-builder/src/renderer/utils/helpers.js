// Utility helper functions

/**
 * Generate a unique ID
 */
function generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Debounce function
 */
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

/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension
 */
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Get file type from extension
 */
function getFileType(filename) {
    const ext = getFileExtension(filename);
    const types = {
        images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'],
        svgs: ['svg'],
        videos: ['mp4', 'webm', 'ogg', 'mov'],
        geogebra: ['ggb', 'ggt'],
        scripts: ['js'],
        styles: ['css'],
        html: ['html', 'htm'],
        json: ['json'],
        lottie: ['json'] // Needs special handling
    };

    for (const [type, extensions] of Object.entries(types)) {
        if (extensions.includes(ext)) {
            return type;
        }
    }
    return 'other';
}

/**
 * Get MIME type from extension
 */
function getMimeType(filename) {
    const ext = getFileExtension(filename);
    const mimeTypes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'js': 'application/javascript',
        'css': 'text/css',
        'html': 'text/html',
        'json': 'application/json'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Unescape HTML
 */
function unescapeHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

/**
 * Strip HTML tags
 */
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Deep merge objects
 */
function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Slugify text
 */
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Convert base64 to blob
 */
function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Read file as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Read file as data URL
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Create element from HTML string
 */
function createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

/**
 * Wait for milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get scroll progress (0-1)
 */
function getScrollProgress(element, container) {
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const containerCenter = containerRect.top + containerRect.height / 2;
    const elementTop = elementRect.top;
    const elementBottom = elementRect.bottom;

    if (elementBottom < containerRect.top) return 1;
    if (elementTop > containerRect.bottom) return 0;

    const progress = (containerCenter - elementTop) / (elementBottom - elementTop);
    return Math.max(0, Math.min(1, progress));
}

/**
 * Check if element is in viewport
 */
function isInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= -threshold &&
        rect.left >= -threshold &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
    );
}

/**
 * Get element center position in viewport
 */
function getElementCenterInViewport(element) {
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9._-]/gi, '_');
}

/**
 * Format date
 */
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export for use in other modules
window.helpers = {
    generateId,
    debounce,
    throttle,
    formatFileSize,
    getFileExtension,
    getFileType,
    getMimeType,
    escapeHtml,
    unescapeHtml,
    stripHtml,
    truncateText,
    deepClone,
    deepMerge,
    showToast,
    slugify,
    base64ToBlob,
    blobToBase64,
    readFileAsText,
    readFileAsDataURL,
    createElement,
    sleep,
    getScrollProgress,
    isInViewport,
    getElementCenterInViewport,
    sanitizeFilename,
    formatDate
};
