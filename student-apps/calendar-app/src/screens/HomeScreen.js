import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const {
    user,
    settings,
    streaks,
    goals,
    proficiencyData,
    getTodaySchedule,
    getUpcomingEvents,
    getRecommendations,
    generateNewStudyPlan,
    syncWithOtherApps,
    completeStudySession,
  } = useApp();

  const todayEvents = getTodaySchedule();
  const upcomingEvents = getUpcomingEvents(7);
  const recommendations = getRecommendations();

  const handleGeneratePlan = async () => {
    Alert.alert(
      'Generate Study Plan',
      'This will create a new study schedule based on your proficiency data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            await generateNewStudyPlan(7);
            Alert.alert('Success', 'Study plan generated for the next 7 days!');
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    await syncWithOtherApps();
    Alert.alert('Synced', 'Data synced with Reader and Test apps');
  };

  const weeklyProgress = goals.weekly?.currentHours || 0;
  const weeklyTarget = goals.weekly?.targetHours || 10;
  const weeklyPercent = Math.min((weeklyProgress / weeklyTarget) * 100, 100);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, {user?.name || 'Student'}!</Text>
          <Text style={styles.subGreeting}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Text style={styles.syncButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Streak & Goals Card */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{streaks.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statValue}>{streaks.longestStreak || 0}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statValue}>{Object.keys(proficiencyData).length}</Text>
          <Text style={styles.statLabel}>Topics</Text>
        </View>
      </View>

      {/* Weekly Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Weekly Study Goal</Text>
          <Text style={styles.progressValue}>{weeklyProgress.toFixed(1)}h / {weeklyTarget}h</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${weeklyPercent}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{Math.round(weeklyPercent)}% completed</Text>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        {todayEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No events scheduled for today</Text>
            <TouchableOpacity style={styles.generateButton} onPress={handleGeneratePlan}>
              <Text style={styles.generateButtonText}>Generate Study Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          todayEvents.slice(0, 4).map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, { borderLeftColor: event.color || '#4a90d9' }]}
              onPress={() => {
                if (event.type === 'study' && event.status !== 'completed') {
                  Alert.alert(
                    'Complete Session?',
                    `Mark "${event.title}" as completed?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Complete', onPress: () => completeStudySession(event.id) },
                    ]
                  );
                }
              }}
            >
              <View style={styles.eventTime}>
                <Text style={styles.eventTimeText}>
                  {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.subject && (
                  <Text style={styles.eventSubject}>{event.subject}</Text>
                )}
              </View>
              {event.status === 'completed' ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓</Text>
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>{event.duration}m</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {recommendations.slice(0, 3).map((rec, index) => (
            <View key={index} style={styles.recommendationCard}>
              <View style={[styles.recommendationIcon, { backgroundColor: rec.priority === 'high' ? '#ffebee' : rec.priority === 'medium' ? '#fff3e0' : '#e8f5e9' }]}>
                <Text style={styles.recommendationIconText}>
                  {rec.type === 'weak_topic' ? '📊' : rec.type === 'review_needed' ? '🔄' : '⚖️'}
                </Text>
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <Text style={styles.recommendationDesc}>{rec.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
            <Text style={styles.seeAllText}>View Calendar</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents.slice(0, 5).map((event) => (
          <View key={event.id} style={styles.upcomingItem}>
            <View style={[styles.upcomingDot, { backgroundColor: event.color || '#4a90d9' }]} />
            <View style={styles.upcomingContent}>
              <Text style={styles.upcomingTitle}>{event.title}</Text>
              <Text style={styles.upcomingDate}>
                {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' at '}
                {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton} onPress={handleGeneratePlan}>
          <Text style={styles.quickActionIcon}>📅</Text>
          <Text style={styles.quickActionText}>Generate Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>Add Event</Text>
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
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  syncButtonText: {
    fontSize: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -20,
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  progressValue: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 5,
  },
  progressPercent: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'right',
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
  },
  seeAllText: {
    fontSize: 14,
    color: '#4a90d9',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#4a90d9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    marginRight: 16,
  },
  eventTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  eventSubject: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d4edda',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#155724',
    fontWeight: 'bold',
  },
  pendingBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    color: '#666',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationIconText: {
    fontSize: 18,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  recommendationDesc: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  upcomingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  upcomingDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default HomeScreen;
