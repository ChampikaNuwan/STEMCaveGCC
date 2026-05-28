<template>
  <q-page padding>
    <div class="max-w-4xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="space-y-4">
        <div class="skeleton h-8 w-1/3 rounded" />
        <div class="skeleton h-64 rounded-xl" />
      </div>

      <template v-else-if="lesson">
        <!-- Breadcrumb -->
        <q-breadcrumbs class="mb-6 text-text-light dark:text-text-dark">
          <q-breadcrumbs-el label="Courses" to="/courses" />
          <q-breadcrumbs-el :label="lesson.title" />
        </q-breadcrumbs>

        <!-- Title -->
        <h1 class="text-3xl font-bold text-text-light dark:text-text-dark mb-6">{{ lesson.title }}</h1>

        <!-- Content -->
        <div class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark mb-6">
          <div v-if="lesson.text_content" class="prose dark:prose-invert max-w-none" v-html="renderedContent" />
          <p v-else class="text-gray-500 text-center py-8">No content available for this lesson.</p>
        </div>

        <!-- Media -->
        <div v-if="lesson.media && lesson.media.length > 0" class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
          <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Media & Resources</h3>
          <div class="space-y-3">
            <div v-for="media in lesson.media" :key="media.id" class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <q-icon :name="media.type === 'video_link' ? 'play_circle' : media.type === 'file_upload' ? 'attach_file' : 'link'" color="primary" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-text-light dark:text-text-dark truncate">
                  {{ media.file_name || media.url }}
                </p>
                <p class="text-xs text-gray-500">{{ media.source_provider || media.type }}</p>
              </div>
              <q-btn flat round icon="open_in_new" size="sm" @click="openUrl(media.url)" class="touch-target btn-tap" />
            </div>
          </div>
        </div>

        <!-- Back button -->
        <div class="mt-8">
          <q-btn label="Back to Course" icon="arrow_back" flat color="brand-light" @click="$router.back()" class="btn-tap" />
        </div>
      </template>

      <div v-else class="text-center py-16">
        <q-icon name="article" size="64px" color="grey-5" />
        <p class="text-gray-500 mt-4">Lesson not found.</p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCourseStore } from 'src/stores/courses';
import type { Lesson } from 'src/types';

const route = useRoute();
const courseStore = useCourseStore();

const lesson = ref<Lesson | null>(null);
const loading = ref(true);

const renderedContent = computed(() => {
  if (!lesson.value?.text_content) return '';
  // Convert newlines to <br> tags (simple markdown-like rendering)
  return lesson.value.text_content
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
});

onMounted(async () => {
  try {
    lesson.value = await courseStore.fetchLesson(route.params.lessonId as string);
  } catch {
    lesson.value = null;
  } finally {
    loading.value = false;
  }
});

function openUrl(url: string) {
  window.open(url, '_blank');
}
</script>
