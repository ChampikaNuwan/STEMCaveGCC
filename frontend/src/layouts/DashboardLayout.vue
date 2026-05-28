<template>
  <q-layout view="hHh Lpr lff" class="bg-background-light dark:bg-background-dark">
    <!-- Header -->
    <q-header elevated class="bg-brand-light text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleDrawer" class="touch-target btn-tap" />

        <q-toolbar-title class="flex items-center gap-2">
          <span class="text-xl font-bold tracking-tight">🧪 STEM Cave</span>
        </q-toolbar-title>

        <!-- Notifications -->
        <q-btn flat round icon="notifications" class="touch-target btn-tap relative" @click="toggleNotifDrawer">
          <q-badge v-if="notifStore.unreadCount > 0" color="red" floating rounded>
            {{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}
          </q-badge>
        </q-btn>

        <!-- Dark Mode Toggle -->
        <q-btn flat round :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" class="touch-target btn-tap" @click="$q.dark.toggle()" />

        <!-- User Menu -->
        <q-btn-dropdown flat round icon="account_circle" class="touch-target">
          <q-list>
            <q-item clickable v-close-popup @click="$router.push('/profile')">
              <q-item-section avatar><q-icon name="person" /></q-item-section>
              <q-item-section>Profile</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="authStore.logout()">
              <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
              <q-item-section>Logout</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <!-- Navigation Drawer -->
    <q-drawer v-model="drawerOpen" show-if-above bordered :width="260" class="bg-surface-light dark:bg-surface-dark">
      <q-list>
        <!-- Dashboard -->
        <q-item clickable v-ripple to="/dashboard" exact active-class="text-brand-light bg-blue-50 dark:bg-blue-900/20">
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-separator spaced />

        <!-- Courses -->
        <q-item-label header class="text-xs uppercase tracking-wider text-gray-500">Learning</q-item-label>
        <q-item clickable v-ripple to="/courses" active-class="text-brand-light bg-blue-50 dark:bg-blue-900/20">
          <q-item-section avatar><q-icon name="school" /></q-item-section>
          <q-item-section>Courses</q-item-section>
        </q-item>

        <!-- My Submissions (Student only) -->
        <q-item v-if="authStore.userRole === 'student'" clickable v-ripple to="/my-submissions" active-class="text-brand-light bg-blue-50 dark:bg-blue-900/20">
          <q-item-section avatar><q-icon name="assignment" /></q-item-section>
          <q-item-section>My Submissions</q-item-section>
        </q-item>

        <!-- Management (Teacher/Admin only) -->
        <template v-if="authStore.hasAccess(['superadmin', 'admin', 'teacher'])">
          <q-separator spaced />
          <q-item-label header class="text-xs uppercase tracking-wider text-gray-500">Management</q-item-label>
          <q-item clickable v-ripple to="/courses/manage" active-class="text-brand-light bg-blue-50 dark:bg-blue-900/20">
            <q-item-section avatar><q-icon name="edit_note" /></q-item-section>
            <q-item-section>Manage Courses</q-item-section>
          </q-item>
        </template>

        <!-- Admin -->
        <template v-if="authStore.hasAccess(['superadmin', 'admin'])">
          <q-separator spaced />
          <q-item-label header class="text-xs uppercase tracking-wider text-gray-500">Administration</q-item-label>
          <q-item clickable v-ripple to="/admin/users" active-class="text-brand-light bg-blue-50 dark:bg-blue-900/20">
            <q-item-section avatar><q-icon name="people" /></q-item-section>
            <q-item-section>Users</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <!-- Notifications Drawer -->
    <q-drawer v-model="notifDrawerOpen" side="right" bordered :width="360" class="bg-surface-light dark:bg-surface-dark">
      <div class="flex items-center justify-between p-4">
        <h6 class="text-lg font-semibold m-0">Notifications</h6>
        <q-btn flat round dense icon="close" @click="notifDrawerOpen = false" class="touch-target btn-tap" />
      </div>
      <q-separator />
      <div v-if="notifStore.notifications.length === 0" class="flex flex-col items-center justify-center p-8 text-gray-500">
        <q-icon name="notifications_none" size="48px" />
        <p class="mt-2">No notifications yet</p>
      </div>
      <q-list v-else>
        <q-item
          v-for="notif in notifStore.notifications"
          :key="notif.id"
          clickable
          v-ripple
          :class="{ 'bg-blue-50 dark:bg-blue-900/10': !notif.is_read }"
          @click="notifStore.markAsRead(notif.id)"
        >
          <q-item-section avatar>
            <q-icon
              :name="notif.type === 'error' ? 'error' : notif.type === 'warning' ? 'warning' : notif.type === 'success' ? 'check_circle' : 'info'"
              :color="notif.type === 'error' ? 'negative' : notif.type === 'warning' ? 'warning' : notif.type === 'success' ? 'positive' : 'primary'"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ notif.title }}</q-item-label>
            <q-item-label caption>{{ notif.message }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-separator />
      <div class="p-2">
        <q-btn flat label="Mark all as read" class="full-width" @click="notifStore.markAllAsRead()" v-if="notifStore.unreadCount > 0" />
      </div>
    </q-drawer>

    <!-- Page Content -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useNotificationStore } from 'src/stores/notifications';

const authStore = useAuthStore();
const notifStore = useNotificationStore();

const drawerOpen = ref(false);
const notifDrawerOpen = ref(false);

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

function toggleNotifDrawer() {
  notifDrawerOpen.value = !notifDrawerOpen.value;
}

onMounted(() => {
  notifStore.fetchNotifications();
  notifStore.fetchUnreadCount();
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
