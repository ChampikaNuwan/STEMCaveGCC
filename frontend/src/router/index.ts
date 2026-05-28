import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import type { RouteRecordRaw } from 'vue-router';
import type { UserRole } from 'src/types';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  // Auth routes (no layout wrapper needed, AuthLayout handles it)
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('pages/auth/LoginPage.vue') },
    ],
    meta: { guest: true },
  },
  // Dashboard layout (protected)
  {
    path: '/',
    component: () => import('layouts/DashboardLayout.vue'),
    children: [
      { path: 'dashboard', component: () => import('pages/dashboard/DashboardPage.vue'), meta: { requiresAuth: true } },

      // Courses
      { path: 'courses', component: () => import('pages/courses/CoursesPage.vue'), meta: { requiresAuth: true } },
      { path: 'courses/manage', component: () => import('pages/courses/ManageCoursesPage.vue'), meta: { requiresAuth: true, roles: ['superadmin', 'admin', 'teacher'] } },
      { path: 'courses/:courseId', component: () => import('pages/courses/CourseDetailPage.vue'), meta: { requiresAuth: true } },

      // Lessons
      { path: 'lessons/:lessonId', component: () => import('pages/courses/LessonViewPage.vue'), meta: { requiresAuth: true } },

      // Quizzes
      { path: 'quizzes/:quizId', component: () => import('pages/assessments/QuizViewPage.vue'), meta: { requiresAuth: true } },

      // Assignments
      { path: 'assignments/:assignmentId', component: () => import('pages/assessments/AssignmentViewPage.vue'), meta: { requiresAuth: true } },

      // My Submissions
      { path: 'my-submissions', component: () => import('pages/assessments/MySubmissionsPage.vue'), meta: { requiresAuth: true, roles: ['student'] } },

      // Profile
      { path: 'profile', component: () => import('pages/auth/ProfilePage.vue'), meta: { requiresAuth: true } },

      // Admin
      { path: 'admin/users', component: () => import('pages/admin/UserManagementPage.vue'), meta: { requiresAuth: true, roles: ['superadmin', 'admin'] } },
    ],
  },
  // 404
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// Navigation guard
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // Guest routes (login page) — redirect if already logged in
  if (to.meta?.guest && authStore.isAuthenticated) {
    next('/dashboard');
    return;
  }

  // Protected routes
  if (to.meta?.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
    return;
  }

  // Role-based access
  if (to.meta?.roles) {
    const allowedRoles = to.meta.roles as UserRole[];
    if (!authStore.hasAccess(allowedRoles)) {
      next('/dashboard');
      return;
    }
  }

  next();
});

export default router;
