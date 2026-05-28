import { Response } from 'express';
import { CourseModel, ModuleModel, LessonModel, LessonMediaModel } from '../models';
import { AuthRequest } from '../types';

export const CourseController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, description } = req.body;
      if (!title) {
        res.status(400).json({ success: false, message: 'Title is required' });
        return;
      }

      const courseId = await CourseModel.create({
        title,
        description,
        teacherId: req.user!.id,
      });

      res.status(201).json({ success: true, courseId });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { limit, offset } = req.query;
      let courses;

      if (req.user!.role === 'teacher') {
        courses = await CourseModel.findByTeacher(req.user!.id);
      } else {
        courses = await CourseModel.findAll(Number(limit) || 50, Number(offset) || 0);
      }

      res.json({ success: true, courses });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const course = await CourseModel.findById(req.params.courseId);
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }
      res.json({ success: true, course });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStructure(req: AuthRequest, res: Response): Promise<void> {
    try {
      const course = await CourseModel.findById(req.params.courseId);
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }

      const modules = await ModuleModel.getFullStructure(req.params.courseId);

      res.json({
        success: true,
        course,
        modules,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const course = await CourseModel.findById(req.params.courseId);
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }

      // Only the assigned teacher or admin/superadmin can update
      if (req.user!.role === 'teacher' && course.teacher_id !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Not your course' });
        return;
      }

      await CourseModel.update(req.params.courseId, req.body);
      res.json({ success: true, message: 'Course updated' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const course = await CourseModel.findById(req.params.courseId);
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }

      await CourseModel.delete(req.params.courseId);
      res.json({ success: true, message: 'Course deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export const ModuleController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, parentId, sortOrder } = req.body;
      if (!title) {
        res.status(400).json({ success: false, message: 'Title is required' });
        return;
      }

      const course = await CourseModel.findById(req.params.courseId);
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }

      if (parentId) {
        const parent = await ModuleModel.findById(parentId);
        if (!parent || parent.course_id !== req.params.courseId) {
          res.status(400).json({ success: false, message: 'Invalid parent module for this course' });
          return;
        }
      }

      const moduleId = await ModuleModel.create({
        courseId: req.params.courseId,
        parentId: parentId || null,
        title,
        sortOrder,
      });

      res.status(201).json({ success: true, moduleId });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const module = await ModuleModel.findById(req.params.moduleId);
      if (!module) {
        res.status(404).json({ success: false, message: 'Module not found' });
        return;
      }

      await ModuleModel.update(req.params.moduleId, req.body);
      res.json({ success: true, message: 'Module updated' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const module = await ModuleModel.findById(req.params.moduleId);
      if (!module) {
        res.status(404).json({ success: false, message: 'Module not found' });
        return;
      }

      await ModuleModel.delete(req.params.moduleId);
      res.json({ success: true, message: 'Module deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export const LessonController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, textContent, sortOrder } = req.body;
      if (!title) {
        res.status(400).json({ success: false, message: 'Title is required' });
        return;
      }

      const lessonId = await LessonModel.create({
        moduleId: req.params.moduleId,
        title,
        textContent,
        sortOrder,
      });

      res.status(201).json({ success: true, lessonId });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const lesson = await LessonModel.findById(req.params.lessonId);
      if (!lesson) {
        res.status(404).json({ success: false, message: 'Lesson not found' });
        return;
      }
      res.json({ success: true, lesson });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const lesson = await LessonModel.findById(req.params.lessonId);
      if (!lesson) {
        res.status(404).json({ success: false, message: 'Lesson not found' });
        return;
      }

      await LessonModel.update(req.params.lessonId, req.body);
      res.json({ success: true, message: 'Lesson updated' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await LessonModel.delete(req.params.lessonId);
      res.json({ success: true, message: 'Lesson deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async addMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, sourceProvider, url, fileName, fileSize } = req.body;
      if (!type || !url) {
        res.status(400).json({ success: false, message: 'Type and url are required' });
        return;
      }

      const mediaId = await LessonMediaModel.create({
        lessonId: req.params.lessonId,
        type,
        sourceProvider,
        url,
        fileName,
        fileSize,
      });

      res.status(201).json({ success: true, mediaId });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
      await LessonMediaModel.delete(req.params.mediaId);
      res.json({ success: true, message: 'Media deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
