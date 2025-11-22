import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Offline dictionary database (sample entries)
const dictionaryDB = {
  // Common words
  'algorithm': {
    word: 'Algorithm',
    pronunciation: '/ˈælɡərɪðəm/',
    partOfSpeech: 'noun',
    definitions: [
      'A process or set of rules to be followed in calculations or other problem-solving operations, especially by a computer.',
    ],
    examples: [
      'The algorithm efficiently sorts the data in ascending order.',
      'Search engines use complex algorithms to rank web pages.',
    ],
  },
  'variable': {
    word: 'Variable',
    pronunciation: '/ˈveəriəbl/',
    partOfSpeech: 'noun',
    definitions: [
      'A symbol that represents an unknown value in mathematics.',
      'An element, feature, or factor that is liable to vary or change.',
    ],
    examples: [
      'In the equation x + 5 = 10, x is the variable.',
      'Temperature is a variable that affects plant growth.',
    ],
  },
  'photosynthesis': {
    word: 'Photosynthesis',
    pronunciation: '/ˌfəʊtəʊˈsɪnθəsɪs/',
    partOfSpeech: 'noun',
    definitions: [
      'The process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.',
    ],
    examples: [
      'Photosynthesis is essential for producing oxygen in our atmosphere.',
      'Chlorophyll plays a crucial role in photosynthesis.',
    ],
  },
  'atom': {
    word: 'Atom',
    pronunciation: '/ˈætəm/',
    partOfSpeech: 'noun',
    definitions: [
      'The smallest unit of a chemical element that retains its chemical properties.',
      'An extremely small amount of a thing or quality.',
    ],
    examples: [
      'An atom consists of protons, neutrons, and electrons.',
      'Water molecules are made up of hydrogen and oxygen atoms.',
    ],
  },
  'equation': {
    word: 'Equation',
    pronunciation: '/ɪˈkweɪʒən/',
    partOfSpeech: 'noun',
    definitions: [
      'A statement that the values of two mathematical expressions are equal.',
      'A situation or problem in which several factors must be considered.',
    ],
    examples: [
      'The equation 2x + 3 = 7 can be solved to find x = 2.',
      'Balancing work and family is a difficult equation.',
    ],
  },
  'hypothesis': {
    word: 'Hypothesis',
    pronunciation: '/haɪˈpɒθəsɪs/',
    partOfSpeech: 'noun',
    definitions: [
      'A supposition or proposed explanation made on the basis of limited evidence as a starting point for further investigation.',
    ],
    examples: [
      'The scientist formed a hypothesis about the experiment results.',
      'Our hypothesis was proven correct through rigorous testing.',
    ],
  },
  'velocity': {
    word: 'Velocity',
    pronunciation: '/vəˈlɒsɪti/',
    partOfSpeech: 'noun',
    definitions: [
      'The speed of something in a given direction.',
      'The rate at which money changes hands in an economy.',
    ],
    examples: [
      'The velocity of the car was 60 km/h heading north.',
      'Light travels at a constant velocity in a vacuum.',
    ],
  },
  'democracy': {
    word: 'Democracy',
    pronunciation: '/dɪˈmɒkrəsi/',
    partOfSpeech: 'noun',
    definitions: [
      'A system of government by the whole population, typically through elected representatives.',
      'Control of an organization by the majority of its members.',
    ],
    examples: [
      'Ancient Athens is considered the birthplace of democracy.',
      'The country transitioned to democracy after years of dictatorship.',
    ],
  },
  'metabolism': {
    word: 'Metabolism',
    pronunciation: '/məˈtæbəlɪzəm/',
    partOfSpeech: 'noun',
    definitions: [
      'The chemical processes that occur within a living organism in order to maintain life.',
    ],
    examples: [
      'Exercise can help boost your metabolism.',
      'Metabolism slows down as we age.',
    ],
  },
  'theorem': {
    word: 'Theorem',
    pronunciation: '/ˈθɪərəm/',
    partOfSpeech: 'noun',
    definitions: [
      'A general proposition not self-evident but proved by a chain of reasoning; a truth established by means of accepted truths.',
    ],
    examples: [
      'The Pythagorean theorem relates the sides of a right triangle.',
      'Mathematicians spent years proving the theorem.',
    ],
  },
};

const Dictionary = ({ visible, onClose }) => {
  const { dictionaryPosition, setDictionaryPosition, trackToolUsage } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [opacity, setOpacity] = useState(1);

  const pan = useRef(new Animated.ValueXY({ x: dictionaryPosition.x, y: dictionaryPosition.y })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setDictionaryPosition({ x: pan.x._value, y: pan.y._value });
      },
    })
  ).current;

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;

    trackToolUsage('dictionary', `search: ${query}`);

    if (dictionaryDB[query]) {
      setResult(dictionaryDB[query]);
      if (!searchHistory.includes(query)) {
        setSearchHistory([query, ...searchHistory.slice(0, 9)]);
      }
    } else {
      setResult({
        word: searchQuery,
        notFound: true,
        suggestions: Object.keys(dictionaryDB)
          .filter((word) => word.includes(query) || query.includes(word.substring(0, 3)))
          .slice(0, 5),
      });
    }
  };

  const handleQuickSearch = (word) => {
    setSearchQuery(word);
    if (dictionaryDB[word.toLowerCase()]) {
      setResult(dictionaryDB[word.toLowerCase()]);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleOpacity = () => {
    setOpacity(opacity === 1 ? 0.85 : 1);
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        isMinimized && styles.containerMinimized,
        { transform: pan.getTranslateTransform(), opacity },
      ]}
    >
      {/* Drag Handle */}
      <View {...panResponder.panHandlers} style={styles.dragHandle}>
        <View style={styles.handleBar} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📖 Dictionary</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleOpacity}>
            <Text style={styles.headerBtnText}>{opacity === 1 ? '◐' : '●'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleMinimize}>
            <Text style={styles.headerBtnText}>{isMinimized ? '▢' : '−'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Text style={styles.headerBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isMinimized && (
        <>
          {/* Search Box */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter a word..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {result ? (
              result.notFound ? (
                <View style={styles.notFound}>
                  <Text style={styles.notFoundText}>
                    Word "{result.word}" not found in offline dictionary.
                  </Text>
                  {result.suggestions.length > 0 && (
                    <View style={styles.suggestions}>
                      <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                      {result.suggestions.map((word, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleQuickSearch(word)}
                        >
                          <Text style={styles.suggestionWord}>{word}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.resultContainer}>
                  <Text style={styles.word}>{result.word}</Text>
                  <Text style={styles.pronunciation}>{result.pronunciation}</Text>
                  <Text style={styles.partOfSpeech}>{result.partOfSpeech}</Text>

                  <View style={styles.definitionsSection}>
                    <Text style={styles.sectionTitle}>Definitions:</Text>
                    {result.definitions.map((def, index) => (
                      <Text key={index} style={styles.definition}>
                        {index + 1}. {def}
                      </Text>
                    ))}
                  </View>

                  {result.examples && result.examples.length > 0 && (
                    <View style={styles.examplesSection}>
                      <Text style={styles.sectionTitle}>Examples:</Text>
                      {result.examples.map((example, index) => (
                        <Text key={index} style={styles.example}>
                          • "{example}"
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                  Search for a word to see its definition
                </Text>
                {searchHistory.length > 0 && (
                  <View style={styles.historySection}>
                    <Text style={styles.historySectionTitle}>Recent Searches:</Text>
                    <View style={styles.historyList}>
                      {searchHistory.map((word, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.historyItem}
                          onPress={() => handleQuickSearch(word)}
                        >
                          <Text style={styles.historyWord}>{word}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                <View style={styles.quickWords}>
                  <Text style={styles.quickWordsTitle}>Quick Lookup:</Text>
                  <View style={styles.quickWordsList}>
                    {['algorithm', 'photosynthesis', 'velocity', 'theorem'].map((word) => (
                      <TouchableOpacity
                        key={word}
                        style={styles.quickWord}
                        onPress={() => handleQuickSearch(word)}
                      >
                        <Text style={styles.quickWordText}>{word}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 350,
    maxHeight: 450,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 1000,
  },
  containerMinimized: {
    maxHeight: 50,
  },
  dragHandle: {
    height: 24,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#c0c8d0',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#4a90d9',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerBtn: {
    padding: 8,
    marginLeft: 4,
  },
  headerBtnText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#4a90d9',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  resultContainer: {
    flex: 1,
  },
  word: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  pronunciation: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  partOfSpeech: {
    fontSize: 13,
    color: '#4a90d9',
    fontWeight: '500',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  definitionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
  },
  definition: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 8,
  },
  examplesSection: {
    marginBottom: 16,
  },
  example: {
    fontSize: 13,
    color: '#718096',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 8,
  },
  notFound: {
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 16,
  },
  suggestions: {
    alignItems: 'center',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
  },
  suggestionWord: {
    fontSize: 14,
    color: '#4a90d9',
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  historySection: {
    width: '100%',
    marginBottom: 20,
  },
  historySectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  historyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  historyItem: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  historyWord: {
    fontSize: 13,
    color: '#4a90d9',
  },
  quickWords: {
    width: '100%',
  },
  quickWordsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  quickWordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickWord: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  quickWordText: {
    fontSize: 13,
    color: '#2980b9',
  },
});

export default Dictionary;
