<template>
  <q-page padding>
    <div class="max-w-6xl mx-auto">
      <!-- Welcome Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-text-light dark:text-text-dark">
          Welcome, {{ authStore.user?.username }}!
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          {{ getGreeting() }} — Role: <span class="capitalize font-medium">{{ authStore.userRole }}</span>
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <q-card class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <q-icon name="school" size="24px" color="primary" />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Courses</p>
              <p class="text-2xl font-bold text-text-light dark:text-text-dark">{{ courseStore.courses.length }}</p>
            </div>
          </div>
        </q-card>

        <q-card class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <q-icon name="assignment" size="24px" color="positive" />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">My Submissions</p>
              <p class="text-2xl font-bold text-text-light dark:text-text-dark">{{ submissionsCount }}</p>
            </div>
          </div>
        </q-card>

        <q-card class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <q-icon name="notifications" size="24px" color="warning" />
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Unread Notifications</p>
              <p class="text-2xl font-bold text-text-light dark:text-text-dark">{{ notifStore.unreadCount }}</p>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Recent Courses -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-text-light dark:text-text-dark">Your Courses</h2>
          <q-btn
            v-if="authStore.hasAccess(['superadmin', 'admin', 'teacher'])"
            label="New Course"
            icon="add"
            color="brand-light"
            unelevated
            rounded
            class="touch-target btn-tap"
            @click="showCreateDialog = true"
          />
        </div>

        <div v-if="courseStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="skeleton h-32 rounded-xl" />
        </div>

        <div v-else-if="courseStore.courses.length === 0" class="text-center py-16">
          <q-icon name="school" size="64px" color="grey-5" />
          <p class="text-gray-400 mt-4">No courses available yet.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <q-card
            v-for="course in courseStore.courses"
            :key="course.id"
            class="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark cursor-pointer hover:shadow-lg transition-shadow duration-200"
            @click="$router.push(`/courses/${course.id}`)"
          >
            <q-card-section>
              <h3 class="text-lg font-semibold text-text-light dark:text-text-dark">{{ course.title }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                {{ course.description || 'No description' }}
              </p>
            </q-card-section>
            <q-separator />
            <q-card-actions>
              <q-btn flat label="View Course" icon="arrow_forward" color="brand-light" class="btn-tap" />
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <!-- Create Course Dialog -->
      <q-dialog v-model="showCreateDialog">
        <q-card class="bg-surface-light dark:bg-surface-dark rounded-xl w-full max-w-md">
          <q-card-section>
            <h3 class="text-xl font-bold text-text-light dark:text-text-dark">Create New Course</h3>
          </q-card-section>
          <q-card-section>
            <q-input v-model="newCourse.title" label="Course Title" outlined :rules="[val => !!val || 'Required']" class="mb-4" />
            <q-input v-model="newCourse.description" label="Description" outlined type="textarea" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" v-close-popup class="btn-tap" />
            <q-btn label="Create" color="brand-light" unelevated @click="handleCreateCourse" :loading="creating" class="btn-tap" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useCourseStore } from 'src/stores/courses';
import { useNotificationStore } from 'src/stores/notifications';
import { useAssessmentStore } from 'src/stores/assessments';

const authStore = useAuthStore();
const courseStore = useCourseStore();
const notifStore = useNotificationStore();
const assessmentStore = useAssessmentStore();

const showCreateDialog = ref(false);
const creating = ref(false);
const newCourse = ref({ title: '', description: '' });
const submissionsCount = ref(0);

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

async function handleCreateCourse() {
  if (!newCourse.value.title) return;
  creating.value = true;
  try {
    await courseStore.createCourse(newCourse.value);
    showCreateDialog.value = false;
    newCourse.value = { title: '', description: '' };
  } finally {
    creating.value = false;
  }
}

onMounted(async () => {
  await courseStore.fetchCourses();
  notifStore.fetchUnreadCount();

  if (authStore.userRole === 'student') {
    const submissions = await assessmentStore.fetchMySubmissions();
    submissionsCount.value = submissions.length;
  }
});
</script>
