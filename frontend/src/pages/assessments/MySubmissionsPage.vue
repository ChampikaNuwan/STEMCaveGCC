<template>
  <q-page padding>
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold text-text-light dark:text-text-dark mb-6">My Submissions</h1>

      <div v-if="submissions.length === 0" class="text-center py-16 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
        <q-icon name="assignment" size="64px" color="grey-5" />
        <p class="text-gray-500 mt-4">No submissions yet.</p>
        <q-btn label="Browse Courses" color="brand-light" unelevated rounded class="mt-4 btn-tap" to="/courses" />
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="sub in submissions"
          :key="sub.id"
          class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-semibold text-text-light dark:text-text-dark">Assignment Submission</h3>
              <p class="text-sm text-gray-500">Submitted: {{ formatDate(sub.submitted_at) }}</p>
            </div>
            <q-badge
              v-if="sub.grade !== null"
              :color="sub.grade >= 70 ? 'positive' : sub.grade >= 50 ? 'warning' : 'negative'"
              class="text-base px-4 py-2 rounded-lg"
            >
              {{ sub.grade }}%
            </q-badge>
            <q-badge v-else color="grey" class="text-base px-4 py-2 rounded-lg">Pending</q-badge>
          </div>

          <div v-if="sub.submission_text" class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-3">
            <p class="text-sm text-text-light dark:text-text-dark whitespace-pre-wrap">{{ sub.submission_text.slice(0, 500) }}</p>
          </div>

          <div v-if="sub.feedback" class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-sm font-medium text-blue-700 dark:text-blue-300">Feedback:</p>
            <p class="text-sm text-blue-600 dark:text-blue-400">{{ sub.feedback }}</p>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAssessmentStore } from 'src/stores/assessments';

const assessmentStore = useAssessmentStore();
const submissions = ref<any[]>([]);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

onMounted(async () => {
  submissions.value = await assessmentStore.fetchMySubmissions();
});
</script>
