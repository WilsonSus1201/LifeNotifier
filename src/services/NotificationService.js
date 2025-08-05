import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class NotificationService {
  static async initialize() {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }
    return true;
  }

  static async scheduleReminder(reminder) {
    try {
      const trigger = new Date(reminder.dateTime);
      
      // Make sure the trigger is in the future
      if (trigger <= new Date()) {
        throw new Error('Reminder time must be in the future');
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder',
          body: reminder.title,
          data: { reminderId: reminder.id },
          sound: true,
        },
        trigger: {
          date: trigger,
        },
      });

      // Update the reminder with the notification ID
      reminder.notificationId = notificationId;
      
      // Save updated reminders
      const reminders = await this.getReminders();
      const updatedReminders = reminders.map(r => 
        r.id === reminder.id ? reminder : r
      );
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  static async cancelReminder(reminderId) {
    try {
      const reminders = await this.getReminders();
      const reminder = reminders.find(r => r.id === reminderId);
      
      if (reminder && reminder.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  static async getReminders() {
    try {
      const remindersJson = await AsyncStorage.getItem('reminders');
      return remindersJson ? JSON.parse(remindersJson) : [];
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  static async saveReminder(reminder) {
    try {
      const reminders = await this.getReminders();
      
      // Generate ID if not provided
      if (!reminder.id) {
        reminder.id = Date.now().toString();
      }
      
      reminders.push(reminder);
      await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
      
      // Schedule notification if datetime is set
      if (reminder.dateTime) {
        await this.scheduleReminder(reminder);
      }
      
      return reminder;
    } catch (error) {
      console.error('Error saving reminder:', error);
      throw error;
    }
  }

  static async deleteReminder(reminderId) {
    try {
      // Cancel notification first
      await this.cancelReminder(reminderId);
      
      // Remove from storage
      const reminders = await this.getReminders();
      const updatedReminders = reminders.filter(r => r.id !== reminderId);
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
      
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  }

  static async updateReminder(updatedReminder) {
    try {
      // Cancel existing notification
      await this.cancelReminder(updatedReminder.id);
      
      // Update reminder in storage
      const reminders = await this.getReminders();
      const updatedReminders = reminders.map(r => 
        r.id === updatedReminder.id ? updatedReminder : r
      );
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
      
      // Schedule new notification if datetime is set
      if (updatedReminder.dateTime) {
        await this.scheduleReminder(updatedReminder);
      }
      
      return updatedReminder;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  static async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}