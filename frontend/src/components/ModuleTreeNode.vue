<template>
  <div>
    <!-- Module Header -->
    <div
      class="flex items-center gap-3 p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors touch-target"
      @click="expanded = !expanded"
    >
      <q-icon :name="expanded ? 'expand_more' : 'chevron_right'" size="24px" class="text-gray-500" />
      <q-icon name="folder" color="primary" size="20px" />
      <span class="flex-1 font-medium text-text-light dark:text-text-dark">{{ module.title }}</span>

      <!-- Manage buttons (teacher/admin only) -->
      <template v-if="authStore.hasAccess(['superadmin', 'admin', 'teacher'])">
        <q-btn flat round dense icon="add" size="sm" class="touch-target btn-tap" @click.stop="showAddMenu = true">
          <q-menu v-model="showAddMenu">
            <q-list>
              <q-item clickable v-close-popup @click.stop="openAddDialog('module')">
                <q-item-section avatar><q-icon name="create_new_folder" /></q-item-section>
                <q-item-section>Add Sub-Module</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click.stop="openAddDialog('lesson')">
                <q-item-section avatar><q-icon name="article" /></q-item-section>
                <q-item-section>Add Lesson</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click.stop="openAddDialog('quiz')">
                <q-item-section avatar><q-icon name="quiz" /></q-item-section>
                <q-item-section>Add Quiz</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click.stop="openAddDialog('assignment')">
                <q-item-section avatar><q-icon name="assignment" /></q-item-section>
                <q-item-section>Add Assignment</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn flat round dense icon="edit" size="sm" class="touch-target btn-tap" @click.stop="openEditDialog" />
        <q-btn flat round dense icon="delete" size="sm" color="negative" class="touch-target btn-tap" @click.stop="handleDelete" />
      </template>
    </div>

    <!-- Expanded Content -->
    <div v-if="expanded" class="ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
      <!-- Lessons -->
      <div
        v-for="lesson in module.lessons"
        :key="lesson.id"
        class="flex items-center gap-3 p-3 mb-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer touch-target"
        @click="$router.push(`/lessons/${lesson.id}`)"
      >
        <q-icon name="article" color="primary" />
        <span class="flex-1 text-sm text-text-light dark:text-text-dark">{{ lesson.title }}</span>
        <q-icon name="chevron_right" color="grey" />
      </div>

      <!-- Quizzes -->
      <div
        v-for="quiz in module.quizzes"
        :key="quiz.id"
        class="flex items-center gap-3 p-3 mb-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer touch-target"
        @click="$router.push(`/quizzes/${quiz.id}`)"
      >
        <q-icon name="quiz" color="warning" />
        <span class="flex-1 text-sm text-text-light dark:text-text-dark">{{ quiz.title }}</span>
        <q-badge v-if="quiz.is_timed" color="orange" label="Timed" />
        <q-icon name="chevron_right" color="grey" />
      </div>

      <!-- Assignments -->
      <div
        v-for="assignment in module.assignments"
        :key="assignment.id"
        class="flex items-center gap-3 p-3 mb-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer touch-target"
        @click="$router.push(`/assignments/${assignment.id}`)"
      >
        <q-icon name="assignment" color="green" />
        <span class="flex-1 text-sm text-text-light dark:text-text-dark">{{ assignment.title }}</span>
        <q-badge color="green" :label="'Due: ' + formatDate(assignment.due_date)" />
        <q-icon name="chevron_right" color="grey" />
      </div>

      <!-- Child Modules (recursive) -->
      <ModuleTreeNode
        v-for="child in module.children"
        :key="child.id"
        :module="child"
        :course-id="courseId"
        @refresh="$emit('refresh')"
      />
    </div>

    <!-- Add/Edit Dialogs -->
    <q-dialog v-model="dialogOpen">
      <q-card class="bg-surface-light dark:bg-surface-dark rounded-xl w-full max-w-md">
        <q-card-section>
          <h3 class="text-xl font-bold text-text-light dark:text-text-dark">
            {{ dialogMode === 'edit' ? 'Edit Module' : `Add ${capitalize(dialogType)}` }}
          </h3>
        </q-card-section>
        <q-card-section>
          <q-input v-model="form.title" label="Title" outlined :rules="[val => !!val || 'Required']" class="mb-4" />
          <q-input v-if="dialogType === 'lesson'" v-model="form.textContent" label="Content" outlined type="textarea" rows="4" class="mb-4" />
          <template v-if="dialogType === 'quiz'">
            <q-toggle v-model="form.isTimed" label="Timed Quiz" class="mb-2" />
            <q-input v-if="form.isTimed" v-model.number="form.durationMinutes" label="Duration (minutes)" outlined type="number" class="mb-4" />
          </template>
          <q-input v-if="dialogType === 'assignment'" v-model="form.dueDate" label="Due Date & Time" outlined type="datetime-local" class="mb-4" />
          <q-input v-if="dialogType === 'assignment'" v-model="form.instructions" label="Instructions" outlined type="textarea" rows="3" class="mb-4" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup class="btn-tap" />
          <q-btn label="Save" color="brand-light" unelevated @click="handleSave" :loading="saving" class="btn-tap" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useCourseStore } from 'src/stores/courses';
import { useAssessmentStore } from 'src/stores/assessments';
import type { Module } from 'src/types';

const props = defineProps<{
  module: Module;
  courseId: string;
}>();

const emit = defineEmits(['refresh']);

const authStore = useAuthStore();
const courseStore = useCourseStore();
const assessmentStore = useAssessmentStore();

const expanded = ref(false);
const showAddMenu = ref(false);
const dialogOpen = ref(false);
const saving = ref(false);
const dialogType = ref<'module' | 'lesson' | 'quiz' | 'assignment'>('lesson');
const dialogMode = ref<'add' | 'edit'>('add');

const form = ref({
  title: '',
  textContent: '',
  isTimed: false,
  durationMinutes: 0,
  dueDate: '',
  instructions: '',
});

function openAddDialog(type: 'module' | 'lesson' | 'quiz' | 'assignment') {
  dialogType.value = type;
  dialogMode.value = 'add';
  form.value = { title: '', textContent: '', isTimed: false, durationMinutes: 0, dueDate: '', instructions: '' };
  dialogOpen.value = true;
  expanded.value = true;
}

function openEditDialog() {
  dialogType.value = 'module';
  dialogMode.value = 'edit';
  form.value = { ...form.value, title: props.module.title };
  dialogOpen.value = true;
}

async function handleSave() {
  if (!form.value.title) return;
  saving.value = true;
  try {
    if (dialogMode.value === 'edit') {
      await courseStore.updateModule(props.module.id, { title: form.value.title });
    } else if (dialogType.value === 'module') {
      await courseStore.createModule(props.courseId, { title: form.value.title, parentId: props.module.id });
    } else if (dialogType.value === 'lesson') {
      await courseStore.createLesson(props.module.id, { title: form.value.title, textContent: form.value.textContent });
    } else if (dialogType.value === 'quiz') {
      await assessmentStore.createQuiz(props.module.id, {
        title: form.value.title,
        isTimed: form.value.isTimed,
        durationMinutes: form.value.durationMinutes,
      });
    } else if (dialogType.value === 'assignment') {
      await assessmentStore.createAssignment(props.module.id, {
        title: form.value.title,
        instructions: form.value.instructions,
        dueDate: new Date(form.value.dueDate).toISOString(),
      });
    }
    dialogOpen.value = false;
    emit('refresh');
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!confirm(`Delete "${props.module.title}"? This will remove all nested content.`)) return;
  await courseStore.deleteModule(props.module.id);
  emit('refresh');
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
</script>
