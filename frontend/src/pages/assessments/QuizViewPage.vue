<template>
  <q-page padding>
    <div class="max-w-3xl mx-auto">
      <div v-if="loading" class="space-y-4">
        <div class="skeleton h-8 w-1/3 rounded" />
        <div class="skeleton h-48 rounded-xl" />
      </div>

      <template v-else-if="quiz">
        <!-- Breadcrumb -->
        <q-breadcrumbs class="mb-6 text-text-light dark:text-text-dark">
          <q-breadcrumbs-el label="Courses" to="/courses" />
          <q-breadcrumbs-el :label="quiz.title" />
        </q-breadcrumbs>

        <!-- Quiz Header -->
        <div class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-text-light dark:text-text-dark">{{ quiz.title }}</h1>
              <p class="text-sm text-gray-500 mt-1">{{ quiz.questions?.length || 0 }} questions</p>
            </div>
            <q-badge v-if="quiz.is_timed" color="orange" class="text-base px-4 py-2 rounded-lg">
              ⏱ {{ quiz.duration_minutes }} min
            </q-badge>
          </div>
        </div>

        <!-- Quiz Questions -->
        <div v-if="!submitted">
          <div
            v-for="(question, idx) in quiz.questions"
            :key="question.id"
            class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark mb-4"
          >
            <div class="flex items-start gap-3 mb-4">
              <span class="w-8 h-8 rounded-full bg-brand-light text-white flex items-center justify-center text-sm font-bold shrink-0">
                {{ idx + 1 }}
              </span>
              <div class="flex-1">
                <p class="font-medium text-text-light dark:text-text-dark">{{ question.prompt }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ question.points }} point{{ question.points > 1 ? 's' : '' }}</p>
              </div>
            </div>

            <!-- MCQ Options -->
            <div v-if="question.type === 'mcq' && question.choices_json" class="ml-11 space-y-2">
              <q-radio
                v-for="(choice, cIdx) in question.choices_json"
                :key="cIdx"
                v-model="answers[question.id]"
                :val="String(cIdx)"
                :label="choice"
                dense
                class="touch-target"
              />
            </div>

            <!-- True/False -->
            <div v-else-if="question.type === 'true_false'" class="ml-11 space-y-2">
              <q-radio v-model="answers[question.id]" val="true" label="True" dense class="touch-target" />
              <q-radio v-model="answers[question.id]" val="false" label="False" dense class="touch-target" />
            </div>

            <!-- Short Answer -->
            <div v-else class="ml-11">
              <q-input v-model="answers[question.id]" outlined placeholder="Type your answer..." />
            </div>
          </div>

          <!-- Submit Button -->
          <div class="mt-6">
            <q-btn
              v-if="authStore.userRole === 'student'"
              label="Submit Quiz"
              color="brand-light"
              unelevated
              rounded
              class="full-width touch-target btn-tap h-12 text-lg"
              :loading="submitting"
              @click="handleSubmit"
            />
            <p v-else class="text-center text-gray-500">Only students can submit quizzes.</p>
          </div>
        </div>

        <!-- Results (after submission) -->
        <div v-else class="bg-surface-light dark:bg-surface-dark rounded-xl p-8 border border-border-light dark:border-border-dark text-center">
          <div class="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
               :class="result.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'">
            <q-icon :name="result.passed ? 'check_circle' : 'cancel'" :color="result.passed ? 'positive' : 'negative'" size="48px" />
          </div>
          <h2 class="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
            {{ result.passed ? 'Congratulations!' : 'Keep Trying!' }}
          </h2>
          <p class="text-lg text-gray-500 mb-4">
            Your Score: <span class="font-bold" :class="result.passed ? 'text-positive' : 'text-negative'">{{ result.score }}%</span>
          </p>
          <p class="text-sm text-gray-500">
            {{ result.earnedPoints }} / {{ result.totalPoints }} points earned
          </p>
          <q-btn label="Back to Course" flat color="brand-light" class="mt-6 btn-tap" @click="$router.back()" />
        </div>
      </template>

      <div v-else class="text-center py-16">
        <q-icon name="quiz" size="64px" color="grey-5" />
        <p class="text-gray-500 mt-4">Quiz not found.</p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useAssessmentStore } from 'src/stores/assessments';
import type { Quiz } from 'src/types';

const route = useRoute();
const authStore = useAuthStore();
const assessmentStore = useAssessmentStore();

const quiz = ref<Quiz | null>(null);
const loading = ref(true);
const submitting = ref(false);
const submitted = ref(false);
const answers = reactive<Record<string, string>>({});
const result = ref({ score: 0, earnedPoints: 0, totalPoints: 0, passed: false });

onMounted(async () => {
  try {
    quiz.value = await assessmentStore.fetchQuiz(route.params.quizId as string);
    // Initialize answers
    if (quiz.value?.questions) {
      for (const q of quiz.value.questions) {
        answers[q.id] = '';
      }
    }
  } catch {
    quiz.value = null;
  } finally {
    loading.value = false;
  }
});

async function handleSubmit() {
  if (!quiz.value) return;
  submitting.value = true;
  try {
    const answerList = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
    const data = await assessmentStore.submitQuiz(quiz.value.id, answerList);
    result.value = data;
    submitted.value = true;
  } finally {
    submitting.value = false;
  }
};
</script>
