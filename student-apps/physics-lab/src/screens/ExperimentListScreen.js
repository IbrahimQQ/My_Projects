import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { physicsExperiments } from '../data/experiments';

const ExperimentListScreen = ({ route, navigation }) => {
  const { categoryId } = route.params || {};
  const {
    getExperimentsByCategory,
    getAllExperiments,
    isExperimentCompleted,
    getExperimentCompletion,
    favorites,
  } = useApp();

  const [filter, setFilter] = useState('all'); // all, completed, incomplete, favorites
  const [sortBy, setSortBy] = useState('default'); // default, difficulty, duration, name

  const category = categoryId ? physicsExperiments[categoryId] : null;
  const allExperiments = categoryId ? getExperimentsByCategory(categoryId) : getAllExperiments();

  const filteredExperiments = useMemo(() => {
    let filtered = [...allExperiments];

    // Apply filter
    switch (filter) {
      case 'completed':
        filtered = filtered.filter(exp => isExperimentCompleted(exp.id));
        break;
      case 'incomplete':
        filtered = filtered.filter(exp => !isExperimentCompleted(exp.id));
        break;
      case 'favorites':
        filtered = filtered.filter(exp => favorites.includes(exp.id));
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'difficulty':
        const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        filtered.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);
        break;
      case 'duration':
        filtered.sort((a, b) => a.duration - b.duration);
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return filtered;
  }, [allExperiments, filter, sortBy, favorites]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#27ae60';
      case 'intermediate': return '#f39c12';
      case 'advanced': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const renderExperiment = ({ item: exp }) => {
    const completed = isExperimentCompleted(exp.id);
    const completion = getExperimentCompletion(exp.id);
    const isFavorite = favorites.includes(exp.id);

    return (
      <TouchableOpacity
        style={styles.experimentCard}
        onPress={() => navigation.navigate('ExperimentDetail', { experimentId: exp.id })}
      >
        <View style={styles.experimentHeader}>
          <View style={[styles.experimentIcon, { backgroundColor: (exp.categoryColor || '#3498db') + '20' }]}>
            <Text style={styles.experimentIconText}>{exp.categoryIcon || '🔬'}</Text>
          </View>
          <View style={styles.experimentInfo}>
            <Text style={styles.experimentTitle}>{exp.title}</Text>
            {!categoryId && (
              <Text style={styles.experimentCategory}>{exp.categoryTitle}</Text>
            )}
          </View>
          {isFavorite && <Text style={styles.favoriteIcon}>❤️</Text>}
          {completed && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedIcon}>✓</Text>
            </View>
          )}
        </View>

        <Text style={styles.experimentDescription} numberOfLines={2}>
          {exp.description}
        </Text>

        <View style={styles.experimentMeta}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exp.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(exp.difficulty) }]}>
              {exp.difficulty}
            </Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationIcon}>⏱️</Text>
            <Text style={styles.durationText}>{exp.duration} min</Text>
          </View>
          {completion && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>Best: {completion.bestScore}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: category?.color || '#3498db' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>
            {category?.title || 'All Experiments'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {filteredExperiments.length} experiments
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>{category?.icon || '📚'}</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All' },
            { key: 'incomplete', label: 'To Do' },
            { key: 'completed', label: 'Completed' },
            { key: 'favorites', label: 'Favorites' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'default', label: 'Default' },
            { key: 'name', label: 'Name' },
            { key: 'difficulty', label: 'Difficulty' },
            { key: 'duration', label: 'Duration' },
          ].map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortChip, sortBy === s.key && styles.sortChipActive]}
              onPress={() => setSortBy(s.key)}
            >
              <Text style={[styles.sortChipText, sortBy === s.key && styles.sortChipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Experiments List */}
      <FlatList
        data={filteredExperiments}
        renderItem={renderExperiment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No experiments found</Text>
            <Text style={styles.emptySubtext}>Try changing your filters</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerIcon: {
    marginLeft: 'auto',
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 24,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterChipText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sortLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 12,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: '#e8f4fd',
  },
  sortChipText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  sortChipTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  experimentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  experimentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  experimentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  experimentIconText: {
    fontSize: 20,
  },
  experimentInfo: {
    flex: 1,
  },
  experimentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  experimentCategory: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  favoriteIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d4edda',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    fontSize: 14,
    color: '#155724',
    fontWeight: 'bold',
  },
  experimentDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 12,
  },
  experimentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  durationIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  durationText: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  scoreBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 11,
    color: '#27ae60',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
});

export default ExperimentListScreen;
