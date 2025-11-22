import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { chemistryExperiments } from '../data/experiments';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CategoriesScreen = ({ navigation }) => {
  const { getCategories, getStatistics } = useApp();
  const categories = getCategories();
  const stats = getStatistics();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
        <View><Text style={styles.headerTitle}>Chemistry Categories</Text><Text style={styles.headerSubtitle}>{stats.uniqueCompleted} of {stats.totalExperiments} experiments</Text></View>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.overallCard}>
          <Text style={styles.overallTitle}>Overall Progress</Text>
          <View style={styles.overallStats}>
            <View style={styles.overallStat}><Text style={styles.overallStatValue}>{stats.completionRate}%</Text><Text style={styles.overallStatLabel}>Complete</Text></View>
            <View style={styles.overallStat}><Text style={styles.overallStatValue}>{stats.avgScore}%</Text><Text style={styles.overallStatLabel}>Avg Score</Text></View>
            <View style={styles.overallStat}><Text style={styles.overallStatValue}>{stats.totalAttempts}</Text><Text style={styles.overallStatLabel}>Attempts</Text></View>
          </View>
          <View style={styles.progressBarContainer}><View style={[styles.progressBar, { width: `${stats.completionRate}%` }]} /></View>
        </View>
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>All Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => {
              const categoryData = chemistryExperiments[category.id];
              const progress = category.experimentCount > 0 ? Math.round((category.completedCount / category.experimentCount) * 100) : 0;
              return (
                <TouchableOpacity key={category.id} style={[styles.categoryCard, { borderLeftColor: category.color }]} onPress={() => navigation.navigate('ExperimentList', { categoryId: category.id })}>
                  <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}><Text style={styles.categoryIcon}>{category.icon}</Text></View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDescription}>{categoryData?.experiments?.length || 0} experiments</Text>
                  <View style={styles.categoryProgressContainer}>
                    <View style={styles.categoryProgressBar}><View style={[styles.categoryProgressFill, { width: `${progress}%`, backgroundColor: category.color }]} /></View>
                    <Text style={styles.categoryProgressText}>{progress}%</Text>
                  </View>
                  <View style={styles.categoryMeta}><Text style={styles.categoryMetaText}>{category.completedCount}/{category.experimentCount} done</Text>{progress === 100 && <View style={styles.completeBadge}><Text style={styles.completeBadgeText}>✓</Text></View>}</View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: '#27ae60', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  backIcon: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  content: { flex: 1 },
  overallCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, elevation: 2 },
  overallTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 16 },
  overallStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  overallStat: { alignItems: 'center' },
  overallStatValue: { fontSize: 28, fontWeight: 'bold', color: '#27ae60' },
  overallStatLabel: { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  progressBarContainer: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#27ae60', borderRadius: 4 },
  categoriesSection: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50', marginBottom: 16 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  categoryCard: { width: (SCREEN_WIDTH - 48) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16, margin: 8, borderLeftWidth: 4, elevation: 2 },
  categoryIconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  categoryIcon: { fontSize: 24 },
  categoryTitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  categoryDescription: { fontSize: 12, color: '#7f8c8d', marginBottom: 12 },
  categoryProgressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  categoryProgressBar: { flex: 1, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden', marginRight: 8 },
  categoryProgressFill: { height: '100%', borderRadius: 3 },
  categoryProgressText: { fontSize: 12, fontWeight: '600', color: '#7f8c8d', minWidth: 35, textAlign: 'right' },
  categoryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryMetaText: { fontSize: 11, color: '#7f8c8d' },
  completeBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center' },
  completeBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

export default CategoriesScreen;
