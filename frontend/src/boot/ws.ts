import { boot } from 'quasar/wrappers';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from 'src/stores/notifications';

let socket: Socket | null = null;

export default boot(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  socket = io('http://localhost:3001', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[WS] Connected:', socket?.id);
  });

  socket.on('notification', (data: { title: string; message: string; type: string; timestamp: string }) => {
    const notifStore = useNotificationStore();
    notifStore.addRealtimeNotification(data);

    // Show Quasar Notify
    import('quasar').then(({ Notify }) => {
      Notify.create({
        message: data.title,
        caption: data.message,
        color: data.type === 'error' ? 'negative' : data.type === 'warning' ? 'warning' : data.type === 'success' ? 'positive' : 'primary',
        position: 'top-right',
        timeout: 5000,
        actions: [{ label: 'Dismiss', color: 'white' }],
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('[WS] Disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('[WS] Connection error:', err.message);
  });
});

export function getSocket(): Socket | null {
  return socket;
}

export function joinCourse(courseId: string) {
  socket?.emit('course:join', courseId);
}

export function leaveCourse(courseId: string) {
  socket?.emit('course:leave', courseId);
}
