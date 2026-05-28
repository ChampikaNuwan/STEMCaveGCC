<template>
  <q-page padding>
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold text-text-light dark:text-text-dark mb-6">Profile</h1>

      <div class="bg-surface-light dark:bg-surface-dark rounded-xl p-8 border border-border-light dark:border-border-dark">
        <div class="flex items-center gap-6 mb-8">
          <div class="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center">
            <span class="text-3xl text-white font-bold">{{ userInitial }}</span>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-text-light dark:text-text-dark">{{ authStore.user?.username }}</h2>
            <q-badge color="primary" class="capitalize mt-1">{{ authStore.user?.role }}</q-badge>
          </div>
        </div>

        <q-separator class="mb-6" />

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <span class="text-sm text-gray-500">Username</span>
            <span class="font-medium text-text-light dark:text-text-dark">{{ authStore.user?.username }}</span>
          </div>
          <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <span class="text-sm text-gray-500">Email</span>
            <span class="font-medium text-text-light dark:text-text-dark">{{ authStore.user?.email }}</span>
          </div>
          <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <span class="text-sm text-gray-500">Role</span>
            <span class="font-medium text-text-light dark:text-text-dark capitalize">{{ authStore.user?.role }}</span>
          </div>
          <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <span class="text-sm text-gray-500">Dark Mode</span>
            <q-toggle v-model="$q.dark.isActive" @update:model-value="$q.dark.toggle()" />
          </div>
        </div>

        <div class="mt-8">
          <q-btn label="Logout" color="negative" unelevated rounded class="full-width touch-target btn-tap h-12" @click="authStore.logout()" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from 'src/stores/auth';

const authStore = useAuthStore();

const userInitial = computed(() => {
  return authStore.user?.username?.charAt(0).toUpperCase() || '?';
});
</script>
