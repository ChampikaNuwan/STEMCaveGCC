import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import type { UserRole } from 'src/types';

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role || null);

  async function login(usernameOrEmail: string, password: string) {
    loading.value = true;
    try {
      const { data } = await api.post('/auth/login', { usernameOrEmail, password });
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function register(newUser: { username: string; email: string; role: string; password: string }) {
    const { data } = await api.post('/users/register', newUser);
    return data;
  }

  async function fetchProfile() {
    const { data } = await api.get('/auth/profile');
    user.value = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/#/login';
  }

  function hasAccess(allowedRoles: UserRole[]): boolean {
    if (!user.value) return false;
    return allowedRoles.includes(user.value.role);
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    userRole,
    login,
    register,
    fetchProfile,
    logout,
    hasAccess,
  };
});
