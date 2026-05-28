import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);

  function addRealtimeNotification(data: { title: string; message: string; type: string; timestamp: string }) {
    notifications.value.unshift({
      id: `rt-${Date.now()}`,
      title: data.title,
      message: data.message,
      type: data.type as any,
      is_read: false,
      created_at: data.timestamp,
    });
    unreadCount.value++;
  }

  async function fetchNotifications() {
    loading.value = true;
    try {
      const { data } = await api.get('/notifications');
      notifications.value = data.notifications;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUnreadCount() {
    const { data } = await api.get('/notifications/unread-count');
    unreadCount.value = data.count;
  }

  async function markAsRead(notificationId: string) {
    await api.put(`/notifications/${notificationId}/read`);
    const notif = notifications.value.find(n => n.id === notificationId);
    if (notif) notif.is_read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }

  async function markAllAsRead() {
    await api.put('/notifications/read-all');
    notifications.value.forEach(n => n.is_read = true);
    unreadCount.value = 0;
  }

  return {
    notifications,
    unreadCount,
    loading,
    addRealtimeNotification,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
});
