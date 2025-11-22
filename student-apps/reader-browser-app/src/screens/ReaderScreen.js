import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sample document structure for demonstration
const sampleSubjects = [
  {
    id: '1',
    name: 'Mathematics',
    icon: '📐',
    topics: [
      { id: '1-1', title: 'Algebra Basics', content: '<h1>Algebra Basics</h1><p>Algebra is a branch of mathematics dealing with symbols and the rules for manipulating those symbols.</p><h2>Variables</h2><p>A variable is a symbol that represents an unknown value.</p>' },
      { id: '1-2', title: 'Linear Equations', content: '<h1>Linear Equations</h1><p>A linear equation is an equation between two variables that gives a straight line when plotted on a graph.</p>' },
      { id: '1-3', title: 'Quadratic Equations', content: '<h1>Quadratic Equations</h1><p>A quadratic equation is an equation of the second degree, meaning it contains at least one term that is squared.</p>' },
    ],
  },
  {
    id: '2',
    name: 'Physics',
    icon: '⚛️',
    topics: [
      { id: '2-1', title: 'Motion & Forces', content: '<h1>Motion & Forces</h1><p>Motion is the change in position of an object over time. Force is a push or pull on an object.</p>' },
      { id: '2-2', title: 'Energy & Work', content: '<h1>Energy & Work</h1><p>Energy is the capacity to do work. Work is done when a force moves an object.</p>' },
    ],
  },
  {
    id: '3',
    name: 'Chemistry',
    icon: '🧪',
    topics: [
      { id: '3-1', title: 'Atomic Structure', content: '<h1>Atomic Structure</h1><p>Atoms are the basic units of matter and consist of protons, neutrons, and electrons.</p>' },
      { id: '3-2', title: 'Chemical Bonds', content: '<h1>Chemical Bonds</h1><p>Chemical bonds hold atoms together in molecules and compounds.</p>' },
    ],
  },
  {
    id: '4',
    name: 'Biology',
    icon: '🧬',
    topics: [
      { id: '4-1', title: 'Cell Structure', content: '<h1>Cell Structure</h1><p>Cells are the basic building blocks of all living organisms.</p>' },
      { id: '4-2', title: 'Genetics', content: '<h1>Genetics</h1><p>Genetics is the study of genes, genetic variation, and heredity in organisms.</p>' },
    ],
  },
  {
    id: '5',
    name: 'English',
    icon: '📝',
    topics: [
      { id: '5-1', title: 'Grammar Basics', content: '<h1>Grammar Basics</h1><p>Grammar is the set of rules that govern the composition of words, phrases, and clauses in a language.</p>' },
      { id: '5-2', title: 'Essay Writing', content: '<h1>Essay Writing</h1><p>An essay is a short piece of writing on a particular subject.</p>' },
    ],
  },
];

const ReaderScreen = ({ navigation }) => {
  const {
    settings,
    updateSettings,
    documents,
    addDocument,
    currentDocument,
    setCurrentDocument,
    addHighlight,
    highlights,
    trackActivity,
    startSession,
    endSession,
    currentSession,
  } = useApp();

  const [subjects] = useState(sampleSubjects);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [fontSize, setFontSize] = useState(settings.fontSize || 16);
  const [viewMode, setViewMode] = useState(settings.viewMode || 'continuous');
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');
  const scrollViewRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [localDocuments, setLocalDocuments] = useState([]);

  useEffect(() => {
    if (selectedTopic && selectedSubject) {
      // Start reading session
      startSession({
        documentTitle: selectedTopic.title,
        subject: selectedSubject.name,
        topic: selectedTopic.title,
        type: 'reading',
      });

      trackActivity('document_open', {
        title: selectedTopic.title,
        subject: selectedSubject.name,
        topic: selectedTopic.title,
      });
    }

    return () => {
      if (currentSession) {
        endSession();
      }
    };
  }, [selectedTopic]);

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setShowTableOfContents(false);
  };

  const handleNextTopic = () => {
    if (!selectedSubject || !selectedTopic) return;
    const currentIndex = selectedSubject.topics.findIndex((t) => t.id === selectedTopic.id);
    if (currentIndex < selectedSubject.topics.length - 1) {
      handleSelectTopic(selectedSubject.topics[currentIndex + 1]);
    }
  };

  const handlePrevTopic = () => {
    if (!selectedSubject || !selectedTopic) return;
    const currentIndex = selectedSubject.topics.findIndex((t) => t.id === selectedTopic.id);
    if (currentIndex > 0) {
      handleSelectTopic(selectedSubject.topics[currentIndex - 1]);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    subjects.forEach((subject) => {
      subject.topics.forEach((topic) => {
        if (
          topic.title.toLowerCase().includes(query.toLowerCase()) ||
          topic.content.toLowerCase().includes(query.toLowerCase())
        ) {
          results.push({
            ...topic,
            subjectName: subject.name,
            subjectId: subject.id,
          });
        }
      });
    });
    setSearchResults(results);
  };

  const handleFontSizeChange = (delta) => {
    const newSize = Math.min(Math.max(fontSize + delta, 12), 28);
    setFontSize(newSize);
    updateSettings({ fontSize: newSize });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    updateSettings({ theme: darkMode ? 'light' : 'dark' });
  };

  const handleImportDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/html', 'text/plain', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);

      const newDoc = {
        name: file.name,
        uri: file.uri,
        type: file.mimeType,
        content: content,
        size: file.size,
      };

      await addDocument(newDoc);
      setLocalDocuments([...localDocuments, newDoc]);
      Alert.alert('Success', 'Document imported successfully!');
    } catch (error) {
      console.error('Error importing document:', error);
      Alert.alert('Error', 'Failed to import document');
    }
  };

  const getHtmlContent = () => {
    if (!selectedTopic) return '';

    const bgColor = darkMode ? '#1a1a1a' : '#fff';
    const textColor = darkMode ? '#e0e0e0' : '#333';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: ${fontSize}px;
            line-height: 1.8;
            color: ${textColor};
            background-color: ${bgColor};
            padding: 20px;
            margin: 0;
          }
          h1 { font-size: 1.8em; color: ${darkMode ? '#fff' : '#2c3e50'}; margin-bottom: 16px; }
          h2 { font-size: 1.4em; color: ${darkMode ? '#e0e0e0' : '#34495e'}; margin-top: 24px; }
          h3 { font-size: 1.2em; color: ${darkMode ? '#ccc' : '#4a5568'}; }
          p { margin-bottom: 16px; text-align: justify; }
          ul, ol { margin-bottom: 16px; padding-left: 24px; }
          li { margin-bottom: 8px; }
          code {
            background: ${darkMode ? '#333' : '#f4f4f4'};
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
          }
          pre {
            background: ${darkMode ? '#333' : '#f4f4f4'};
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
          }
          blockquote {
            border-left: 4px solid #4a90d9;
            margin: 16px 0;
            padding: 12px 20px;
            background: ${darkMode ? '#222' : '#f8f9fa'};
          }
          img { max-width: 100%; height: auto; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid ${darkMode ? '#444' : '#ddd'}; padding: 12px; text-align: left; }
          th { background: ${darkMode ? '#333' : '#f4f4f4'}; }
          .highlight { background-color: #fff59d; padding: 2px 4px; }
        </style>
      </head>
      <body>
        ${selectedTopic.content}
      </body>
      </html>
    `;
  };

  const renderBreadcrumb = () => (
    <View style={styles.breadcrumb}>
      <TouchableOpacity onPress={() => { setSelectedSubject(null); setSelectedTopic(null); }}>
        <Text style={[styles.breadcrumbText, styles.breadcrumbLink]}>Subjects</Text>
      </TouchableOpacity>
      {selectedSubject && (
        <>
          <Text style={styles.breadcrumbSeparator}> › </Text>
          <TouchableOpacity onPress={() => setSelectedTopic(null)}>
            <Text style={[styles.breadcrumbText, styles.breadcrumbLink]}>
              {selectedSubject.name}
            </Text>
          </TouchableOpacity>
        </>
      )}
      {selectedTopic && (
        <>
          <Text style={styles.breadcrumbSeparator}> › </Text>
          <Text style={styles.breadcrumbText}>{selectedTopic.title}</Text>
        </>
      )}
    </View>
  );

  const renderSubjectList = () => (
    <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
      <Text style={styles.sectionTitle}>Select a Subject</Text>
      <View style={styles.subjectsGrid}>
        {subjects.map((subject) => (
          <TouchableOpacity
            key={subject.id}
            style={styles.subjectCard}
            onPress={() => handleSelectSubject(subject)}
          >
            <Text style={styles.subjectIcon}>{subject.icon}</Text>
            <Text style={styles.subjectName}>{subject.name}</Text>
            <Text style={styles.topicCount}>{subject.topics.length} topics</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.importSection}>
        <Text style={styles.sectionTitle}>Import Documents</Text>
        <TouchableOpacity style={styles.importButton} onPress={handleImportDocument}>
          <Text style={styles.importButtonText}>📄 Import Document</Text>
        </TouchableOpacity>
        {localDocuments.length > 0 && (
          <View style={styles.localDocsList}>
            {localDocuments.map((doc, index) => (
              <TouchableOpacity key={index} style={styles.localDocItem}>
                <Text style={styles.localDocName}>{doc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderTopicList = () => (
    <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
      <View style={styles.subjectHeader}>
        <Text style={styles.subjectHeaderIcon}>{selectedSubject.icon}</Text>
        <Text style={styles.subjectHeaderTitle}>{selectedSubject.name}</Text>
      </View>
      <Text style={styles.sectionTitle}>Topics</Text>
      {selectedSubject.topics.map((topic, index) => (
        <TouchableOpacity
          key={topic.id}
          style={styles.topicItem}
          onPress={() => handleSelectTopic(topic)}
        >
          <View style={styles.topicNumber}>
            <Text style={styles.topicNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.topicArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderReader = () => (
    <View style={[styles.readerContainer, darkMode && styles.readerContainerDark]}>
      {/* Reader Toolbar */}
      <View style={[styles.readerToolbar, darkMode && styles.readerToolbarDark]}>
        <TouchableOpacity style={styles.toolbarButton} onPress={() => setShowTableOfContents(true)}>
          <Text style={styles.toolbarButtonText}>📑</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={() => setShowSearch(true)}>
          <Text style={styles.toolbarButtonText}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={() => handleFontSizeChange(-2)}>
          <Text style={styles.toolbarButtonText}>A-</Text>
        </TouchableOpacity>
        <Text style={styles.fontSizeDisplay}>{fontSize}px</Text>
        <TouchableOpacity style={styles.toolbarButton} onPress={() => handleFontSizeChange(2)}>
          <Text style={styles.toolbarButtonText}>A+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={toggleDarkMode}>
          <Text style={styles.toolbarButtonText}>{darkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={() => setShowSettings(true)}>
          <Text style={styles.toolbarButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <WebView
        source={{ html: getHtmlContent() }}
        style={styles.webviewReader}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          setScrollPosition(contentOffset.y);
          setContentHeight(contentSize.height - layoutMeasurement.height);
        }}
      />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${contentHeight > 0 ? (scrollPosition / contentHeight) * 100 : 0}%` }
          ]}
        />
      </View>

      {/* Navigation Footer */}
      <View style={[styles.readerFooter, darkMode && styles.readerFooterDark]}>
        <TouchableOpacity
          style={[styles.navFooterButton, { opacity: selectedSubject?.topics.findIndex(t => t.id === selectedTopic?.id) === 0 ? 0.5 : 1 }]}
          onPress={handlePrevTopic}
          disabled={selectedSubject?.topics.findIndex(t => t.id === selectedTopic?.id) === 0}
        >
          <Text style={styles.navFooterText}>‹ Previous</Text>
        </TouchableOpacity>
        <Text style={[styles.pageIndicator, darkMode && styles.pageIndicatorDark]}>
          {selectedSubject?.topics.findIndex(t => t.id === selectedTopic?.id) + 1} / {selectedSubject?.topics.length}
        </Text>
        <TouchableOpacity
          style={[styles.navFooterButton, { opacity: selectedSubject?.topics.findIndex(t => t.id === selectedTopic?.id) === selectedSubject?.topics.length - 1 ? 0.5 : 1 }]}
          onPress={handleNextTopic}
          disabled={selectedSubject?.topics.findIndex(t => t.id === selectedTopic?.id) === selectedSubject?.topics.length - 1}
        >
          <Text style={styles.navFooterText}>Next ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>Document Reader</Text>
        {renderBreadcrumb()}
      </View>

      {/* Content */}
      {!selectedSubject && renderSubjectList()}
      {selectedSubject && !selectedTopic && renderTopicList()}
      {selectedSubject && selectedTopic && renderReader()}

      {/* Table of Contents Modal */}
      <Modal visible={showTableOfContents} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Table of Contents</Text>
            <TouchableOpacity onPress={() => setShowTableOfContents(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={selectedSubject?.topics || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.tocItem,
                  item.id === selectedTopic?.id && styles.tocItemActive,
                ]}
                onPress={() => {
                  handleSelectTopic(item);
                  setShowTableOfContents(false);
                }}
              >
                <Text style={styles.tocNumber}>{index + 1}</Text>
                <Text style={[
                  styles.tocTitle,
                  item.id === selectedTopic?.id && styles.tocTitleActive,
                ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal visible={showSearch} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search documents..."
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => {
                  const subject = subjects.find(s => s.id === item.subjectId);
                  setSelectedSubject(subject);
                  handleSelectTopic(item);
                  setShowSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Text style={styles.searchResultSubject}>{item.subjectName}</Text>
                <Text style={styles.searchResultTitle}>{item.title}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.length > 0 ? (
                <Text style={styles.noResults}>No results found</Text>
              ) : null
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
    backgroundColor: '#f5f7fa',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerDark: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  headerTitleDark: {
    color: '#fff',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  breadcrumbLink: {
    color: '#4a90d9',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: '#bdc3c7',
    marginHorizontal: 4,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 16,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  subjectCard: {
    width: (SCREEN_WIDTH - 64) / 3,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  topicCount: {
    fontSize: 12,
    color: '#95a5a6',
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subjectHeaderIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  subjectHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topicNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4a90d9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  topicNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  topicTitle: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  topicArrow: {
    fontSize: 24,
    color: '#bdc3c7',
  },
  importSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  importButton: {
    backgroundColor: '#4a90d9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  localDocsList: {
    marginTop: 16,
  },
  localDocItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  localDocName: {
    fontSize: 14,
    color: '#333',
  },
  readerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  readerContainerDark: {
    backgroundColor: '#1a1a1a',
  },
  readerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  readerToolbarDark: {
    backgroundColor: '#2a2a2a',
    borderBottomColor: '#444',
  },
  toolbarButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  toolbarButtonText: {
    fontSize: 18,
  },
  fontSizeDisplay: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  webviewReader: {
    flex: 1,
  },
  progressContainer: {
    height: 3,
    backgroundColor: '#e0e0e0',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4a90d9',
  },
  readerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  readerFooterDark: {
    backgroundColor: '#2a2a2a',
    borderTopColor: '#444',
  },
  navFooterButton: {
    padding: 8,
  },
  navFooterText: {
    fontSize: 16,
    color: '#4a90d9',
    fontWeight: '600',
  },
  pageIndicator: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  pageIndicatorDark: {
    color: '#aaa',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 16,
    color: '#4a90d9',
  },
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tocItemActive: {
    backgroundColor: '#e3f2fd',
  },
  tocNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 28,
  },
  tocTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tocTitleActive: {
    color: '#4a90d9',
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 12,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultSubject: {
    fontSize: 12,
    color: '#4a90d9',
    marginBottom: 4,
  },
  searchResultTitle: {
    fontSize: 16,
    color: '#333',
  },
  noResults: {
    textAlign: 'center',
    padding: 40,
    color: '#999',
  },
});

export default ReaderScreen;
