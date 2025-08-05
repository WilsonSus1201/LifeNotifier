import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NotificationService } from '../services/NotificationService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [reminders, setReminders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadReminders = async () => {
    try {
      const loadedReminders = await NotificationService.getReminders();
      // Sort by date (closest first)
      const sortedReminders = loadedReminders.sort((a, b) => {
        if (!a.dateTime && !b.dateTime) return 0;
        if (!a.dateTime) return 1;
        if (!b.dateTime) return -1;
        return new Date(a.dateTime) - new Date(b.dateTime);
      });
      setReminders(sortedReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  const deleteReminder = (reminderId) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await NotificationService.deleteReminder(reminderId);
            if (success) {
              await loadReminders();
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'No date set';
    
    const date = new Date(dateTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Today at ${timeString}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeString}`;
    } else {
      return `${date.toLocaleDateString()} at ${timeString}`;
    }
  };

  const getTimeStatus = (dateTime) => {
    if (!dateTime) return 'no-date';
    
    const reminderDate = new Date(dateTime);
    const now = new Date();
    
    if (reminderDate < now) {
      return 'overdue';
    } else if (reminderDate - now < 24 * 60 * 60 * 1000) {
      return 'today';
    } else {
      return 'future';
    }
  };

  const renderReminderItem = ({ item }) => {
    const timeStatus = getTimeStatus(item.dateTime);
    
    return (
      <View style={styles.reminderCard}>
        <LinearGradient
          colors={
            timeStatus === 'overdue' 
              ? ['#fee2e2', '#fecaca'] 
              : timeStatus === 'today'
              ? ['#fef3c7', '#fde68a']
              : ['#f0f9ff', '#e0f2fe']
          }
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.reminderTitle}>{item.title}</Text>
              <TouchableOpacity
                onPress={() => deleteReminder(item.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
            
            {item.description && (
              <Text style={styles.reminderDescription}>{item.description}</Text>
            )}
            
            <View style={styles.cardFooter}>
              <View style={styles.timeContainer}>
                <Ionicons 
                  name="time-outline" 
                  size={16} 
                  color={timeStatus === 'overdue' ? '#dc2626' : '#6b7280'} 
                />
                <Text style={[
                  styles.reminderTime,
                  timeStatus === 'overdue' && styles.overdueText
                ]}>
                  {formatDateTime(item.dateTime)}
                </Text>
              </View>
              
              {timeStatus === 'overdue' && (
                <View style={styles.overdueTag}>
                  <Text style={styles.overdueTagText}>Overdue</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Reminders</Text>
        <Text style={styles.headerSubtitle}>
          {reminders.length} {reminders.length === 1 ? 'reminder' : 'reminders'}
        </Text>
      </LinearGradient>

      {reminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No reminders yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to create your first reminder
          </Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          renderItem={renderReminderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddReminder')}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  reminderCard: {
    marginBottom: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    borderRadius: 15,
    padding: 1,
  },
  cardContent: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    padding: 5,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTime: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 5,
  },
  overdueText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  overdueTag: {
    backgroundColor: '#fca5a5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueTagText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});