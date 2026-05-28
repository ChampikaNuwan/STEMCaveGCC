import { Router } from 'express';
import { CourseController, ModuleController, LessonController } from '../controllers/course.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Course routes
router.post('/courses', authorize('superadmin', 'admin', 'teacher'), CourseController.create);
router.get('/courses', CourseController.getAll);
router.get('/courses/:courseId', CourseController.getById);
router.get('/courses/:courseId/structure', CourseController.getStructure);
router.put('/courses/:courseId', authorize('superadmin', 'admin', 'teacher'), CourseController.update);
router.delete('/courses/:courseId', authorize('superadmin', 'admin'), CourseController.delete);

// Module routes (nested under courses)
router.post('/courses/:courseId/modules', authorize('superadmin', 'admin', 'teacher'), ModuleController.create);
router.put('/modules/:moduleId', authorize('superadmin', 'admin', 'teacher'), ModuleController.update);
router.delete('/modules/:moduleId', authorize('superadmin', 'admin', 'teacher'), ModuleController.delete);

// Lesson routes (nested under modules)
router.post('/modules/:moduleId/lessons', authorize('superadmin', 'admin', 'teacher'), LessonController.create);
router.get('/lessons/:lessonId', LessonController.getById);
router.put('/lessons/:lessonId', authorize('superadmin', 'admin', 'teacher'), LessonController.update);
router.delete('/lessons/:lessonId', authorize('superadmin', 'admin', 'teacher'), LessonController.delete);

// Lesson media routes
router.post('/lessons/:lessonId/media', authorize('superadmin', 'admin', 'teacher'), LessonController.addMedia);
router.delete('/media/:mediaId', authorize('superadmin', 'admin', 'teacher'), LessonController.deleteMedia);

export default router;
