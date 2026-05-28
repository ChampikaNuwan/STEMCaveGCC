<template>
  <q-page padding>
    <div class="max-w-3xl mx-auto">
      <div v-if="loading" class="space-y-4">
        <div class="skeleton h-8 w-1/3 rounded" />
        <div class="skeleton h-48 rounded-xl" />
      </div>

      <template v-else-if="assignment">
        <!-- Breadcrumb -->
        <q-breadcrumbs class="mb-6 text-text-light dark:text-text-dark">
          <q-breadcrumbs-el label="Courses" to="/courses" />
          <q-breadcrumbs-el :label="assignment.title" />
        </q-breadcrumbs>

        <!-- Assignment Header -->
        <div class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark mb-6">
          <h1 class="text-2xl font-bold text-text-light dark:text-text-dark">{{ assignment.title }}</h1>
          <div class="flex items-center gap-4 mt-3">
            <q-badge color="green" class="text-sm px-3 py-1 rounded-lg">
              Due: {{ formatDate(assignment.due_date) }}
            </q-badge>
            <span class="text-sm text-gray-500">{{ daysUntilDue }} remaining</span>
          </div>
          <div v-if="assignment.instructions" class="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p class="text-sm text-text-light dark:text-text-dark whitespace-pre-wrap">{{ assignment.instructions }}</p>
          </div>
        </div>

        <!-- Student Submission Form -->
        <div v-if="authStore.userRole === 'student'" class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark mb-6">
          <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Submit Your Work</h3>
          <q-input
            v-model="submissionText"
            label="Your Answer / Submission Text"
            outlined
            type="textarea"
            rows="6"
            class="mb-4"
          />
          <q-btn
            label="Submit Assignment"
            color="brand-light"
            unelevated
            rounded
            class="touch-target btn-tap h-12"
            :loading="submitting"
            @click="handleSubmit"
          />
        </div>

        <!-- Teacher: View submissions -->
        <div v-if="authStore.hasAccess(['superadmin', 'admin', 'teacher'])" class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
          <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Student Submissions</h3>

          <div v-if="submissions.length === 0" class="text-center py-8 text-gray-500">
            <q-icon name="inbox" size="48px" />
            <p class="mt-2">No submissions yet.</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="sub in submissions"
              :key="sub.id"
              class="p-4 rounded-lg border border-border-light dark:border-border-dark"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-text-light dark:text-text-dark">{{ sub.username }} ({{ sub.email }})</span>
                <span class="text-xs text-gray-500">{{ formatDate(sub.submitted_at) }}</span>
              </div>
              <p v-if="sub.submission_text" class="text-sm text-text-light dark:text-text-dark mb-2 whitespace-pre-wrap">
                {{ sub.submission_text.slice(0, 300) }}{{ sub.submission_text.length > 300 ? '...' : '' }}
              </p>

              <!-- Grading -->
              <div v-if="sub.grade !== null" class="mt-2">
                <q-badge color="positive" :label="'Grade: ' + sub.grade + '%'" />
                <p v-if="sub.feedback" class="text-xs text-gray-500 mt-1">Feedback: {{ sub.feedback }}</p>
              </div>
              <div v-else class="flex items-center gap-2 mt-2">
                <q-input v-model.number="grades[sub.id]" label="Grade %" outlined dense type="number" style="width: 100px" />
                <q-input v-model="feedbacks[sub.id]" label="Feedback" outlined dense style="min-width: 200px" />
                <q-btn label="Submit Grade" color="positive" unelevated dense class="btn-tap" @click="handleGrade(sub.id)" />
              </div>
            </div>
          </div>

          <q-btn
            label="Refresh Submissions"
            flat
            color="brand-light"
            icon="refresh"
            class="mt-4 btn-tap"
            @click="loadSubmissions"
          />
        </div>
      </template>

      <div v-else class="text-center py-16">
        <q-icon name="assignment" size="64px" color="grey-5" />
        <p class="text-gray-500 mt-4">Assignment not found.</p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useAssessmentStore } from 'src/stores/assessments';
import type { Assignment } from 'src/types';

const route = useRoute();
const authStore = useAuthStore();
const assessmentStore = useAssessmentStore();

const assignment = ref<Assignment | null>(null);
const loading = ref(true);
const submitting = ref(false);
const submissionText = ref('');
const submissions = ref<any[]>([]);
const grades = reactive<Record<string, number>>({});
const feedbacks = reactive<Record<string, string>>({});

const daysUntilDue = computed(() => {
  if (!assignment.value) return 'N/A';
  const diff = new Date(assignment.value.due_date).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  return `${days} day${days > 1 ? 's' : ''}`;
});

onMounted(async () => {
  try {
    assignment.value = await assessmentStore.fetchAssignment(route.params.assignmentId as string);
    await loadSubmissions();
  } catch {
    assignment.value = null;
  } finally {
    loading.value = false;
  }
});

async function loadSubmissions() {
  if (!assignment.value || !authStore.hasAccess(['superadmin', 'admin', 'teacher'])) return;
  submissions.value = await assessmentStore.fetchAssignmentSubmissions(assignment.value.id);
}

async function handleSubmit() {
  if (!assignment.value) return;
  submitting.value = true;
  try {
    await assessmentStore.submitAssignment(assignment.value.id, { submissionText: submissionText.value });
    submissionText.value = '';
    alert('Submitted successfully!');
  } finally {
    submitting.value = false;
  }
}

async function handleGrade(submissionId: string) {
  const grade = grades[submissionId];
  const feedback = feedbacks[submissionId] || '';
  if (grade === undefined) return;
  await assessmentStore.gradeAssignmentSubmission(submissionId, grade, feedback);
  await loadSubmissions();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
</script>
