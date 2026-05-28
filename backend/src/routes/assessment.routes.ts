import { Router } from 'express';
import { QuizController, AssignmentController, NotificationController } from '../controllers/assessment.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Quiz routes
router.post('/modules/:moduleId/quizzes', authorize('superadmin', 'admin', 'teacher'), QuizController.create);
router.get('/quizzes/:quizId', QuizController.getById);
router.put('/quizzes/:quizId', authorize('superadmin', 'admin', 'teacher'), QuizController.update);
router.delete('/quizzes/:quizId', authorize('superadmin', 'admin', 'teacher'), QuizController.delete);

// Quiz questions
router.post('/quizzes/:quizId/questions', authorize('superadmin', 'admin', 'teacher'), QuizController.addQuestion);
router.put('/questions/:questionId', authorize('superadmin', 'admin', 'teacher'), QuizController.updateQuestion);
router.delete('/questions/:questionId', authorize('superadmin', 'admin', 'teacher'), QuizController.deleteQuestion);

// Quiz submissions
router.post('/quizzes/:quizId/submit', authorize('student'), QuizController.submit);
router.get('/quizzes/:quizId/submissions', authorize('superadmin', 'admin', 'teacher'), QuizController.getSubmissions);
router.put('/submissions/:submissionId/grade', authorize('superadmin', 'admin', 'teacher'), QuizController.gradeSubmission);

// Assignment routes
router.post('/modules/:moduleId/assignments', authorize('superadmin', 'admin', 'teacher'), AssignmentController.create);
router.get('/assignments/:assignmentId', AssignmentController.getById);
router.put('/assignments/:assignmentId', authorize('superadmin', 'admin', 'teacher'), AssignmentController.update);
router.delete('/assignments/:assignmentId', authorize('superadmin', 'admin', 'teacher'), AssignmentController.delete);

// Assignment submissions
router.post('/assignments/:assignmentId/submit', authorize('student'), AssignmentController.submit);
router.get('/assignments/:assignmentId/submissions', authorize('superadmin', 'admin', 'teacher'), AssignmentController.getSubmissions);
router.get('/assignments/my-submissions', authorize('student'), AssignmentController.getMySubmissions);
router.put('/assignment-submissions/:submissionId/grade', authorize('superadmin', 'admin', 'teacher'), AssignmentController.grade);

// Notification routes
router.get('/notifications', NotificationController.getNotifications);
router.get('/notifications/unread-count', NotificationController.getUnreadCount);
router.put('/notifications/:notificationId/read', NotificationController.markAsRead);
router.put('/notifications/read-all', NotificationController.markAllAsRead);

export default router;
