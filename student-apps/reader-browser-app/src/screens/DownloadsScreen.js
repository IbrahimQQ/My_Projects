import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';

const DownloadsScreen = ({ navigation }) => {
  const { downloads, settings } = useApp();
  const darkMode = settings.theme === 'dark';

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleOpenFile = async (download) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(download.filePath);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'File not found');
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(download.filePath);
      } else {
        Alert.alert('Info', 'Cannot open file on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const handleShareFile = async (download) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(download.filePath);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const getFileIcon = (type) => {
    if (!type) return '📄';
    if (type.includes('pdf')) return '📕';
    if (type.includes('html')) return '🌐';
    if (type.includes('text')) return '📝';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎬';
    if (type.includes('audio')) return '🎵';
    return '📄';
  };

  const renderDownloadItem = ({ item }) => (
    <View style={[styles.downloadItem, darkMode && styles.downloadItemDark]}>
      <View style={styles.fileIconContainer}>
        <Text style={styles.fileIcon}>{getFileIcon(item.mimeType)}</Text>
      </View>
      <View style={styles.downloadInfo}>
        <Text
          style={[styles.downloadTitle, darkMode && styles.textDark]}
          numberOfLines={1}
        >
          {item.title || item.filename || 'Unknown file'}
        </Text>
        <Text
          style={[styles.downloadUrl, darkMode && styles.textLightDark]}
          numberOfLines={1}
        >
          {item.url || 'Local file'}
        </Text>
        <View style={styles.downloadMeta}>
          <Text style={[styles.downloadSize, darkMode && styles.textLightDark]}>
            {formatFileSize(item.size)}
          </Text>
          <Text style={[styles.downloadDate, darkMode && styles.textLightDark]}>
            {formatDate(item.downloadedAt)}
          </Text>
        </View>
      </View>
      <View style={styles.downloadActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleOpenFile(item)}
        >
          <Text style={styles.actionBtnText}>📂</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleShareFile(item)}
        >
          <Text style={styles.actionBtnText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <Text style={[styles.headerTitle, darkMode && styles.textDark]}>Downloads</Text>
        <Text style={[styles.headerSubtitle, darkMode && styles.textLightDark]}>
          {downloads.length} file{downloads.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={[styles.emptyText, darkMode && styles.textLightDark]}>
            No downloads yet
          </Text>
          <Text style={[styles.emptySubtext, darkMode && styles.textLightDark]}>
            Downloaded files will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          renderItem={renderDownloadItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerDark: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  textDark: {
    color: '#fff',
  },
  textLightDark: {
    color: '#aaa',
  },
  listContent: {
    padding: 16,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadItemDark: {
    backgroundColor: '#1e1e1e',
  },
  fileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileIcon: {
    fontSize: 24,
  },
  downloadInfo: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  downloadUrl: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  downloadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadSize: {
    fontSize: 12,
    color: '#95a5a6',
    marginRight: 16,
  },
  downloadDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  downloadActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 4,
  },
  actionBtnText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
});

export default DownloadsScreen;
