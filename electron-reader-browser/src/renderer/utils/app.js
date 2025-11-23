// Student Reader & Browser - Main Application Logic

class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.splitMode = false;
        this.splitTabId = null;
        this.tabCounter = 0;
    }

    createTab(url = 'about:home', title = 'New Tab', activate = true) {
        const id = `tab-${++this.tabCounter}`;
        const tab = {
            id,
            url,
            title,
            favicon: null,
            loading: false,
            canGoBack: false,
            canGoForward: false,
            createdAt: new Date().toISOString()
        };
        this.tabs.push(tab);

        this.renderTabs();
        this.createWebview(id, url);

        if (activate) {
            this.activateTab(id);
        }

        return id;
    }

    createWebview(tabId, url) {
        const container = document.getElementById('webviewContainer1');
        const webview = document.createElement('webview');
        webview.id = `webview-${tabId}`;
        webview.setAttribute('src', url === 'about:home' ? '' : url);
        webview.setAttribute('allowpopups', 'true');
        webview.setAttribute('webpreferences', 'contextIsolation=true');
        webview.style.width = '100%';
        webview.style.height = '100%';
        webview.style.display = 'none';

        // Add homepage content for about:home
        if (url === 'about:home') {
            webview.style.display = 'none';
            this.showHomepage(tabId);
        }

        this.setupWebviewEvents(webview, tabId);
        container.appendChild(webview);
    }

    setupWebviewEvents(webview, tabId) {
        webview.addEventListener('did-start-loading', () => {
            this.updateTabLoading(tabId, true);
        });

        webview.addEventListener('did-stop-loading', () => {
            this.updateTabLoading(tabId, false);
        });

        webview.addEventListener('page-title-updated', (e) => {
            this.updateTabTitle(tabId, e.title);
        });

        webview.addEventListener('did-navigate', (e) => {
            this.updateTabUrl(tabId, e.url);
            this.logActivity(tabId, 'navigate');
        });

        webview.addEventListener('did-navigate-in-page', (e) => {
            if (e.isMainFrame) {
                this.updateTabUrl(tabId, e.url);
            }
        });

        webview.addEventListener('page-favicon-updated', (e) => {
            if (e.favicons && e.favicons.length > 0) {
                this.updateTabFavicon(tabId, e.favicons[0]);
            }
        });

        webview.addEventListener('new-window', (e) => {
            e.preventDefault();
            this.createTab(e.url);
        });

        webview.addEventListener('dom-ready', () => {
            const tab = this.getTab(tabId);
            if (tab && webview.canGoBack) {
                tab.canGoBack = webview.canGoBack();
                tab.canGoForward = webview.canGoForward();
            }
        });
    }

    showHomepage(tabId) {
        const container = document.getElementById('webviewContainer1');
        let homepage = container.querySelector('.homepage');

        if (!homepage) {
            homepage = document.createElement('div');
            homepage.className = 'homepage';
            homepage.id = `homepage-${tabId}`;
            homepage.innerHTML = `
                <div class="homepage-logo">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="var(--accent-color)">
                        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                    </svg>
                </div>
                <h1 style="margin-bottom: 10px; color: var(--text-primary);">Student Reader & Browser</h1>
                <p style="margin-bottom: 30px; color: var(--text-secondary);">Your educational companion</p>
                <div class="homepage-search">
                    <input type="text" id="homepageSearch" placeholder="Search the web or enter a URL..." onkeypress="if(event.key==='Enter') navigateFromHomepage(this.value)">
                </div>
                <h3 style="margin-bottom: 20px; color: var(--text-secondary);">Quick Access</h3>
                <div class="shortcuts-grid" id="shortcutsGrid">
                    <div class="shortcut-item" onclick="openShortcut('documents')">
                        <div class="shortcut-icon">📚</div>
                        <div class="shortcut-title">Documents</div>
                    </div>
                    <div class="shortcut-item" onclick="tabManager.createTab('https://www.wikipedia.org')">
                        <div class="shortcut-icon">🌐</div>
                        <div class="shortcut-title">Wikipedia</div>
                    </div>
                    <div class="shortcut-item" onclick="tabManager.createTab('https://www.khanacademy.org')">
                        <div class="shortcut-icon">🎓</div>
                        <div class="shortcut-title">Khan Academy</div>
                    </div>
                    <div class="shortcut-item" onclick="openShortcut('bookmarks')">
                        <div class="shortcut-icon">⭐</div>
                        <div class="shortcut-title">Bookmarks</div>
                    </div>
                    <div class="shortcut-item" onclick="openShortcut('history')">
                        <div class="shortcut-icon">🕐</div>
                        <div class="shortcut-title">History</div>
                    </div>
                    <div class="shortcut-item" onclick="window.electronAPI.tools.openDictionary()">
                        <div class="shortcut-icon">📖</div>
                        <div class="shortcut-title">Dictionary</div>
                    </div>
                    <div class="shortcut-item" onclick="window.electronAPI.tools.openCalculator()">
                        <div class="shortcut-icon">🔢</div>
                        <div class="shortcut-title">Calculator</div>
                    </div>
                    <div class="shortcut-item" onclick="openShortcut('reader')">
                        <div class="shortcut-icon">📄</div>
                        <div class="shortcut-title">Open File</div>
                    </div>
                </div>
            `;
            container.appendChild(homepage);
        }
        homepage.style.display = 'flex';
    }

    hideHomepage(tabId) {
        const homepage = document.querySelector('.homepage');
        if (homepage) {
            homepage.style.display = 'none';
        }
    }

    activateTab(tabId) {
        const previousTabId = this.activeTabId;
        this.activeTabId = tabId;

        // Hide all webviews and show the active one
        const container = document.getElementById('webviewContainer1');
        container.querySelectorAll('webview').forEach(wv => {
            wv.style.display = 'none';
        });

        const webview = document.getElementById(`webview-${tabId}`);
        const tab = this.getTab(tabId);

        if (tab && tab.url === 'about:home') {
            this.showHomepage(tabId);
            if (webview) webview.style.display = 'none';
        } else {
            this.hideHomepage(tabId);
            if (webview) webview.style.display = 'flex';
        }

        // Update address bar
        if (tab) {
            document.getElementById('addressInput').value = tab.url === 'about:home' ? '' : tab.url;
        }

        this.renderTabs();

        // Log tab switch for monitoring
        if (previousTabId !== tabId) {
            this.logActivity(tabId, 'switch_tab');
        }
    }

    closeTab(tabId) {
        const index = this.tabs.findIndex(t => t.id === tabId);
        if (index === -1) return;

        // Remove webview
        const webview = document.getElementById(`webview-${tabId}`);
        if (webview) webview.remove();

        // Remove tab
        this.tabs.splice(index, 1);

        // If this was the active tab, activate another
        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                const newActiveIndex = Math.min(index, this.tabs.length - 1);
                this.activateTab(this.tabs[newActiveIndex].id);
            } else {
                // Create a new tab if all tabs are closed
                this.createTab();
            }
        }

        this.renderTabs();
    }

    getTab(tabId) {
        return this.tabs.find(t => t.id === tabId);
    }

    getActiveTab() {
        return this.getTab(this.activeTabId);
    }

    updateTabTitle(tabId, title) {
        const tab = this.getTab(tabId);
        if (tab) {
            tab.title = title || 'New Tab';
            this.renderTabs();
        }
    }

    updateTabUrl(tabId, url) {
        const tab = this.getTab(tabId);
        if (tab) {
            tab.url = url;
            if (this.activeTabId === tabId) {
                document.getElementById('addressInput').value = url;
            }

            // Add to history
            if (url && url !== 'about:home' && !url.startsWith('file://')) {
                window.electronAPI.history.add({
                    url: url,
                    title: tab.title
                });
            }
        }
    }

    updateTabFavicon(tabId, favicon) {
        const tab = this.getTab(tabId);
        if (tab) {
            tab.favicon = favicon;
            this.renderTabs();
        }
    }

    updateTabLoading(tabId, loading) {
        const tab = this.getTab(tabId);
        if (tab) {
            tab.loading = loading;
            this.renderTabs();

            if (this.activeTabId === tabId) {
                document.getElementById('statusText').textContent = loading ? 'Loading...' : 'Ready';
            }
        }
    }

    navigate(url) {
        if (!url) return;

        // Handle search vs URL
        if (!url.includes('.') && !url.startsWith('http') && !url.startsWith('file://')) {
            url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        } else if (!url.startsWith('http') && !url.startsWith('file://')) {
            url = 'https://' + url;
        }

        const tab = this.getActiveTab();
        if (tab) {
            tab.url = url;
            this.hideHomepage(tab.id);

            const webview = document.getElementById(`webview-${tab.id}`);
            if (webview) {
                webview.style.display = 'flex';
                webview.src = url;
            }
        }
    }

    goBack() {
        const webview = document.getElementById(`webview-${this.activeTabId}`);
        if (webview && webview.canGoBack()) {
            webview.goBack();
        }
    }

    goForward() {
        const webview = document.getElementById(`webview-${this.activeTabId}`);
        if (webview && webview.canGoForward()) {
            webview.goForward();
        }
    }

    refresh() {
        const webview = document.getElementById(`webview-${this.activeTabId}`);
        if (webview) {
            webview.reload();
        }
    }

    goHome() {
        const tab = this.getActiveTab();
        if (tab) {
            tab.url = 'about:home';
            tab.title = 'New Tab';
            const webview = document.getElementById(`webview-${tab.id}`);
            if (webview) {
                webview.style.display = 'none';
            }
            this.showHomepage(tab.id);
            document.getElementById('addressInput').value = '';
            this.renderTabs();
        }
    }

    toggleSplitScreen() {
        this.splitMode = !this.splitMode;
        const divider = document.getElementById('splitDivider');
        const container2 = document.getElementById('webviewContainer2');

        if (this.splitMode) {
            divider.style.display = 'block';
            container2.style.display = 'flex';
            document.getElementById('contentArea').classList.add('split');

            // Create a new tab for split view if needed
            if (!this.splitTabId) {
                this.splitTabId = this.createTab('about:home', 'Split View', false);
            }
        } else {
            divider.style.display = 'none';
            container2.style.display = 'none';
            document.getElementById('contentArea').classList.remove('split');
        }
    }

    renderTabs() {
        const container = document.getElementById('tabsContainer');
        container.innerHTML = '';

        this.tabs.forEach(tab => {
            const tabEl = document.createElement('div');
            tabEl.className = `tab ${tab.id === this.activeTabId ? 'active' : ''}`;
            tabEl.innerHTML = `
                ${tab.loading ? '<div class="loading-spinner" style="width: 14px; height: 14px;"></div>' :
                    (tab.favicon ? `<img src="${tab.favicon}" style="width: 16px; height: 16px;">` :
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-muted)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>')}
                <span class="tab-title">${tab.title}</span>
                <button class="tab-close btn-icon" style="padding: 2px;" onclick="event.stopPropagation(); tabManager.closeTab('${tab.id}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            `;
            tabEl.onclick = () => this.activateTab(tab.id);
            container.appendChild(tabEl);
        });
    }

    async logActivity(tabId, activityType) {
        const tab = this.getTab(tabId);
        if (!tab) return;

        const session = {
            date: new Date().toLocaleDateString(),
            timeStarted: new Date().toLocaleTimeString(),
            timeEnded: new Date().toLocaleTimeString(),
            duration: '0:00',
            documentTitle: tab.title,
            subject: this.extractSubject(tab.url),
            topic: tab.title,
            activityType: activityType
        };

        await window.electronAPI.monitoring.logSession(session);
    }

    extractSubject(url) {
        if (!url || url === 'about:home') return 'Home';
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return 'Local';
        }
    }
}

// Initialize Tab Manager
const tabManager = new TabManager();

// Application State
let currentTheme = 'light';
let userProfile = null;

// Initialize Application
async function initApp() {
    // Load user profile
    userProfile = await window.electronAPI.user.getProfile();
    if (userProfile) {
        document.getElementById('userInfo').textContent = `${userProfile.name} | ${userProfile.class}`;
    }

    // Load settings
    const savedTheme = await window.electronAPI.settings.get('theme');
    if (savedTheme) {
        changeTheme(savedTheme);
        document.getElementById('themeSelect').value = savedTheme;
    }

    // Create initial tab
    tabManager.createTab();

    // Setup event listeners
    setupEventListeners();

    // Setup crash recovery
    setupCrashRecovery();

    // Load profile info in settings
    updateProfileInfo();
}

function setupEventListeners() {
    // Navigation
    document.getElementById('backBtn').addEventListener('click', () => tabManager.goBack());
    document.getElementById('forwardBtn').addEventListener('click', () => tabManager.goForward());
    document.getElementById('refreshBtn').addEventListener('click', () => tabManager.refresh());
    document.getElementById('homeBtn').addEventListener('click', () => tabManager.goHome());
    document.getElementById('newTabBtn').addEventListener('click', () => tabManager.createTab());
    document.getElementById('splitScreenBtn').addEventListener('click', () => tabManager.toggleSplitScreen());

    // Address bar
    const addressInput = document.getElementById('addressInput');
    addressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            tabManager.navigate(addressInput.value);
        }
    });
    document.getElementById('goBtn').addEventListener('click', () => {
        tabManager.navigate(addressInput.value);
    });

    // Tools
    document.getElementById('dictionaryBtn').addEventListener('click', () => {
        window.electronAPI.tools.openDictionary();
        logToolUsage('dictionary');
    });
    document.getElementById('calculatorBtn').addEventListener('click', () => {
        window.electronAPI.tools.openCalculator();
        logToolUsage('calculator');
    });

    // Bookmark current page
    document.getElementById('bookmarkBtn').addEventListener('click', addBookmark);

    // History
    document.getElementById('historyBtn').addEventListener('click', showHistoryModal);

    // Bookmarks list
    document.getElementById('bookmarksListBtn').addEventListener('click', showBookmarksModal);

    // Downloads
    document.getElementById('downloadsBtn').addEventListener('click', showDownloadsModal);

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', showSettingsModal);

    // Save page
    document.getElementById('savePageBtn').addEventListener('click', savePage);

    // Reader mode
    document.getElementById('readerModeBtn').addEventListener('click', openReaderMode);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + T: New tab
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        tabManager.createTab();
    }
    // Ctrl/Cmd + W: Close tab
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        tabManager.closeTab(tabManager.activeTabId);
    }
    // Ctrl/Cmd + L: Focus address bar
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        document.getElementById('addressInput').focus();
        document.getElementById('addressInput').select();
    }
    // Ctrl/Cmd + R: Refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        tabManager.refresh();
    }
    // F5: Refresh
    if (e.key === 'F5') {
        e.preventDefault();
        tabManager.refresh();
    }
}

// Theme Management
function changeTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    window.electronAPI.settings.set('theme', theme);
}

// Bookmark Management
async function addBookmark() {
    const tab = tabManager.getActiveTab();
    if (!tab || tab.url === 'about:home') {
        showToast('Cannot bookmark this page', 'warning');
        return;
    }

    const result = await window.electronAPI.bookmarks.add({
        url: tab.url,
        title: tab.title,
        favicon: tab.favicon
    });

    if (result.success) {
        showToast('Bookmark added!', 'success');
    }
}

async function showBookmarksModal() {
    const modal = document.getElementById('bookmarksModal');
    const list = document.getElementById('bookmarksList');
    const bookmarks = await window.electronAPI.bookmarks.get();

    list.innerHTML = bookmarks.length === 0 ? '<p style="text-align: center; color: var(--text-muted);">No bookmarks yet</p>' :
        bookmarks.map(b => `
            <div class="bookmark-item" onclick="openBookmark('${b.url}')">
                ${b.favicon ? `<img src="${b.favicon}" style="width: 20px; height: 20px;">` : ''}
                <div class="bookmark-item-info">
                    <div class="bookmark-item-title">${b.title}</div>
                    <div class="bookmark-item-url">${b.url}</div>
                </div>
                <button class="btn-icon" onclick="event.stopPropagation(); removeBookmark('${b.id}')" title="Remove">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `).join('');

    modal.style.display = 'flex';
}

function closeBookmarksModal() {
    document.getElementById('bookmarksModal').style.display = 'none';
}

function openBookmark(url) {
    tabManager.navigate(url);
    closeBookmarksModal();
}

async function removeBookmark(id) {
    await window.electronAPI.bookmarks.remove(id);
    showBookmarksModal(); // Refresh list
}

// History Management
async function showHistoryModal() {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');
    const history = await window.electronAPI.history.get();

    list.innerHTML = history.length === 0 ? '<p style="text-align: center; color: var(--text-muted);">No history yet</p>' :
        history.slice(0, 100).map(h => `
            <div class="history-item" onclick="openFromHistory('${h.url}')">
                <div class="history-item-info">
                    <div class="history-item-title">${h.title || h.url}</div>
                    <div class="history-item-url">${h.url}</div>
                </div>
                <div class="history-item-time">${formatTimestamp(h.timestamp)}</div>
            </div>
        `).join('');

    modal.style.display = 'flex';
}

function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

function openFromHistory(url) {
    tabManager.navigate(url);
    closeHistoryModal();
}

async function clearHistory() {
    if (confirm('Are you sure you want to clear all browsing history?')) {
        await window.electronAPI.history.clear();
        showHistoryModal(); // Refresh
        showToast('History cleared', 'success');
    }
}

// Downloads Management
async function showDownloadsModal() {
    const modal = document.getElementById('downloadsModal');
    const list = document.getElementById('downloadsList');
    const downloads = await window.electronAPI.downloads.getHistory();

    list.innerHTML = downloads.length === 0 ? '<p style="text-align: center; color: var(--text-muted);">No downloads yet</p>' :
        downloads.map(d => `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-title">${d.filename}</div>
                    <div class="history-item-url">${d.url}</div>
                </div>
                <div class="history-item-time">${formatTimestamp(d.timestamp)}</div>
            </div>
        `).join('');

    modal.style.display = 'flex';
}

function closeDownloadsModal() {
    document.getElementById('downloadsModal').style.display = 'none';
}

async function clearDownloads() {
    if (confirm('Are you sure you want to clear download history?')) {
        await window.electronAPI.downloads.clear();
        showDownloadsModal();
        showToast('Downloads history cleared', 'success');
    }
}

// Settings Management
async function showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    updateProfileInfo();
    modal.style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function updateProfileInfo() {
    if (userProfile) {
        document.getElementById('profileInfo').innerHTML = `
            <strong>Name:</strong> ${userProfile.name}<br>
            <strong>Class:</strong> ${userProfile.class}
        `;
    }
}

async function saveSettings() {
    const theme = document.getElementById('themeSelect').value;
    const fontSize = document.getElementById('fontSizeSelect').value;
    const homepage = document.getElementById('homepageInput').value;

    await window.electronAPI.settings.set('theme', theme);
    await window.electronAPI.settings.set('fontSize', fontSize);
    await window.electronAPI.settings.set('homepage', homepage);

    changeTheme(theme);
    showToast('Settings saved!', 'success');
    closeSettingsModal();
}

async function editProfile() {
    await window.electronAPI.navigate.toRegistration();
}

async function logout() {
    if (confirm('Are you sure you want to logout? Your monitoring data will be exported first.')) {
        await exportMonitoringData();
        await window.electronAPI.user.logout();
        await window.electronAPI.navigate.toRegistration();
    }
}

async function exportMonitoringData() {
    const result = await window.electronAPI.monitoring.export();
    if (result.success) {
        showToast('Monitoring data exported successfully!', 'success');
    }
}

// Save Page
async function savePage() {
    const tab = tabManager.getActiveTab();
    if (!tab || tab.url === 'about:home') {
        showToast('Cannot save this page', 'warning');
        return;
    }

    const webview = document.getElementById(`webview-${tab.id}`);
    if (webview) {
        try {
            const html = await webview.executeJavaScript('document.documentElement.outerHTML');
            const result = await window.electronAPI.file.saveWebpage({
                url: tab.url,
                html: html,
                title: tab.title
            });
            if (result.success) {
                showToast('Page saved successfully!', 'success');
            }
        } catch (error) {
            showToast('Failed to save page', 'error');
        }
    }
}

// Reader Mode
async function openReaderMode() {
    const result = await window.electronAPI.file.openDocument();
    if (result.success) {
        // Open document in new tab
        tabManager.createTab(`file://${result.path}`);
    }
}

// Tool Usage Logging
async function logToolUsage(tool) {
    const session = {
        date: new Date().toLocaleDateString(),
        timeStarted: new Date().toLocaleTimeString(),
        timeEnded: new Date().toLocaleTimeString(),
        duration: '0:00',
        documentTitle: tool,
        subject: 'Tools',
        topic: tool,
        activityType: `tool_${tool}`
    };
    await window.electronAPI.monitoring.logSession(session);
}

// Crash Recovery
async function setupCrashRecovery() {
    // Try to recover from previous crash
    const savedState = await window.electronAPI.recovery.getState();
    if (savedState && savedState.tabs && savedState.tabs.length > 0) {
        const recover = confirm('A previous session was not properly closed. Would you like to restore your tabs?');
        if (recover) {
            savedState.tabs.forEach(tab => {
                if (tab.url !== 'about:home') {
                    tabManager.createTab(tab.url, tab.title, false);
                }
            });
        }
        await window.electronAPI.recovery.clearState();
    }

    // Save state periodically
    setInterval(saveAppState, 30000); // Every 30 seconds

    // Save state before unload
    window.addEventListener('beforeunload', saveAppState);
}

async function saveAppState() {
    const state = {
        tabs: tabManager.tabs.map(t => ({ url: t.url, title: t.title })),
        activeTabId: tabManager.activeTabId,
        timestamp: new Date().toISOString()
    };
    await window.electronAPI.recovery.saveState(state);
}

// Utility Functions
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="btn-icon" onclick="this.parentElement.remove()" style="padding: 2px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
    `;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 5000);
}

// Homepage shortcuts
function navigateFromHomepage(value) {
    tabManager.navigate(value);
}

function openShortcut(type) {
    switch (type) {
        case 'documents':
            openDocumentBrowser();
            break;
        case 'bookmarks':
            showBookmarksModal();
            break;
        case 'history':
            showHistoryModal();
            break;
        case 'reader':
            openReaderMode();
            break;
    }
}

async function openDocumentBrowser() {
    const structure = await window.electronAPI.file.getDocumentsStructure();
    if (structure.length === 0) {
        showToast('No documents found in the documents folder', 'warning');
        return;
    }

    // Show document browser modal
    let modalHtml = `
        <div class="modal-overlay" id="documentsModal" style="display: flex;">
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Document Library</h3>
                    <button class="btn-icon" onclick="document.getElementById('documentsModal').remove()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
                    ${structure.map(subject => `
                        <div class="sidebar-section">
                            <div class="sidebar-section-title">${subject.name}</div>
                            <ul class="document-list">
                                ${subject.topics.map(topic => `
                                    <li class="document-item" onclick="openDocument('${topic.path.replace(/\\/g, '\\\\')}')">
                                        <span class="document-icon">${getFileIcon(topic.type)}</span>
                                        <span>${topic.name}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function getFileIcon(type) {
    switch (type) {
        case 'pdf': return '📕';
        case 'epub': return '📗';
        case 'html':
        case 'htm': return '📄';
        case 'txt': return '📝';
        default: return '📄';
    }
}

function openDocument(path) {
    tabManager.createTab(`file://${path}`);
    const modal = document.getElementById('documentsModal');
    if (modal) modal.remove();
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
