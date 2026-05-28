import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;

export { useAuthStore } from './auth';
export { useCourseStore } from './courses';
export { useAssessmentStore } from './assessments';
export { useNotificationStore } from './notifications';
export { useUserStore } from './users';
