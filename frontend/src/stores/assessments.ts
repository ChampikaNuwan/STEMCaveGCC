import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import type { Quiz, Assignment, AssignmentSubmission } from 'src/types';

export const useAssessmentStore = defineStore('assessments', () => {
  const currentQuiz = ref<Quiz | null>(null);
  const currentAssignment = ref<Assignment | null>(null);
  const submissions = ref<any[]>([]);
  const mySubmissions = ref<AssignmentSubmission[]>([]);
  const loading = ref(false);

  // Quiz operations
  async function createQuiz(moduleId: string, payload: { title: string; isTimed?: boolean; durationMinutes?: number }) {
    const { data } = await api.post(`/modules/${moduleId}/quizzes`, payload);
    return data;
  }

  async function fetchQuiz(quizId: string) {
    loading.value = true;
    try {
      const { data } = await api.get(`/quizzes/${quizId}`);
      currentQuiz.value = data.quiz;
      return data.quiz;
    } finally {
      loading.value = false;
    }
  }

  async function updateQuiz(quizId: string, payload: any) {
    const { data } = await api.put(`/quizzes/${quizId}`, payload);
    return data;
  }

  async function deleteQuiz(quizId: string) {
    const { data } = await api.delete(`/quizzes/${quizId}`);
    return data;
  }

  // Quiz questions
  async function addQuestion(quizId: string, payload: {
    type: string;
    prompt: string;
    points?: number;
    choicesJson?: string[] | null;
    correctAnswer: string;
  }) {
    const { data } = await api.post(`/quizzes/${quizId}/questions`, payload);
    return data;
  }

  async function updateQuestion(questionId: string, payload: any) {
    const { data } = await api.put(`/questions/${questionId}`, payload);
    return data;
  }

  async function deleteQuestion(questionId: string) {
    const { data } = await api.delete(`/questions/${questionId}`);
    return data;
  }

  // Quiz submission
  async function submitQuiz(quizId: string, answers: { questionId: string; value: string }[]) {
    const { data } = await api.post(`/quizzes/${quizId}/submit`, { answers });
    return data;
  }

  async function fetchQuizSubmissions(quizId: string) {
    const { data } = await api.get(`/quizzes/${quizId}/submissions`);
    submissions.value = data.submissions;
    return data.submissions;
  }

  async function gradeQuizSubmission(submissionId: string, score: number) {
    const { data } = await api.put(`/submissions/${submissionId}/grade`, { score });
    return data;
  }

  // Assignment operations
  async function createAssignment(moduleId: string, payload: { title: string; instructions?: string; dueDate: string }) {
    const { data } = await api.post(`/modules/${moduleId}/assignments`, payload);
    return data;
  }

  async function fetchAssignment(assignmentId: string) {
    loading.value = true;
    try {
      const { data } = await api.get(`/assignments/${assignmentId}`);
      currentAssignment.value = data.assignment;
      return data.assignment;
    } finally {
      loading.value = false;
    }
  }

  async function updateAssignment(assignmentId: string, payload: any) {
    const { data } = await api.put(`/assignments/${assignmentId}`, payload);
    return data;
  }

  async function deleteAssignment(assignmentId: string) {
    const { data } = await api.delete(`/assignments/${assignmentId}`);
    return data;
  }

  async function submitAssignment(assignmentId: string, payload: { submissionText?: string; fileUrl?: string }) {
    const { data } = await api.post(`/assignments/${assignmentId}/submit`, payload);
    return data;
  }

  async function fetchAssignmentSubmissions(assignmentId: string) {
    const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
    submissions.value = data.submissions;
    return data.submissions;
  }

  async function fetchMySubmissions() {
    const { data } = await api.get('/assignments/my-submissions');
    mySubmissions.value = data.submissions;
    return data.submissions;
  }

  async function gradeAssignmentSubmission(submissionId: string, grade: number, feedback: string) {
    const { data } = await api.put(`/assignment-submissions/${submissionId}/grade`, { grade, feedback });
    return data;
  }

  return {
    currentQuiz,
    currentAssignment,
    submissions,
    mySubmissions,
    loading,
    createQuiz,
    fetchQuiz,
    updateQuiz,
    deleteQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    submitQuiz,
    fetchQuizSubmissions,
    gradeQuizSubmission,
    createAssignment,
    fetchAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    fetchAssignmentSubmissions,
    fetchMySubmissions,
    gradeAssignmentSubmission,
  };
});
