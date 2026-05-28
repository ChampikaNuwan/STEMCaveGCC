<template>
  <q-page padding>
    <div class="max-w-6xl mx-auto">
      <!-- Breadcrumb -->
      <div class="mb-6">
        <q-breadcrumbs class="text-text-light dark:text-text-dark">
          <q-breadcrumbs-el label="Courses" to="/courses" />
          <q-breadcrumbs-el v-if="course" :label="course.title" />
        </q-breadcrumbs>
      </div>

      <!-- Course not loaded -->
      <div v-if="!course && !courseStore.loading" class="text-center py-16">
        <q-icon name="error_outline" size="64px" color="negative" />
        <p class="text-negative mt-4">Course not found.</p>
        <q-btn label="Back to Courses" color="brand-light" to="/courses" unelevated rounded class="mt-4" />
      </div>

      <template v-else-if="course">
        <!-- Course Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-text-light dark:text-text-dark">{{ course.title }}</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-2">{{ course.description || 'No description' }}</p>
        </div>

        <!-- Module Tree -->
        <div v-if="courseStructure.length === 0" class="text-center py-8 text-gray-500">
          <p>No content yet. Modules will appear here once added.</p>
        </div>

        <div v-else class="space-y-2">
          <ModuleTreeNode
            v-for="module in courseStructure"
            :key="module.id"
            :module="module"
            :course-id="course.id"
            @refresh="loadStructure"
          />
        </div>
      </template>

      <!-- Loading skeleton -->
      <div v-if="courseStore.loading" class="space-y-4">
        <div class="skeleton h-10 w-3/4 rounded" />
        <div class="skeleton h-6 w-1/2 rounded" />
        <div class="skeleton h-32 rounded-xl" />
        <div class="skeleton h-32 rounded-xl" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCourseStore } from 'src/stores/courses';
import { joinCourse, leaveCourse } from 'src/boot/ws';
import ModuleTreeNode from 'src/components/ModuleTreeNode.vue';

const route = useRoute();
const courseStore = useCourseStore();

const courseId = route.params.courseId as string;
const course = computed(() => courseStore.currentCourse);
const courseStructure = computed(() => courseStore.courseStructure);

async function loadStructure() {
  await courseStore.fetchCourseStructure(courseId);
}

onMounted(() => {
  loadStructure();
  joinCourse(courseId);
});

onUnmounted(() => {
  leaveCourse(courseId);
});
</script>
