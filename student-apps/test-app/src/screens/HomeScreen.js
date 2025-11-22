import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const {
    user,
    proficiency,
    testSessions,
    achievements,
    getOverallProficiency,
    startTest,
    syncWithReaderApp,
  } = useApp();

  const overallProficiency = getOverallProficiency();
  const recentSessions = testSessions.slice(-5).reverse();

  const handleQuickTest = async () => {
    await startTest({ count: 20, mode: 'adaptive' });
    navigation.navigate('Test');
  };

  const handlePracticeMode = () => {
    navigation.navigate('Practice');
  };

  const handleSync = async () => {
    await syncWithReaderApp();
  };

  const getProficiencyColor = (level) => {
    if (level >= 80) return '#27ae60';
    if (level >= 60) return '#f39c12';
    if (level >= 40) return '#e67e22';
    return '#e74c3c';
  };

  const getProficiencyLabel = (level) => {
    if (level >= 80) return 'Excellent';
    if (level >= 60) return 'Good';
    if (level >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'Student'}!</Text>
          <Text style={styles.subGreeting}>{user?.classGrade || 'Welcome back'}</Text>
        </View>
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Text style={styles.syncButtonText}>🔄 Sync</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Proficiency Card */}
      <View style={styles.proficiencyCard}>
        <View style={styles.proficiencyHeader}>
          <Text style={styles.proficiencyTitle}>Overall Proficiency</Text>
          <Text style={[styles.proficiencyLabel, { color: getProficiencyColor(overallProficiency) }]}>
            {getProficiencyLabel(overallProficiency)}
          </Text>
        </View>
        <View style={styles.proficiencyBarContainer}>
          <View
            style={[
              styles.proficiencyBar,
              {
                width: `${overallProficiency}%`,
                backgroundColor: getProficiencyColor(overallProficiency),
              },
            ]}
          />
        </View>
        <Text style={styles.proficiencyValue}>{overallProficiency}%</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.primaryAction} onPress={handleQuickTest}>
          <Text style={styles.primaryActionIcon}>📝</Text>
          <Text style={styles.primaryActionTitle}>Start Quick Test</Text>
          <Text style={styles.primaryActionSubtitle}>20 adaptive questions</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryAction} onPress={handlePracticeMode}>
            <Text style={styles.secondaryActionIcon}>🎯</Text>
            <Text style={styles.secondaryActionTitle}>Practice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('CustomTest')}
          >
            <Text style={styles.secondaryActionIcon}>⚙️</Text>
            <Text style={styles.secondaryActionTitle}>Custom Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subject Proficiency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subject Proficiency</Text>
        <View style={styles.subjectsGrid}>
          {Object.entries(proficiency).slice(0, 6).map(([key, data]) => (
            <View key={key} style={styles.subjectCard}>
              <Text style={styles.subjectName}>{data.subject}</Text>
              <Text style={styles.topicName}>{data.topic}</Text>
              <View style={styles.miniProgressBar}>
                <View
                  style={[
                    styles.miniProgressFill,
                    {
                      width: `${data.proficiencyLevel}%`,
                      backgroundColor: getProficiencyColor(data.proficiencyLevel),
                    },
                  ]}
                />
              </View>
              <Text style={styles.subjectLevel}>{data.proficiencyLevel}%</Text>
            </View>
          ))}
        </View>
        {Object.keys(proficiency).length === 0 && (
          <Text style={styles.emptyText}>Complete tests to see your proficiency</Text>
        )}
      </View>

      {/* Recent Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tests</Text>
        {recentSessions.length > 0 ? (
          recentSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.testCard}
              onPress={() => navigation.navigate('Results', { sessionId: session.id })}
            >
              <View style={styles.testCardLeft}>
                <Text style={styles.testCardDate}>
                  {new Date(session.finishedAt).toLocaleDateString()}
                </Text>
                <Text style={styles.testCardInfo}>
                  {session.questions?.length || 0} questions
                </Text>
              </View>
              <View style={styles.testCardRight}>
                <Text
                  style={[
                    styles.testCardScore,
                    { color: getProficiencyColor(session.score) },
                  ]}
                >
                  {session.score}%
                </Text>
                <Text style={styles.testCardDetail}>
                  {session.correct}/{session.total}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No tests completed yet</Text>
        )}
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementBadge}>
                <Text style={styles.achievementIcon}>🏆</Text>
                <Text style={styles.achievementName}>{achievement.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Complete tests to earn achievements!</Text>
          )}
        </ScrollView>
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
    backgroundColor: '#4a90d9',
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
  syncButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  proficiencyCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  proficiencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  proficiencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  proficiencyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  proficiencyBarContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  proficiencyBar: {
    height: '100%',
    borderRadius: 6,
  },
  proficiencyValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginTop: 12,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  primaryAction: {
    backgroundColor: '#27ae60',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  primaryActionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  primaryActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  secondaryActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  subjectCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  topicName: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  miniProgressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 4,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectLevel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
  },
  testCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  testCardLeft: {
    flex: 1,
  },
  testCardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  testCardInfo: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  testCardRight: {
    alignItems: 'flex-end',
  },
  testCardScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  testCardDetail: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  achievementBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    padding: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default HomeScreen;
