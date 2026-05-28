<template>
  <q-page padding>
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold text-text-light dark:text-text-dark mb-6">Manage Courses</h1>

      <!-- Tabs -->
      <q-tabs v-model="tab" class="mb-6">
        <q-tab name="courses" label="Courses" />
        <q-tab name="modules" label="Modules" />
        <q-tab name="lessons" label="Lessons" />
        <q-tab name="quizzes" label="Quizzes" />
        <q-tab name="assignments" label="Assignments" />
        <q-tab name="grading" label="Grading" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated>
        <!-- Courses Tab -->
        <q-tab-panel name="courses">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-text-light dark:text-text-dark">All Courses</h2>
            <q-btn label="Create Course" icon="add" color="brand-light" unelevated rounded class="btn-tap" @click="showCreateCourse = true" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <q-card v-for="course in courseStore.courses" :key="course.id"
                    class="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
              <q-card-section>
                <h3 class="font-semibold text-text-light dark:text-text-dark">{{ course.title }}</h3>
                <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ course.description || 'No description' }}</p>
              </q-card-section>
              <q-card-actions>
                <q-btn flat label="Edit" icon="edit" color="brand-light" class="btn-tap" @click="openEditCourse(course)" />
                <q-btn flat label="View" icon="visibility" color="primary" class="btn-tap" @click="$router.push(`/courses/${course.id}`)" />
                <q-btn flat label="Delete" icon="delete" color="negative" class="btn-tap" @click="handleDeleteCourse(course.id)" />
              </q-card-actions>
            </q-card>
          </div>
        </q-tab-panel>

        <!-- Modules Tab -->
        <q-tab-panel name="modules">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-text-light dark:text-text-dark">Modules</h2>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Navigate to a course and use the module tree to add/edit modules directly.
          </p>
          <q-btn label="Go to Courses" color="brand-light" unelevated rounded class="mt-4 btn-tap" to="/courses" />
        </q-tab-panel>

        <!-- Lessons Tab -->
        <q-tab-panel name="lessons">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-text-light dark:text-text-dark">Lessons</h2>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Use the course module tree to create and manage lessons within their parent modules.
          </p>
          <q-btn label="Go to Courses" color="brand-light" unelevated rounded class="mt-4 btn-tap" to="/courses" />
        </q-tab-panel>

        <!-- Quizzes Tab -->
        <q-tab-panel name="quizzes">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-text-light dark:text-text-dark">Quizzes</h2>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Manage quizzes and questions from the course module tree.
          </p>
          <q-btn label="Go to Courses" color="brand-light" unelevated rounded class="mt-4 btn-tap" to="/courses" />
        </q-tab-panel>

        <!-- Assignments Tab -->
        <q-tab-panel name="assignments">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-text-light dark:text-text-dark">Assignments</h2>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Create and manage assignments from the course module tree.
          </p>
          <q-btn label="Go to Courses" color="brand-light" unelevated rounded class="mt-4 btn-tap" to="/courses" />
        </q-tab-panel>

        <!-- Grading Tab -->
        <q-tab-panel name="grading">
          <h2 class="text-xl font-bold text-text-light dark:text-text-dark mb-4">Grading Dashboard</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-4">Navigate to individual quizzes or assignments to grade student submissions.</p>
          <q-btn label="Go to Courses" color="brand-light" unelevated rounded class="btn-tap" to="/courses" />
        </q-tab-panel>
      </q-tab-panels>

      <!-- Create/Edit Course Dialog -->
      <q-dialog v-model="showCreateCourse">
        <q-card class="bg-surface-light dark:bg-surface-dark rounded-xl w-full max-w-md">
          <q-card-section>
            <h3 class="text-xl font-bold text-text-light dark:text-text-dark">
              {{ editingCourse ? 'Edit Course' : 'Create Course' }}
            </h3>
          </q-card-section>
          <q-card-section>
            <q-input v-model="courseForm.title" label="Title" outlined :rules="[val => !!val || 'Required']" class="mb-4" />
            <q-input v-model="courseForm.description" label="Description" outlined type="textarea" class="mb-4" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" v-close-popup class="btn-tap" @click="resetCourseForm" />
            <q-btn label="Save" color="brand-light" unelevated @click="handleSaveCourse" :loading="saving" class="btn-tap" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCourseStore } from 'src/stores/courses';

const courseStore = useCourseStore();
const tab = ref('courses');
const showCreateCourse = ref(false);
const editingCourse = ref<any>(null);
const saving = ref(false);
const courseForm = ref({ title: '', description: '' });

function openEditCourse(course: any) {
  editingCourse.value = course;
  courseForm.value = { title: course.title, description: course.description || '' };
  showCreateCourse.value = true;
}

function resetCourseForm() {
  editingCourse.value = null;
  courseForm.value = { title: '', description: '' };
}

async function handleSaveCourse() {
  if (!courseForm.value.title) return;
  saving.value = true;
  try {
    if (editingCourse.value) {
      await courseStore.updateCourse(editingCourse.value.id, courseForm.value);
    } else {
      await courseStore.createCourse(courseForm.value);
    }
    showCreateCourse.value = false;
    resetCourseForm();
  } finally {
    saving.value = false;
  }
}

async function handleDeleteCourse(courseId: string) {
  if (!confirm('Delete this course? This will remove all modules, lessons, and quizzes permanently.')) return;
  await courseStore.deleteCourse(courseId);
}

onMounted(() => {
  courseStore.fetchCourses();
});
</script>
