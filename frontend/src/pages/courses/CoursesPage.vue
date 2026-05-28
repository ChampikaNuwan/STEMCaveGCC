<template>
  <q-page padding>
    <div class="max-w-6xl mx-auto">
      <!-- Breadcrumb -->
      <div class="mb-6">
        <q-breadcrumbs class="text-text-light dark:text-text-dark">
          <q-breadcrumbs-el label="Courses" to="/courses" />
          <q-breadcrumbs-el label="All Courses" />
        </q-breadcrumbs>
      </div>

      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold text-text-light dark:text-text-dark">All Courses</h1>
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

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <q-btn flat label="View Details" icon="arrow_forward" color="brand-light" class="btn-tap" />
          </q-card-actions>
        </q-card>
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
import { useCourseStore } from 'src/stores/courses';
import { useAuthStore } from 'src/stores/auth';

const courseStore = useCourseStore();
const authStore = useAuthStore();

const showCreateDialog = ref(false);
const creating = ref(false);
const newCourse = ref({ title: '', description: '' });

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

onMounted(() => {
  courseStore.fetchCourses();
});
</script>
