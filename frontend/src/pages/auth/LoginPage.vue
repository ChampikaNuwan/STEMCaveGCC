<template>
  <q-card class="bg-surface-light dark:bg-surface-dark shadow-xl rounded-xl p-6">
    <q-card-section>
      <h2 class="text-2xl font-bold text-center mb-6 text-text-light dark:text-text-dark">Sign In</h2>

      <q-form @submit="handleLogin" class="space-y-4">
        <q-input
          v-model="usernameOrEmail"
          label="Username or Email"
          outlined
          autocomplete="username"
          :rules="[val => !!val || 'Required']"
          class="min-h-[48px]"
        >
          <template v-slot:prepend><q-icon name="person" /></template>
        </q-input>

        <q-input
          v-model="password"
          label="Password"
          type="password"
          outlined
          autocomplete="current-password"
          :rules="[val => !!val || 'Required']"
          class="min-h-[48px]"
        >
          <template v-slot:prepend><q-icon name="lock" /></template>
        </q-input>

        <q-btn
          label="Sign In"
          type="submit"
          color="brand-light"
          class="full-width touch-target btn-tap h-12"
          :loading="authStore.loading"
          unelevated
          rounded
        />
      </q-form>

      <p v-if="error" class="text-negative text-center mt-4">{{ error }}</p>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const usernameOrEmail = ref('');
const password = ref('');
const error = ref('');

async function handleLogin() {
  error.value = '';
  try {
    await authStore.login(usernameOrEmail.value, password.value);
    router.push('/dashboard');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed. Please try again.';
  }
}
</script>
