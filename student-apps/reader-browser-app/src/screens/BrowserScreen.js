import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BrowserScreen = ({ navigation }) => {
  const {
    tabs,
    activeTabId,
    splitScreen,
    splitTabId,
    addTab,
    closeTab,
    switchTab,
    updateTab,
    toggleSplitScreen,
    history,
    addHistoryEntry,
    bookmarks,
    addBookmark,
    removeBookmark,
    shortcuts,
    addShortcut,
    trackActivity,
    settings,
  } = useApp();

  const [urlInput, setUrlInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showTabList, setShowTabList] = useState(false);
  const [canGoBack, setCanGoBack] = useState({});
  const [canGoForward, setCanGoForward] = useState({});
  const [isLoading, setIsLoading] = useState({});
  const webViewRefs = useRef({});

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const splitTab = splitTabId ? tabs.find((t) => t.id === splitTabId) : null;

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url || '');
    }
  }, [activeTabId]);

  const normalizeUrl = (input) => {
    if (!input) return '';
    let url = input.trim();

    // Check if it's a search query
    if (!url.includes('.') || url.includes(' ')) {
      return `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    return url;
  };

  const navigateTo = (url, tabId = activeTabId) => {
    const normalizedUrl = normalizeUrl(url);
    if (normalizedUrl) {
      updateTab(tabId, { url: normalizedUrl });
      setUrlInput(normalizedUrl);
    }
  };

  const handleNavigationSubmit = () => {
    navigateTo(urlInput);
  };

  const handleGoBack = (tabId = activeTabId) => {
    if (webViewRefs.current[tabId] && canGoBack[tabId]) {
      webViewRefs.current[tabId].goBack();
    }
  };

  const handleGoForward = (tabId = activeTabId) => {
    if (webViewRefs.current[tabId] && canGoForward[tabId]) {
      webViewRefs.current[tabId].goForward();
    }
  };

  const handleRefresh = (tabId = activeTabId) => {
    if (webViewRefs.current[tabId]) {
      webViewRefs.current[tabId].reload();
    }
  };

  const handleNavigationStateChange = (navState, tabId) => {
    setCanGoBack((prev) => ({ ...prev, [tabId]: navState.canGoBack }));
    setCanGoForward((prev) => ({ ...prev, [tabId]: navState.canGoForward }));

    if (navState.url && navState.url !== 'about:blank') {
      updateTab(tabId, {
        url: navState.url,
        title: navState.title || 'Loading...'
      });

      if (tabId === activeTabId) {
        setUrlInput(navState.url);
      }

      // Track activity
      trackActivity('navigation', {
        url: navState.url,
        title: navState.title,
      });

      // Add to history
      addHistoryEntry({
        url: navState.url,
        title: navState.title || navState.url,
      });
    }
  };

  const handleAddBookmark = () => {
    if (activeTab && activeTab.url) {
      addBookmark({
        url: activeTab.url,
        title: activeTab.title || activeTab.url,
      });
      Alert.alert('Bookmark Added', 'Page has been added to bookmarks');
    }
    setShowMenu(false);
  };

  const handleAddShortcut = () => {
    if (activeTab && activeTab.url) {
      addShortcut({
        url: activeTab.url,
        title: activeTab.title || activeTab.url,
        icon: '🌐',
      });
      Alert.alert('Shortcut Added', 'Page has been added to homepage shortcuts');
    }
    setShowMenu(false);
  };

  const renderWebView = (tab, containerStyle) => {
    if (!tab.url) {
      return (
        <View style={[styles.homepage, containerStyle]}>
          <Text style={styles.homepageTitle}>Student Reader & Browser</Text>
          <Text style={styles.homepageSubtitle}>Enter a URL or search term above</Text>

          {shortcuts.length > 0 && (
            <View style={styles.shortcutsContainer}>
              <Text style={styles.shortcutsTitle}>Quick Access</Text>
              <View style={styles.shortcutsGrid}>
                {shortcuts.slice(0, 8).map((shortcut) => (
                  <TouchableOpacity
                    key={shortcut.id}
                    style={styles.shortcutItem}
                    onPress={() => navigateTo(shortcut.url, tab.id)}
                  >
                    <View style={styles.shortcutIcon}>
                      <Text style={styles.shortcutIconText}>{shortcut.icon || '🌐'}</Text>
                    </View>
                    <Text style={styles.shortcutText} numberOfLines={1}>
                      {shortcut.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.quickLinksContainer}>
            <Text style={styles.shortcutsTitle}>Quick Links</Text>
            <View style={styles.shortcutsGrid}>
              {[
                { title: 'Google', url: 'https://google.com', icon: '🔍' },
                { title: 'Wikipedia', url: 'https://wikipedia.org', icon: '📖' },
                { title: 'Khan Academy', url: 'https://khanacademy.org', icon: '🎓' },
                { title: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
              ].map((link, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.shortcutItem}
                  onPress={() => navigateTo(link.url, tab.id)}
                >
                  <View style={styles.shortcutIcon}>
                    <Text style={styles.shortcutIconText}>{link.icon}</Text>
                  </View>
                  <Text style={styles.shortcutText}>{link.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    return (
      <WebView
        ref={(ref) => (webViewRefs.current[tab.id] = ref)}
        source={{ uri: tab.url }}
        style={[styles.webview, containerStyle]}
        onNavigationStateChange={(navState) => handleNavigationStateChange(navState, tab.id)}
        onLoadStart={() => setIsLoading((prev) => ({ ...prev, [tab.id]: true }))}
        onLoadEnd={() => setIsLoading((prev) => ({ ...prev, [tab.id]: false }))}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    );
  };

  const renderTabBar = () => (
    <ScrollView
      horizontal
      style={styles.tabBar}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabBarContent}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            tab.id === activeTabId && styles.activeTab,
            tab.id === splitTabId && styles.splitTab,
          ]}
          onPress={() => switchTab(tab.id)}
          onLongPress={() => toggleSplitScreen(tab.id)}
        >
          <Text style={styles.tabTitle} numberOfLines={1}>
            {tab.title || 'New Tab'}
          </Text>
          <TouchableOpacity
            style={styles.tabClose}
            onPress={() => closeTab(tab.id)}
          >
            <Text style={styles.tabCloseText}>×</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.addTabButton} onPress={() => addTab()}>
        <Text style={styles.addTabText}>+</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, settings.theme === 'dark' && styles.containerDark]}>
      {/* Tab Bar */}
      {renderTabBar()}

      {/* URL Bar */}
      <View style={styles.urlBar}>
        <TouchableOpacity
          style={[styles.navButton, !canGoBack[activeTabId] && styles.navButtonDisabled]}
          onPress={() => handleGoBack()}
          disabled={!canGoBack[activeTabId]}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, !canGoForward[activeTabId] && styles.navButtonDisabled]}
          onPress={() => handleGoForward()}
          disabled={!canGoForward[activeTabId]}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => handleRefresh()}>
          <Text style={styles.navButtonText}>⟳</Text>
        </TouchableOpacity>

        <View style={styles.urlInputContainer}>
          <TextInput
            style={styles.urlInput}
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="Enter URL or search..."
            placeholderTextColor="#999"
            onSubmitEditing={handleNavigationSubmit}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            selectTextOnFocus
          />
          {isLoading[activeTabId] && (
            <View style={styles.loadingIndicator}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.navButton} onPress={() => setShowBookmarks(true)}>
          <Text style={styles.navButtonText}>★</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => toggleSplitScreen()}>
          <Text style={styles.navButtonText}>⧉</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => setShowMenu(true)}>
          <Text style={styles.navButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Split Screen Indicator */}
      {splitScreen && (
        <View style={styles.splitIndicator}>
          <Text style={styles.splitIndicatorText}>
            Split View: Long-press any tab to change
          </Text>
          <TouchableOpacity onPress={() => toggleSplitScreen()}>
            <Text style={styles.exitSplitText}>Exit Split</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView Container */}
      <View style={styles.webviewContainer}>
        {splitScreen ? (
          <View style={styles.splitContainer}>
            <View style={styles.splitPane}>
              {activeTab && renderWebView(activeTab, styles.splitWebview)}
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitPane}>
              {splitTab && renderWebView(splitTab, styles.splitWebview)}
            </View>
          </View>
        ) : (
          activeTab && renderWebView(activeTab, styles.fullWebview)
        )}
      </View>

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { addTab(); setShowMenu(false); }}>
              <Text style={styles.menuItemText}>➕ New Tab</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleAddBookmark}>
              <Text style={styles.menuItemText}>★ Add Bookmark</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleAddShortcut}>
              <Text style={styles.menuItemText}>🏠 Add to Homepage</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowHistory(true); setShowMenu(false); }}>
              <Text style={styles.menuItemText}>📜 History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowBookmarks(true); setShowMenu(false); }}>
              <Text style={styles.menuItemText}>★ Bookmarks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('Downloads'); setShowMenu(false); }}>
              <Text style={styles.menuItemText}>⬇️ Downloads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('Settings'); setShowMenu(false); }}>
              <Text style={styles.menuItemText}>⚙️ Settings</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistory} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>History</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.historyItem}
                onPress={() => {
                  navigateTo(item.url);
                  setShowHistory(false);
                }}
              >
                <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.historyUrl} numberOfLines={1}>{item.url}</Text>
                <Text style={styles.historyTime}>
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No history yet</Text>
            }
          />
        </View>
      </Modal>

      {/* Bookmarks Modal */}
      <Modal visible={showBookmarks} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bookmarks</Text>
            <TouchableOpacity onPress={() => setShowBookmarks(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={bookmarks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.bookmarkItem}>
                <TouchableOpacity
                  style={styles.bookmarkContent}
                  onPress={() => {
                    navigateTo(item.url);
                    setShowBookmarks(false);
                  }}
                >
                  <Text style={styles.bookmarkTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.bookmarkUrl} numberOfLines={1}>{item.url}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeBookmark(item.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No bookmarks yet</Text>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  tabBar: {
    backgroundColor: '#f5f5f5',
    maxHeight: 45,
  },
  tabBarContent: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxWidth: 200,
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  splitTab: {
    borderWidth: 2,
    borderColor: '#4a90d9',
    borderBottomWidth: 0,
  },
  tabTitle: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    marginRight: 8,
  },
  tabClose: {
    padding: 4,
  },
  tabCloseText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  addTabButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTabText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  navButton: {
    padding: 10,
    marginHorizontal: 2,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 22,
    color: '#333',
  },
  urlInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  urlInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  loadingIndicator: {
    paddingHorizontal: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#4a90d9',
  },
  splitIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4a90d9',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  splitIndicatorText: {
    color: '#fff',
    fontSize: 12,
  },
  exitSplitText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  webviewContainer: {
    flex: 1,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  splitPane: {
    flex: 1,
  },
  splitDivider: {
    width: 4,
    backgroundColor: '#4a90d9',
  },
  webview: {
    flex: 1,
  },
  fullWebview: {
    flex: 1,
  },
  splitWebview: {
    flex: 1,
  },
  homepage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f7fa',
  },
  homepageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  homepageSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 32,
  },
  shortcutsContainer: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 24,
  },
  shortcutsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 12,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  shortcutItem: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shortcutIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shortcutIconText: {
    fontSize: 24,
  },
  shortcutText: {
    fontSize: 12,
    color: '#34495e',
    textAlign: 'center',
  },
  quickLinksContainer: {
    width: '100%',
    maxWidth: 600,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    margin: 16,
    marginTop: 100,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#4a90d9',
  },
  historyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  historyUrl: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  bookmarkUrl: {
    fontSize: 13,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    padding: 40,
    color: '#999',
    fontSize: 16,
  },
});

export default BrowserScreen;
