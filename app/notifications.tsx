import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Bell,
  CheckCircle,
  Gift,
  TrendingUp,
  Shield,
  Settings,
  Trash2
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

interface Notification {
  id: string;
  type: 'payment' | 'achievement' | 'security' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: any;
  iconColor: string;
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'payment',
      title: 'Payment Received',
      message: 'You received 25.50 ZYR as a reward for your recent transaction',
      timestamp: '2 hours ago',
      read: false,
      icon: TrendingUp,
      iconColor: '#10B981'
    },
    {
      id: '2',
      type: 'achievement',
      title: 'Achievement Unlocked',
      message: 'Congratulations! You\'ve earned the "Global Explorer" NFT',
      timestamp: '1 day ago',
      read: false,
      icon: Gift,
      iconColor: '#8B5CF6'
    },
    {
      id: '3',
      type: 'system',
      title: 'System Update',
      message: 'A new version of Zyra is available with improved features',
      timestamp: '2 days ago',
      read: true,
      icon: Settings,
      iconColor: '#3B82F6'
    },
    {
      id: '4',
      type: 'security',
      title: 'Security Alert',
      message: 'Your wallet was accessed from a new device. If this wasn\'t you, please review your security settings.',
      timestamp: '3 days ago',
      read: true,
      icon: Shield,
      iconColor: '#F59E0B'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const renderNotificationItem = (notification: Notification) => (
    <TouchableOpacity 
      key={notification.id} 
      style={[
        styles.notificationItem, 
        { backgroundColor: theme.colors.card },
        !notification.read && styles.unreadNotification
      ]}
      onPress={() => markAsRead(notification.id)}
    >
      <View style={[styles.iconContainer, { backgroundColor: notification.iconColor + '20' }]}>
        <notification.icon size={20} color={notification.iconColor} />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>{notification.title}</Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>{notification.message}</Text>
        <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>{notification.timestamp}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteNotification(notification.id)}
      >
        <Trash2 size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <CheckCircle size={20} color="#8B5CF6" />
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadHeader}>
          <Text style={styles.unreadText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length > 0 ? (
          notifications.map(renderNotificationItem)
        ) : (
          <View style={styles.emptyState}>
            <Bell size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No Notifications</Text>
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#EEF2FF',
  },
  unreadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
