import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import type { Course, Module } from 'src/types';

export const useCourseStore = defineStore('courses', () => {
  const courses = ref<Course[]>([]);
  const currentCourse = ref<Course | null>(null);
  const courseStructure = ref<Module[]>([]);
  const loading = ref(false);

  async function fetchCourses() {
    loading.value = true;
    try {
      const { data } = await api.get('/courses');
      courses.value = data.courses;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCourse(courseId: string) {
    loading.value = true;
    try {
      const { data } = await api.get(`/courses/${courseId}`);
      currentCourse.value = data.course;
      return data.course;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCourseStructure(courseId: string) {
    loading.value = true;
    try {
      const { data } = await api.get(`/courses/${courseId}/structure`);
      currentCourse.value = data.course;
      courseStructure.value = data.modules;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function createCourse(payload: { title: string; description?: string }) {
    const { data } = await api.post('/courses', payload);
    await fetchCourses();
    return data;
  }

  async function updateCourse(courseId: string, payload: { title?: string; description?: string }) {
    const { data } = await api.put(`/courses/${courseId}`, payload);
    return data;
  }

  async function deleteCourse(courseId: string) {
    const { data } = await api.delete(`/courses/${courseId}`);
    await fetchCourses();
    return data;
  }

  // Module operations
  async function createModule(courseId: string, payload: { title: string; parentId?: string | null; sortOrder?: number }) {
    const { data } = await api.post(`/courses/${courseId}/modules`, payload);
    return data;
  }

  async function updateModule(moduleId: string, payload: any) {
    const { data } = await api.put(`/modules/${moduleId}`, payload);
    return data;
  }

  async function deleteModule(moduleId: string) {
    const { data } = await api.delete(`/modules/${moduleId}`);
    return data;
  }

  // Lesson operations
  async function createLesson(moduleId: string, payload: { title: string; textContent?: string; sortOrder?: number }) {
    const { data } = await api.post(`/modules/${moduleId}/lessons`, payload);
    return data;
  }

  async function fetchLesson(lessonId: string) {
    const { data } = await api.get(`/lessons/${lessonId}`);
    return data.lesson;
  }

  async function updateLesson(lessonId: string, payload: any) {
    const { data } = await api.put(`/lessons/${lessonId}`, payload);
    return data;
  }

  async function deleteLesson(lessonId: string) {
    const { data } = await api.delete(`/lessons/${lessonId}`);
    return data;
  }

  async function addLessonMedia(lessonId: string, payload: any) {
    const { data } = await api.post(`/lessons/${lessonId}/media`, payload);
    return data;
  }

  return {
    courses,
    currentCourse,
    courseStructure,
    loading,
    fetchCourses,
    fetchCourse,
    fetchCourseStructure,
    createCourse,
    updateCourse,
    deleteCourse,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    fetchLesson,
    updateLesson,
    deleteLesson,
    addLessonMedia,
  };
});
