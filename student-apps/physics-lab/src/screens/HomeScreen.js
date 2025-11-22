import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const {
    user,
    settings,
    getCategories,
    getStatistics,
    getRecentExperiments,
    getRecommendedExperiments,
    searchExperiments,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const categories = getCategories();
  const stats = getStatistics();
  const recentExperiments = getRecentExperiments(4);
  const recommended = getRecommendedExperiments();

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      const results = searchExperiments(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const getBadgeInfo = (badge) => {
    const badges = {
      first_experiment: { icon: '🎯', name: 'First Experiment' },
      lab_explorer: { icon: '🔬', name: 'Lab Explorer' },
      lab_scientist: { icon: '👨‍🔬', name: 'Lab Scientist' },
      perfectionist: { icon: '💯', name: 'Perfectionist' },
      category_master: { icon: '🏅', name: 'Category Master' },
      physics_guru: { icon: '🧙‍♂️', name: 'Physics Guru' },
    };
    return badges[badge] || { icon: '🏆', name: badge };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, {user?.name || 'Student'}!</Text>
          <Text style={styles.subGreeting}>Physics Virtual Laboratory</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search experiments..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.searchResults}>
          {searchResults.slice(0, 5).map((exp) => (
            <TouchableOpacity
              key={exp.id}
              style={styles.searchResultItem}
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                navigation.navigate('ExperimentDetail', { experimentId: exp.id });
              }}
            >
              <Text style={styles.searchResultTitle}>{exp.title}</Text>
              <Text style={styles.searchResultCategory}>{exp.categoryTitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🧪</Text>
          <Text style={styles.statValue}>{stats.uniqueCompleted}/{stats.totalExperiments}</Text>
          <Text style={styles.statLabel}>Experiments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statValue}>{stats.avgScore}%</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🎖️</Text>
          <Text style={styles.statValue}>{stats.badges.length}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Overall Progress</Text>
          <Text style={styles.progressPercent}>{stats.completionRate}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${stats.completionRate}%` }]} />
        </View>
        <Text style={styles.progressSubtext}>
          {stats.uniqueCompleted} of {stats.totalExperiments} experiments completed
        </Text>
      </View>

      {/* Badges Section */}
      {stats.badges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Badges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {stats.badges.map((badge) => {
              const info = getBadgeInfo(badge);
              return (
                <View key={badge} style={styles.badgeCard}>
                  <Text style={styles.badgeIcon}>{info.icon}</Text>
                  <Text style={styles.badgeName}>{info.name}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { borderTopColor: category.color }]}
              onPress={() => navigation.navigate('ExperimentList', { categoryId: category.id })}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryCount}>
                {category.completedCount}/{category.experimentCount} done
              </Text>
              <View style={styles.categoryProgress}>
                <View
                  style={[
                    styles.categoryProgressBar,
                    {
                      width: `${(category.completedCount / category.experimentCount) * 100}%`,
                      backgroundColor: category.color,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Experiments */}
      {recentExperiments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Experiments</Text>
          {recentExperiments.map((exp) => (
            <TouchableOpacity
              key={exp.id}
              style={styles.recentCard}
              onPress={() => navigation.navigate('ExperimentDetail', { experimentId: exp.id })}
            >
              <View style={[styles.recentIcon, { backgroundColor: exp.categoryColor + '20' }]}>
                <Text>{exp.categoryIcon}</Text>
              </View>
              <View style={styles.recentContent}>
                <Text style={styles.recentTitle}>{exp.title}</Text>
                <Text style={styles.recentCategory}>{exp.categoryTitle}</Text>
              </View>
              <View style={styles.recentScore}>
                <Text style={styles.recentScoreText}>{exp.lastScore}%</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recommended */}
      {recommended.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recommended.map((exp) => (
              <TouchableOpacity
                key={exp.id}
                style={styles.recommendedCard}
                onPress={() => navigation.navigate('ExperimentDetail', { experimentId: exp.id })}
              >
                <View style={[styles.recommendedIconBg, { backgroundColor: exp.categoryColor + '20' }]}>
                  <Text style={styles.recommendedIcon}>{exp.categoryIcon}</Text>
                </View>
                <Text style={styles.recommendedTitle} numberOfLines={2}>{exp.title}</Text>
                <Text style={styles.recommendedDifficulty}>{exp.difficulty}</Text>
                <Text style={styles.recommendedDuration}>{exp.duration} min</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Start */}
      <View style={styles.quickStart}>
        <TouchableOpacity
          style={styles.quickStartButton}
          onPress={() => {
            if (recommended.length > 0) {
              navigation.navigate('ExperimentDetail', { experimentId: recommended[0].id });
            }
          }}
        >
          <Text style={styles.quickStartIcon}>🚀</Text>
          <Text style={styles.quickStartText}>Quick Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickStartButton}
          onPress={() => navigation.navigate('Categories')}
        >
          <Text style={styles.quickStartIcon}>📚</Text>
          <Text style={styles.quickStartText}>Browse All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#3498db',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  settingsButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  settingsIcon: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  clearIcon: {
    fontSize: 16,
    color: '#999',
    padding: 4,
  },
  searchResults: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  searchResultCategory: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 5,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  badgeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 6,
    borderTopWidth: 4,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoryCount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  categoryProgress: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  categoryProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  recentCategory: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  recentScore: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recentScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
  },
  recommendedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 160,
  },
  recommendedIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendedIcon: {
    fontSize: 24,
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  recommendedDifficulty: {
    fontSize: 11,
    color: '#7f8c8d',
    textTransform: 'capitalize',
  },
  recommendedDuration: {
    fontSize: 11,
    color: '#3498db',
    marginTop: 2,
  },
  quickStart: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickStartButton: {
    flex: 1,
    backgroundColor: '#3498db',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickStartIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickStartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default HomeScreen;
