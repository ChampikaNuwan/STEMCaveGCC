import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export const useUserStore = defineStore('users', () => {
  const users = ref<User[]>([]);
  const loading = ref(false);

  async function fetchUsers(role?: string) {
    loading.value = true;
    try {
      const params: any = {};
      if (role) params.role = role;
      const { data } = await api.get('/users', { params });
      users.value = data.users;
      return data.users;
    } finally {
      loading.value = false;
    }
  }

  async function deleteUser(userId: string) {
    const { data } = await api.delete(`/users/${userId}`);
    await fetchUsers();
    return data;
  }

  return { users, loading, fetchUsers, deleteUser };
});
