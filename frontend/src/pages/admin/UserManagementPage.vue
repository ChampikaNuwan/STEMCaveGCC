<template>
  <q-page padding>
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold text-text-light dark:text-text-dark">User Management</h1>
        <q-btn
          v-if="authStore.hasAccess(['superadmin', 'admin', 'teacher'])"
          label="New User"
          icon="person_add"
          color="brand-light"
          unelevated
          rounded
          class="touch-target btn-tap"
          @click="showRegisterDialog = true"
        />
      </div>

      <!-- Role Filters -->
      <div class="mb-6">
        <q-btn-toggle
          v-model="roleFilter"
          toggle-color="brand-light"
          :options="[
            { label: 'All', value: '' },
            { label: 'Superadmins', value: 'superadmin' },
            { label: 'Admins', value: 'admin' },
            { label: 'Teachers', value: 'teacher' },
            { label: 'Students', value: 'student' },
          ]"
          class="bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden"
        />
      </div>

      <!-- Users Table -->
      <div class="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
        <table v-if="userStore.users.length" class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th class="p-4 text-left text-sm font-medium text-gray-500">Username</th>
              <th class="p-4 text-left text-sm font-medium text-gray-500">Email</th>
              <th class="p-4 text-left text-sm font-medium text-gray-500">Role</th>
              <th class="p-4 text-left text-sm font-medium text-gray-500">Created</th>
              <th class="p-4 text-right text-sm font-medium text-gray-500" v-if="authStore.hasAccess(['superadmin', 'admin'])">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in userStore.users"
              :key="user.id"
              class="border-t border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <td class="p-4 text-text-light dark:text-text-dark font-medium">{{ user.username }}</td>
              <td class="p-4 text-gray-500">{{ user.email }}</td>
              <td class="p-4">
                <q-badge
                  :color="user.role === 'superadmin' ? 'purple' : user.role === 'admin' ? 'primary' : user.role === 'teacher' ? 'warning' : 'positive'"
                  class="capitalize"
                >
                  {{ user.role }}
                </q-badge>
              </td>
              <td class="p-4 text-sm text-gray-500">{{ new Date(user.created_at).toLocaleDateString() }}</td>
              <td class="p-4 text-right" v-if="authStore.hasAccess(['superadmin', 'admin'])">
                <q-btn flat round icon="delete" color="negative" size="sm" class="touch-target btn-tap"
                       @click="handleDeleteUser(user.id, user.username)" v-if="authStore.user?.id !== user.id" />
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="p-8 text-center text-gray-500">
          <q-icon name="people_outline" size="48px" />
          <p class="mt-2">No users found</p>
        </div>
      </div>

      <!-- Register User Dialog -->
      <q-dialog v-model="showRegisterDialog">
        <q-card class="bg-surface-light dark:bg-surface-dark rounded-xl w-full max-w-md">
          <q-card-section>
            <h3 class="text-xl font-bold text-text-light dark:text-text-dark">Register New User</h3>
          </q-card-section>
          <q-card-section class="space-y-4">
            <q-input v-model="registerForm.username" label="Username" outlined :rules="[val => !!val || 'Required']" />
            <q-input v-model="registerForm.email" label="Email" outlined type="email" :rules="[val => !!val || 'Required']" />
            <q-select
              v-model="registerForm.role"
              label="Role"
              outlined
              :options="availableRoles"
              :rules="[val => !!val || 'Required']"
            />
            <q-input v-model="registerForm.password" label="Password" outlined type="password" :rules="[val => val.length >= 6 || 'Min 6 characters']" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" v-close-popup class="btn-tap" @click="resetRegisterForm" />
            <q-btn label="Create User" color="brand-light" unelevated @click="handleRegister" :loading="registering" class="btn-tap" />
          </q-card-actions>
          <q-card-section v-if="registerError">
            <p class="text-negative text-sm">{{ registerError }}</p>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useUserStore } from 'src/stores/users';

const authStore = useAuthStore();
const userStore = useUserStore();

const roleFilter = ref('');
const showRegisterDialog = ref(false);
const registering = ref(false);
const registerError = ref('');

const registerForm = ref({
  username: '',
  email: '',
  role: '',
  password: '',
});

const availableRoles = computed(() => {
  const role = authStore.userRole;
  if (role === 'superadmin') return ['superadmin', 'admin', 'teacher', 'student'];
  if (role === 'admin') return ['admin', 'teacher', 'student'];
  if (role === 'teacher') return ['student'];
  return [];
});

function resetRegisterForm() {
  registerForm.value = { username: '', email: '', role: '', password: '' };
  registerError.value = '';
}

async function handleRegister() {
  registerError.value = '';
  registering.value = true;
  try {
    await authStore.register(registerForm.value);
    showRegisterDialog.value = false;
    resetRegisterForm();
    await userStore.fetchUsers(roleFilter.value || undefined);
  } catch (err: any) {
    registerError.value = err.response?.data?.message || 'Registration failed';
  } finally {
    registering.value = false;
  }
}

async function handleDeleteUser(userId: string, username: string) {
  if (!confirm(`Delete user "${username}"? This action cannot be undone.`)) return;
  await userStore.deleteUser(userId);
}

watch(roleFilter, (newVal) => {
  userStore.fetchUsers(newVal || undefined);
});

onMounted(() => {
  userStore.fetchUsers();
});
</script>
