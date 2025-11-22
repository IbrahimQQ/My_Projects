import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CalendarScreen = ({ navigation }) => {
  const {
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    events,
    getEventsForDate,
    addEvent,
    updateEvent,
    deleteEvent,
    completeStudySession,
    settings,
  } = useApp();

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('study');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, date: null });
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      days.push({
        day: i,
        date: dayDate,
        events: getEventsForDate(dayDate),
      });
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayPress = (dayData) => {
    if (dayData.date) {
      setSelectedDate(dayData.date);
    }
  };

  const handleEventPress = (event) => {
    setSelectedEvent(event);
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    const event = {
      title: newEventTitle,
      type: newEventCategory,
      date: selectedDate.toISOString(),
      duration: 60,
      color: getCategoryColor(newEventCategory),
      status: 'scheduled',
    };

    await addEvent(event);
    setNewEventTitle('');
    setShowEventModal(false);
  };

  const handleCompleteSession = async (event) => {
    await completeStudySession(event.id);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async (event) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(event.id);
            setSelectedEvent(null);
          },
        },
      ]
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      study: '#4a90d9',
      exam: '#e74c3c',
      personal: '#27ae60',
      school: '#f39c12',
    };
    return colors[category] || '#4a90d9';
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentMonth);
  const selectedDayEvents = getEventsForDate(selectedDate);

  return (
    <View style={[styles.container, settings.darkMode && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.todayButton}
          onPress={() => {
            setCurrentMonth(new Date());
            setSelectedDate(new Date());
          }}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map((day) => (
          <Text key={day} style={styles.dayHeader}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((dayData, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              isToday(dayData.date) && styles.todayCell,
              isSelected(dayData.date) && styles.selectedCell,
            ]}
            onPress={() => handleDayPress(dayData)}
            disabled={!dayData.date}
          >
            {dayData.day && (
              <>
                <Text
                  style={[
                    styles.dayText,
                    isToday(dayData.date) && styles.todayText,
                    isSelected(dayData.date) && styles.selectedText,
                  ]}
                >
                  {dayData.day}
                </Text>
                {dayData.events && dayData.events.length > 0 && (
                  <View style={styles.eventDots}>
                    {dayData.events.slice(0, 3).map((event, idx) => (
                      <View
                        key={idx}
                        style={[styles.eventDot, { backgroundColor: event.color || '#4a90d9' }]}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Day Events */}
      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={styles.eventsSectionTitle}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <TouchableOpacity
            style={styles.addEventButton}
            onPress={() => setShowEventModal(true)}
          >
            <Text style={styles.addEventButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.eventsList}>
          {selectedDayEvents.length === 0 ? (
            <Text style={styles.noEventsText}>No events scheduled</Text>
          ) : (
            selectedDayEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventCard, { borderLeftColor: event.color || '#4a90d9' }]}
                onPress={() => handleEventPress(event)}
              >
                <View style={styles.eventCardContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {event.duration && ` • ${event.duration} min`}
                  </Text>
                  {event.subject && (
                    <Text style={styles.eventSubject}>{event.subject}</Text>
                  )}
                </View>
                {event.type === 'study' && event.status !== 'completed' && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteSession(event)}
                  >
                    <Text style={styles.completeButtonText}>✓</Text>
                  </TouchableOpacity>
                )}
                {event.status === 'completed' && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>Done</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Add Event Modal */}
      <Modal visible={showEventModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Event</Text>

            <TextInput
              style={styles.input}
              placeholder="Event title"
              value={newEventTitle}
              onChangeText={setNewEventTitle}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryButtons}>
              {['study', 'exam', 'personal', 'school'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    newEventCategory === cat && styles.categoryButtonActive,
                    { borderColor: getCategoryColor(cat) },
                  ]}
                  onPress={() => setNewEventCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      newEventCategory === cat && { color: getCategoryColor(cat) },
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEventModal(false);
                  setNewEventTitle('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddEvent}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Detail Modal */}
      <Modal visible={!!selectedEvent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedEvent && (
              <>
                <View style={[styles.eventDetailHeader, { backgroundColor: selectedEvent.color || '#4a90d9' }]}>
                  <Text style={styles.eventDetailTitle}>{selectedEvent.title}</Text>
                </View>
                <View style={styles.eventDetailContent}>
                  <Text style={styles.eventDetailRow}>
                    📅 {new Date(selectedEvent.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.eventDetailRow}>
                    🕐 {new Date(selectedEvent.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {selectedEvent.duration && (
                    <Text style={styles.eventDetailRow}>
                      ⏱️ {selectedEvent.duration} minutes
                    </Text>
                  )}
                  {selectedEvent.subject && (
                    <Text style={styles.eventDetailRow}>
                      📚 {selectedEvent.subject} - {selectedEvent.topic}
                    </Text>
                  )}
                  {selectedEvent.status === 'completed' && (
                    <View style={styles.completedBanner}>
                      <Text style={styles.completedBannerText}>✓ Completed</Text>
                    </View>
                  )}
                </View>
                <View style={styles.eventDetailActions}>
                  {selectedEvent.type === 'study' && selectedEvent.status !== 'completed' && (
                    <TouchableOpacity
                      style={styles.completeSessionButton}
                      onPress={() => handleCompleteSession(selectedEvent)}
                    >
                      <Text style={styles.completeSessionButtonText}>Mark Complete</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteEventButton}
                    onPress={() => handleDeleteEvent(selectedEvent)}
                  >
                    <Text style={styles.deleteEventButtonText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setSelectedEvent(null)}
                  >
                    <Text style={styles.closeModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 28,
    color: '#4a90d9',
    fontWeight: '300',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginHorizontal: 16,
  },
  todayButton: {
    backgroundColor: '#4a90d9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  dayHeaders: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    paddingBottom: 8,
  },
  dayCell: {
    width: SCREEN_WIDTH / 7,
    height: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
  },
  todayCell: {
    backgroundColor: '#e3f2fd',
  },
  selectedCell: {
    backgroundColor: '#4a90d9',
    borderRadius: 8,
    margin: 2,
    width: SCREEN_WIDTH / 7 - 4,
  },
  dayText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  todayText: {
    fontWeight: 'bold',
    color: '#4a90d9',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  eventDots: {
    flexDirection: 'row',
    marginTop: 4,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  eventsSection: {
    flex: 1,
    padding: 16,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  addEventButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addEventButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  eventsList: {
    flex: 1,
  },
  noEventsText: {
    textAlign: 'center',
    color: '#95a5a6',
    marginTop: 20,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventCardContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  eventSubject: {
    fontSize: 12,
    color: '#4a90d9',
    marginTop: 4,
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: '#155724',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    margin: 16,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 16,
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  categoryButton: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#4a90d9',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  eventDetailHeader: {
    padding: 20,
  },
  eventDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  eventDetailContent: {
    padding: 20,
  },
  eventDetailRow: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
  },
  completedBanner: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  completedBannerText: {
    color: '#155724',
    fontWeight: '600',
  },
  eventDetailActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  completeSessionButton: {
    backgroundColor: '#27ae60',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  completeSessionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteEventButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e74c3c',
    marginBottom: 8,
  },
  deleteEventButtonText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  closeModalButton: {
    padding: 14,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#7f8c8d',
    fontWeight: '600',
  },
});

export default CalendarScreen;
